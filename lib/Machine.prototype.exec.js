/**
 * Module dependencies
 */

var _ = require('lodash');
var switchback = require('switchback');
var rttc = require('rttc');
var calculateHash = require('./hash-machine');
var setTypes = require('./Machine.setTypes');
var interceptExitCallbacks = require('./intercept-exit-callbacks');


/**
 * [exec description]
 * @param  {[type]} configuredExits [description]
 * @chainable
 */
module.exports = function Machine_prototype_exec (configuredExits) {

  var self = this;

  if (configuredExits) {
    this.setExits(configuredExits);
  }


  // If run time type checking is enabled, ensure the inputs are valid
  if(this._runTimeTypeCheck) {
    try {
      var typeDef = setTypes.call(this, this.inputs, this._configuredInputs);
      rttc.rttc(typeDef, this._configuredInputs, { coerce: this._inputCoercion });
    } catch (e) {
      // Fourth argument (`true`) tells switchback to run synchronously
      switchback(this._configuredExits, undefined, undefined, true)(e);
      return;
    }
  }

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

  // TODO:
  // implement Deferred/promise usage..?
  // (actually, would be better to do this in a wrapper module)


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

      // By default, the "success" exit is cached
      exit: 'success'

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

      ////////////////////////////////////////////////////////////////////
      // ||
      // \/  Notice that this code (if cache is on) does not run the
      //     machine (we don't need to wait for garbage collection to do
      //     that)
      //
      ////////////////////////////////////////////////////////////////////
      //
      // If `> maxOldEntriesBuffer` matching cache records exist, then
      // it's time to clean up.  Go ahead and delete all the old unused
      // cache entries except the newest one
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
      ////////////////////////////////////////////////////////////////////


      // Intercept the exits
      var interceptedExits = interceptExitCallbacks(self._configuredExits, _cache, hash, self);

      // Run the machine
      try {
        self.fn.apply(self._configuredEnvironment, [self._configuredInputs, switchback(interceptedExits, undefined, undefined, true), self._configuredEnvironment]);
        return;
      }
      catch(e) {
        return switchback(interceptedExits, undefined, undefined, true)(e);
      }
    })();
  });


  return this;
};

