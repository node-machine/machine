/**
 * Module dependencies
 */

var _ = require('lodash');
var rttc = require('rttc');
var setTypes = require('./Machine.setTypes');


/**
 * Intercept exit callbacks.
 *
 * @param  {Object} callbacks  - an object of callback functions, with a key for each configured exit
 * @param  {Object|false} _cache  - the cache configuration
 * @param  {String} hash  - the hash string representing this particular input configuration
 * @param  {Object} machine
 * @return {Object} of new callbacks which intercept the configured callback functions
 */
module.exports = function interceptExitCallbacks (callbacks, _cache, hash, machine){

  // Build schemas for comparing exit values if coercion is enabled
  var _exitSchema = {};
  if(machine._exitCoercion) {
    _.each(_.keys(machine.exits), function(exitName) {
      var exit = machine.exits[exitName];

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

      var typeDef = setTypes.call(machine, obj, _.cloneDeep(machine._configuredInputs));

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

  return _.reduce(callbacks, function (memo,fn,exitName){

    // Don't cache the output of this exit if:
    //  • the cache is not enabled for this machine at all
    //  • this exit is not the cacheable exit
    //  • if the hash value could not be calculated before (in which case
    //    we can't safely cache this thing because we don't have a unique
    //    identifier)
    var dontCache = !_cache || !hash || exitName !== _cache.exit;


    if (dontCache) {
      memo[exitName] = function _interceptExit(value) {

        // Set the `._calledExit` property to indicate that the machine instance's `fn`
        // has attempted to trigger an exit callback.
        machine._exited = exitName;

        var exitDef = machine.exits && machine.exits[exitName];
        var voided = exitDef && exitDef.void || false;

        if(machine._exitCoercion && !voided) {
          var schema = _exitSchema[exitName];
          if(!_.isUndefined(schema)) {
            try {
              value = rttc.rttc(schema, value, { coerce: machine._exitCoercion, base: true });
            } catch (err) {
              // Ignore the error for now, it should forward to the
              // catchall error exit eventually (...maybe)
            }
          }
        }

        (function maybeWait(cb){

          // In order to allow for synchronous usage, `async` must be explicitly `true`.
          if (machine._runningSynchronously) {
            return cb();
          }
          setTimeout(function (){
            return cb();
          }, 0);
        })(function afterwards() {

          // Ensure that the catchall error exit (`error`) always has a value
          // (i.e. so node callback expectations are fulfilled)
          if (exitName === (machine.catchallExit||'error')) {
            voided = false;
            value = typeof value === 'undefined' ? new Error('Unexpected error occurred while running machine.') : value;
          }

          // Don't send back data if the exit has void: true
          if(voided) {
            value = undefined;
          }

          // Call the configured callback for this exit
          return fn.call(machine._configuredEnvironment, value);
        });
      };

      return memo;
    }

    // If cacheable exit is traversed, cache the output
    memo[exitName] = function _interceptExitAndCacheResult(data) {

      // Set the `._calledExit` property to indicate that the machine instance's `fn`
      // has attempted to trigger an exit callback.
      machine._exited = exitName;

      var exitDef = machine.exits && machine.exits[exitName];
      var voided = exitDef && exitDef.void || false;

      _cache.model.create({
        hash: hash,
        data: data
      })
      .exec(function(err) {
        if (err) {
          // If cache write encounters an error, emit a warning but
          // continue with sending back the output
          machine.warn(err);
        }

        if(machine._exitCoercion) {
          var schema = _exitSchema[exitName];
          if(schema) {
            try {
              rttc.rttc(typeDef, data, { coerce: machine._exitCoercion, base: true });
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

    return memo;
  }, {});
};

