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
var rttc = require('rttc');
var buildLamdaMachine = require('./build-lamda-machine');


/**
 * [exec description]
 * @param  {[type]} configuredExits [description]
 * @chainable
 */
module.exports = function Machine_prototype_exec (configuredExits) {

  var self = this;

  // Track timestamp
  if (self._doTrackDuration){
    self._execBeginTimestamp = new Date();
  }

  if (configuredExits) {
    this.setExits(configuredExits);
  }

  Debug('machine:'+self.identity+':exec')('');

  // Only validate & coerce configured input values if `unsafeMode` is disabled.
  var coercedInputValues;
  if (!self._unsafeMode) {
    var validationResults = validateConfiguredInputValues(self);
    coercedInputValues = validationResults.values;
    var errors = validationResults.errors;

    // If there are (still) `e.errors`, then we've got to call the error callback.
    if (errors.length > 0) {
      // If runtime type checking is enabled, trigger the error exit
      // if any inputs are invalid.
      // TODO: call a special '_failedInputValidation' exit here
      if(self._runTimeTypeCheck) {
        // Fourth argument (`true`) tells switchback to run synchronously
        return switchback(self._configuredExits, undefined, undefined, true)((function (){
          // var err = new Error(util.format('`%s` machine: %d error(s) encountered validating inputs:\n', self.identity, errors.length, util.inspect(errors)));
          var err = new Error(util.format('`%s` machine encountered %d error(s) while validating runtime input values: ', self.identity, errors.length, _.pluck(errors, 'stack').join('\n') ));
          // err.code = errors[0].code;
          err.code = 'E_MACHINE_RUNTIME_VALIDATION';
          err.machine = self.identity;
          err.reason = err.message;
          err.status = 400;
          err.errors = errors;
          return err;
        })());
      }
    }
  }


  // If the `_inputCoercion` flag is enabled, configure the machine with the
  // newly coerced input values.
  if (self._inputCoercion) {
    self.setInputs(coercedInputValues);
  }

  // Apply `defaultsTo` for input defs that use it.
  // TODO: consider whether `defaultsTo` values should be automatically
  // validated/coerced too.
  _.each(self.inputs, function (inputDef, inputName){
    if (_.isUndefined(inputDef.defaultsTo)) return;
    if (_.isUndefined(self._configuredInputs[inputName])){
      self._configuredInputs[inputName] = inputDef.defaultsTo;

    // Currently (see TODO above for "why currently") we build machines out of
    // default lamda input values that specify a contract here.
    // Otherwise the default functions would never get built into machine instances,
    // because we're not actually calling rttc.validate() on `defaultsTo` values
    // in general.
    if (!_.isUndefined(inputDef.contract) && (rttc.infer(inputDef.example) === 'lamda')) {
        try {

          // If lamda input def specifies a `defaultsTo`, and no input value was provided, go ahead
          // and instantiate the default function into a machine using the contract.
          self._configuredInputs[inputName] = buildLamdaMachine(inputDef.defaultsTo, inputName, self, self._rootMachine||self);
        }
        catch (e) {
          e.input = inputName;
          e.message = 'machine:'+self.identity+' => Invalid usage- the `defaultsTo` for lamda input "'+inputName+'" could not be built into a machine using the provided `contract`.  Please check that the `contract` def and `defaultsTo` function are valid.  The machine was not executed.\nError details:\n'+e.stack;
          throw e;
          // TODO: pull this fatal error handling (i.e. what the good ole boys call "throwing")
          // out into Machine.build() so it happens as early as possible
        }
      }
    }
  });

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
    _.isFunction(_cache.model.create) &&
    _.isFunction(_cache.model.destroy) &&
    _.isFunction(_cache.model.count)
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


      // Before proceeding, ensure error exit is configured w/
      // a callback. If it is not, then get crazy and **throw** BEFORE
      // calling the machine's `fn`.
      //
      // TODO: can probably remove this-- it's just here as a failsafe
      if (!self._configuredExits.error){
        // console.log('machine:'+self.identity+' => NO ERROR EXIT CONFIGURED!');

        // If it does not, throw.
        throw new Error('machine:'+self.identity+' => Invalid usage- an `error` callback must be provided.  The machine was not executed.');
      }
      // console.log('machine:'+self.identity+' has error exit.');


      // Fill in anonymous forwarding callbacks for any unhandled exits (ignoring the default exit)
      // and have them redirect to the `error` (i.e. catchall) exit
      _.each(_.keys(self.exits), function (exitName) {

        // Skip default exit and error exit
        if ((exitName === 'success') || (exitName === 'error')) {
          return;
        }

        // If exit is unhandled, handle it with a function which triggers the `error` exit.
        // Generates an Error instance with a useful message and passes it as the first argument.
        if (!self._configuredExits[exitName]) {
          Debug('built fwding callback for exit "%s", where there is no implemented callback', exitName);
          self._configuredExits[exitName] = function forwardToErrorExit (_resultPassedInByMachineFn){

            // Build an error instance
            var _err = new Error(util.format('`%s` triggered its `%s` exit', self.identity, exitName) + ((self.exits[exitName] && self.exits[exitName].description)?': '+self.exits[exitName].description:'') + '');
            _err.code = exitName;
            _err.exit = exitName;

            // If a result was passed in, it will be stuff it in the generated Error instance
            // as the `output` property.
            if (!_.isUndefined(_resultPassedInByMachineFn)) {
              _err.output = _resultPassedInByMachineFn;
            }

            // Trigger configured error callback on `_configuredExits` - (which is already a switchback...
            // ...so this should work even if no error callback was explicitly configured...
            // ...but in case it doesn't, we already threw above if no error exit exists)
            // - using our new Error instance as the argument.
            self._configuredExits.error(_err);
          };
        }
      });


      // Intercept the exits to implement exit type coercion, some logging functionality,
      // ensure at least one tick has elapsed (if relevant), etc.
      var interceptedExits = interceptExitCallbacks(self._configuredExits, _cache, hash, self);

      // Now it's time to run the machine fn.
      try {
        // We'll create the ***implementor*** switchback
        // (fourth argument (`true`) tells the switchback to run synchronously)
        var implementorSwitchback = switchback(interceptedExits, undefined, undefined, true);

        // Before calling function, set up a `setTimeout` function that will fire
        // when the runtime duration exceeds the configured `timeout` property.
        // If `timeout` is falsey or <0, then we ignore it.
        if (self._doTrackDuration && self.timeout && self.timeout > 0){
          if (self._timeoutAlarm) {
            throw new Error('Unexpected error occurred: `_timeoutAlarm` should never already exist on a machine instance before it is run.  Perhaps you called `.exec()` more than once?  If so, please fix and try again.');
          }
          self._timeoutAlarm = setTimeout(function (){

            if (self._exited) {
              throw new Error('Unexpected error occurred: timeout alarm should never be triggered when `_exited` is set.  Perhaps you called `.exec()` more than once?  If so, please fix and try again.');
            }
            self._exited = 'error';
            var err = new Error( util.format(
              'This machine took too long to execute (timeout of %dms exceeded.)  '+
              'There is probably an issue in the machine\'s implementation (might have forgotten to call `exits.success()`, etc.)  '+
              'If you are the implementor of this machine, and you\'re sure there are no problems, you can configure '+
              'the maximum expected number of miliseconds for this machine using `timeout` (a top-level property in '+
              'your machine definition).  To disable this protection, set `timeout` to 0.',
              (self.timeout)
            ) );
            err.code = 'E_TIMEOUT';

            // Trigger callback
            implementorSwitchback.error(err);

            // Then immediately set the `_timedOut` flag so when/if `fn` calls its exits,
            // we won't trigger the relevant callback (since we've already triggered `error`).
            self._timedOut = true;

          }, self.timeout);
        }

        // Then call the machine's `fn`.
        self.fn.apply(self._configuredEnvironment, [self._configuredInputs, implementorSwitchback, self._configuredEnvironment]);
        return;
      }
      catch(e) {
        // Here we re-create the ***userland*** switchback and call it with the error that occurred.
        // (fourth argument (`true`) tells switchback to run synchronously)
        //
        // Note that this could probably be removed eventually, since at this point `interceptedExits`
        // should actually already be a switchback.
        return switchback(interceptedExits, undefined, undefined, true)(e);
      }
    })();
  });


  return this;
};

