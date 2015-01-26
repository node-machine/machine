/**
 * Module dependencies
 */

var util = require('util');
var _ = require('lodash');
var Debug = require('debug');
var switchback = require('switchback');
var calculateHash = require('./hash-machine');
var interceptExitCallbacks = require('./intercept-exit-callbacks');
var validateConfiguredInputValues = require('./validate-configured-input-values');



/**
 * [exec description]
 * @param  {[type]} configuredExits [description]
 * @chainable
 */
module.exports = function Machine_prototype_exec (configuredExits) {

  var self = this;

  if (self._isLogEnabled){
    self._execBeginTimestamp = new Date();
  }

  if (configuredExits) {
    this.setExits(configuredExits);
  }

  Debug('machine:'+self.identity+':exec')('');

  var validationResults = validateConfiguredInputValues(self);
  var coercedInputValues = validationResults.values;
  var errors = validationResults.errors;

  // Strip E_INVALID_TYPE errors if inputCoercion is enabled.
  if (self._inputCoercion) {
    // Strip out minor "E_INVALID_TYPE" errors- they are ok if we're just coercing.
    _.remove(errors, {code: 'E_INVALID_TYPE', minor: true});
  }

  // If there are (still) `e.errors`, then we've got to call the error callback.
  if (errors.length > 0) {
    // If runtime type checking is enabled, trigger the error exit
    // if any inputs are invalid.
    // TODO: call a special 'failedInputValidation' exit here
    if(self._runTimeTypeCheck) {
      // Fourth argument (`true`) tells switchback to run synchronously
      return switchback(self._configuredExits, undefined, undefined, true)((function (){
        var err = new Error(util.format('`%s` machine: %d error(s) encountered validating inputs:\n', self.identity, errors.length, util.inspect(errors)));
        err.code = errors[0].code;
        err.errors = errors;
        return err;
      })());
    }
  }


  // If the `_inputCoercion` flag is enabled, configure the machine with the
  // newly coerced input values.
  if (self._inputCoercion) {
    self.setInputs(coercedInputValues);
  }
  // console.log('_configuredInputs:',self._configuredInputs);

  // Prune undefined configured exits
  self._configuredExits = (function pruneKeysWithUndefinedValues(obj) {
    // Prune undefined values from the specified object.
    _.each(obj, function (val, key) {
      if (val === undefined) {
        delete obj[key];
      }
    });
    return obj;
  })(self._configuredExits);

  // TODO:
  // if a formerly unspecified exit is specified, undo the fwding and make it explicit
  // (not sure about this anymore- leaving this here as a stub for if/when this comes up as
  // a feature req)

  // ********************************************************************************
  // Should we implement Deferred/promise usage..?
  // No- not here. Better to keep things simple in this module and use
  // something like Bluebird to present this abstraction in a wrapper module.
  // Leaving this TODO here for other folks.  Hit @mikermcneil up on
  // Twitter if you're interested in using machines via promises
  // and we'll figure something out.
  // ********************************************************************************

  var _cache = this._cacheSettings;

  // If `_cache` is not valid, null it out.
  if (
    ! (
    _.isObject(_cache) &&
    _.isObject(_cache.model) &&
    _.isFunction(_cache.model.find) &&
    _.isFunction(_cache.model.create)
    )
  ) {
    _cache = false;
  }
  // Otherwise if _cache IS valid, normalize it and apply defaults
  else {
    _.defaults(_cache, {

      // Default TTL (i.e. "max age") is 3 hours
      ttl: 3 * 60 * 60 * 1000,

      // The maximum # of old cache entries to keep for each
      // unique combination of input values for a particular
      // machine type.
      // When this # is exceeded, a query will be performed to
      // wipe them out.  Increasing this value increases memory
      // usage but reduces the # of extra gc queries.  Reducing
      // this value minimizes memory usage but increases the # of
      // gc queries.
      //
      // When set to 0, performs an extra destroy() query every time
      // a cache entry expires (and this is actually fine in most cases,
      // since that might happen only a few times per day)
      maxOldEntriesBuffer: 0,

      // By default, the default (or "success") exit is cached
      exit: self.defaultExit||'success'

    });

    // Pre-calculate the expiration date so we only do it once
    // (and also so it uses a consistent timestamp since the code
    //  below is asynchronous)
    _cache.expirationDate = new Date( (new Date()) - _cache.ttl);
  }


  // Cache lookup
  //
  // The cache uses a hash function to create a unique id for every distinct
  // input configuration (these hash sums are only unique per-machine-type.)
  var hash;
  //
  // Note that this means the machine cache is global not to any particular
  // machine instance, but to the machine type itself-- that is, within the
  // scope of the cache model.
  //
  // e.g.
  //  The cached result of a given set of inputs for a particular type of machine
  //  will be the same for all instances of that machine using the same cache model
  //  (which could be shared across devices/routes/processes/apps/servers/clouds/continents)
  //
  // Old cache entries are garbage collected every time a cache miss occurs
  // (also see `maxOldEntriesBuffer` option above for details)


  // Now attempt a cache lookup, if configured to do so, then run the machine.
  (function _cacheLookup (cb) {
    if (!_cache) return cb();

    // Run hash function to calculate appropriate `hash` criterion
    calculateHash(self, function (err, _calculatedHash){

      // Cache lookup encountered fatal error
      // (could not calculate unique hash for configured input values)
      if (err) return cb(err);

      // Hashsum was calculated successfully
      hash = _calculatedHash;

      // Now hit the provided cache model
      // (remember- we know it's valid because we validated/normalized
      //  our `_cache` variable ahead of time)
      _cache.model.find((function _buildFindCriteria(options){
        // Get the criteria to pass to `.find()` when looking up
        // existing values in this cache for a particular hash.
        return {
          where: {
            createdAt: {
              '>': options.expirationDate
            },
            hash: options.hash
          },
          sort: 'createdAt DESC',
          limit: 1
        };
      })({
        hash: hash,
        expirationDate: _cache.expirationDate
      }))
      .exec(function (err, cached) {
        // Cache lookup encountered fatal error
        if (err) {
          return cb(err);
        }

        // Cache hit
        else if (cached.length && typeof cached[0].data !== 'undefined') {
          // console.log('cache hit', cached);
          var newestCacheEntry = cached[0];
          // Fourth argument (`true`) tells switchback to run synchronously
          return switchback(self._configuredExits, undefined, undefined, true)(null, newestCacheEntry.data);
        }

        // Cache miss
        return cb();
      });

    });
  })(function afterCacheLookup(err){
    if (err) {
      // If cache lookup encounters a fatal error, emit a warning
      // but continue (i.e. we fall back to running the machine)
      self.warn(err);
    }

    // Run the machine
    (function _runMachine () {

      // Perform garbage collection on cache, if necessary.
      //
      // If `> maxOldEntriesBuffer` matching cache records exist, then
      // it's time to clean up.  Go ahead and delete all the old unused
      // cache entries except the newest one
      //
      // Note that we don't need to wait for garbage collection to run the
      // machine. That happens below.
      //
      // (TODO: pull all this craziness out into a separate module/file)
      if (_cache) {

        _cache.model.count({
          where: {
            createdAt: {
              '<=': _cache.expirationDate
            },
            hash: hash
          }
        }).exec(function (err, numOldCacheEntries){
          if (err) {
            // If this garbage collection diagnostic query encounters a fatal error,
            // emit a warning and then don't do anything else for now.
            self.warn(err);
          }

          if (numOldCacheEntries > _cache.maxOldEntriesBuffer) {
            // console.log('gc();');

            _cache.model.destroy({
              where: {
                createdAt: {
                  '<=': _cache.expirationDate
                },
                hash: hash
              },
              sort: 'createdAt DESC',
              skip: _cache.maxOldEntriesBuffer
            }).exec(function (err, oldCacheEntries) {
              if (err) {
                // If garbage collection encounters a fatal error, emit a warning
                // and then don't do anything else for now.
                self.warn(err);
              }

              // Garbage collection was successful.
              // console.log('-gc success-');

            });
          }
        });
      }


      // Intercept the exits
      var interceptedExits = interceptExitCallbacks(self._configuredExits, _cache, hash, self);

      // Run the machine
      try {
        // Fourth argument (`true`) tells switchback to run synchronously
        self.fn.apply(self._configuredEnvironment, [self._configuredInputs, switchback(interceptedExits, undefined, undefined, true), self._configuredEnvironment]);
        return;
      }
      catch(e) {
        // Fourth argument (`true`) tells switchback to run synchronously
        return switchback(interceptedExits, undefined, undefined, true)(e);
      }
    })();
  });


  return this;
};

