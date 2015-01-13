/**
 * Module dependencies
 */

var _ = require('lodash');
var switchback = require('switchback');
var calculateHash = require('./hash-machine');
var T = require('rttc');
var setTypes = require('./Machine.setTypes');


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
      T.rttc(typeDef, this._configuredInputs, { coerce: this._inputCoercion });
    } catch (err) {
      switchback(this._configuredExits, undefined, undefined, true)(err);
      return;
    }
  }


  // Build schemas for comparing exit values if coercion is enabled
  var _exitSchema = {};
  if(this._exitCoercion) {
    _.each(_.keys(self.exits), function(exitName) {
      var exit = self.exits[exitName];

      var example = exit && exit.example;
      var getExample = exit && exit.getExample;
      if(!example && !getExample) return;

      // Hack to get our example into the same format as inputs
      var obj = {};
      obj[exitName] = {
        getExample: exit.getExample,
        example: exit.example,
        required: true
      };

      var typeDef = setTypes.call(self, obj, _.cloneDeep(self._configuredInputs));

      // If the type is a plain object expand it out to look like a set of inputs
      if(_.isPlainObject(typeDef[exitName] && typeDef[exitName].type)) {
        _.each(_.keys(typeDef[exitName].type), function(key) {
          typeDef[exitName].type[key] = {
            type: typeDef[exitName].type[key]
          };
        });
      }

      _exitSchema[exitName] = typeDef[exitName] && typeDef[exitName].type;
    });
  }

  // Prune undefined configured exits
  self._configuredExits = pruneKeysWithUndefinedValues(self._configuredExits);

  // TODO: if a formerly unspecified exit is specified, undo the fwding and make it explicit

  // TODO: implement Deferred/promise usage..? (maybe-- but better to do this in a wrapper module)

  // TODO:
  // Caching should only be allowed on machines which identify
  // as "cacheable" true.


  // TODO:
  // Eventually, dont' allow `_cache` to be hard-coded as an input-
  // instead reserve it as a private thing because it's weird otherwise.
  // When this is ready to be open-sourced properly, would be a pretty
  // horrible/confusing bug if someone not in the know tried to use the
  // `_cache` input in their own machine.
  if (this._configuredInputs._cache) {
    this._cacheSettings = _.extend(this._cacheSettings, this._configuredInputs._cache);
    delete this._configuredInputs._cache;
  }

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
  var oldCacheEntries;

  // Now attempt a cache lookup, if configured to do so:
  function _cacheLookup (cb) {
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
      _cache.model.find(buildFindCriteria({
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
  }

  // Run the machine
  function _runMachine (err) {
    if (err) {
      // If cache lookup encounters a fatal error, emit a warning
      // but continue (i.e. we fall back to running the machine)
      self.warn(err);
    }

    ////////////////////////////////////////////////////////////////////
    // ||
    // \/  Notice that this code does not run the machine
    //     (we don't need to wait for garbage collection to do that)
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
    var interceptedExits = _.reduce(self._configuredExits, function (m,fn,exitName){

      // Don't mess with this exit if:
      //  • the cache is not enabled for this machine at all
      //  • this exit is not the cacheable exit
      //  • if the hash value could not be calculated before (in which case
      //    we can't safely cache this thing because we don't have a unique
      //    identifier)
      if (!_cache || !hash || exitName !== _cache.exit) {
        m[exitName] = function _interceptExit(value) {

          // Set the `._calledExit` property to indicate that the machine instance's `fn`
          // has attempted to trigger an exit callback.
          self._exited = exitName;

          var exitDef = self.exits && self.exits[exitName];
          var voided = exitDef && exitDef.void || false;

          if(self._exitCoercion && !voided) {
            var schema = _exitSchema[exitName];
            if(!_.isUndefined(schema)) {
              try {
                value = T.rttc(schema, value, { coerce: self._exitCoercion, base: true });
              } catch (err) {
                // Ignore the error for now, it should forward to the
                // catchall error exit eventually (...maybe)
              }
            }
          }

          (function maybeWait(cb){

            // In order to allow for synchronous usage, `async` must be explicitly `true`.
            if (self._runningSynchronously) {
              return cb();
            }
            setTimeout(function (){
              return cb();
            }, 0);
          })(function afterwards() {

            // Ensure that the catchall error exit (`error`) always has a value
            // (i.e. so node callback expectations are fulfilled)
            if (exitName === (self.catchallExit||'error')) {
              voided = false;
              value = typeof value === 'undefined' ? new Error('Unexpected error occurred while running machine.') : value;
            }

            // Don't send back data if the exit has void: true
            if(voided) {
              value = undefined;
            }

            // Call the configured callback for this exit
            return fn.call(self._configuredEnvironment, value);
          });
        };

        return m;
      }

      // If cacheable exit is traversed, cache the output
      m[exitName] = function _interceptExitAndCacheResult(data) {

        // Set the `._calledExit` property to indicate that the machine instance's `fn`
        // has attempted to trigger an exit callback.
        self._exited = exitName;

        var exitDef = self.exits && self.exits[exitName];
        var voided = exitDef && exitDef.void || false;

        _cache.model.create({
          hash: hash,
          data: data
        })
        .exec(function(err) {
          if (err) {
            // If cache write encounters an error, emit a warning but
            // continue with sending back the output
            self.warn(err);
          }

          if(self._exitCoercion) {
            var schema = _exitSchema[exitName];
            if(schema) {
              try {
                T.rttc(typeDef, data, { coerce: this._exitCoercion, base: true });
              } catch (e) {
                // Ignore the error for now, it should forward to the defaultError exit eventually
              }
            }
          }

          // Don't send back data if the exit has void: true
          if(voided) {
            data = undefined;
          }

          // Call the configured callback for this exit
          fn(data);
        });
      };

      return m;
    }, {});

    // Run the machine
    try {
      self.fn.apply(self._configuredEnvironment, [self._configuredInputs, switchback(interceptedExits, undefined, undefined, true), self._configuredEnvironment]);
      return;
    }
    catch(e) {
      return switchback(interceptedExits, undefined, undefined, true)(e);
    }
  }


  // Try the cache lookup and run the machine
  _cacheLookup(_runMachine);

  return this;
};




/**
 * Get the criteria to pass to `.find()` when looking up
 * existing values in this cache for a particular hash.
 */

function buildFindCriteria(options){
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
}

/**
 * Prune undefined values from the specified object.
 *
 * @param  {Object} obj
 * @return {Object}
 * @api private
 */

function pruneKeysWithUndefinedValues(obj) {
  _.each(obj, function (val, key) {
    if (val === undefined) {
      delete obj[key];
    }
  });
  return obj;
}

