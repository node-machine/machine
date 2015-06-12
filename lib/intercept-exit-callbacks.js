/**
 * Module dependencies
 */

var util = require('util');
var Debug = require('debug');
var _ = require('lodash');
var rttc = require('rttc');


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

  return _.reduce(callbacks, function (memo,fn,exitName){

    // Determine whether or not to cache the output of this exit.
    // Don't do it if:
    //  • the cache is not enabled for this machine at all
    //  • this exit is not the cacheable exit
    //  • if the hash value could not be calculated before (in which case
    //    we can't safely cache this thing because we don't have a unique
    //    identifier)
    var dontCache = !_cache || !hash || exitName !== _cache.exit;

    // Set up an intercept function that will wrap the callback.
    memo[exitName] = function _interceptExit(value) {

      // Set the `._calledExit` property to indicate that the machine instance's `fn`
      // has attempted to trigger an exit callback.
      machine._exited = exitName;

      // If appropriate, cache the output
      (function _cacheIfAppropriate(cb){
        if (dontCache) {
          return cb();
        }
        _cache.model.create({
          hash: hash,
          data: data
        }).exec(cb);
      })(function afterPotentiallyCaching(err){
        if (err) {
          // If cache write encounters an error, emit a warning but
          // continue with sending back the output
          machine.warn(err);
        }

        var exitDef = machine.exits && machine.exits[exitName];
        var voided = (function _determineIfExitShouldBeVoided(){
          return exitDef && exitDef.void || false;
        })();

        // Coerce exit's output value (if `_exitCoercion` flag enabled)
        if(machine._exitCoercion && !voided) {

          // Get exit's example if possible
          // (will run exit's getExample() function if specified)
          var example;
          try {
            example = getExample(exitDef, exitName, machine._configuredInputs);
          }
          catch (e) {
            // If getExample() encounters an error, emit a warning but
            // continue with sending back the output.
            machine.warn(e);
          }

          // Only coerce the exit's output value if the `example`
          // is defined.
          if (!_.isUndefined(example)) {
            try {
              var exampleTypeSchema = rttc.infer(example);
              value = rttc.coerce(exampleTypeSchema, value);
            }
            catch (e){
              // Ignore the error unless it's `E_UNKNOWN_TYPE`.
              if (e.code === 'E_UNKNOWN_TYPE') {
                // Avoid recursive loops
                if (exitName === 'error') {
                  value = new Error('Invalid example specified in the `error` exit definition of this machine:'+util.inspect(example));
                }
                else {
                  return memo.error(new Error('Invalid example for `'+exitName+'` exit: '+util.inspect(example)));
                }
              }
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
          if (exitName === 'error') {
            voided = false;
            value = typeof value === 'undefined' ? new Error('Unexpected error occurred while running machine.') : value;
          }

          // Don't send back data if the exit has void: true
          if(voided) {
            value = undefined;
          }

          Debug('machine:'+machine.identity+':exec')('%s',machine._exited);


          var msElapsed;
          if (machine._doTrackDuration){
            machine._execFinishTimestamp = new Date();
            try {
              msElapsed = machine._execFinishTimestamp.getTime() - machine._execBeginTimestamp.getTime();
              machine._msElapsed = msElapsed;
            }
            catch (e) {
              machine.warn('Error calculating duration of machine execution:\n',e);
            }
          }
          if (machine._isLogEnabled) {
            try {
              machine._output = value;
              machine._onInvoke(machine);
            }
            catch (e) {
              machine.warn('Error logging machine info\n:',e);
            }
          }

          // Call the configured callback for this exit
          return fn.call(machine._configuredEnvironment, value);
        });
      });
    };

    return memo;

  }, {});
};








/**
 * [getExample description]
 * @param  {[type]} exitDef                 [description]
 * @param  {[type]} exitName                [description]
 * @param  {[type]} allConfiguredInputValues [description]
 * @return {[type]}                          [description]
 */
function getExample (exitDef, exitName, allConfiguredInputValues) {

  // If exit definition does not exist, just return `undefined`.
  if (!exitDef) {
    return;
  }

  // If `getExample()` was not provided, just return the example.
  if (!exitDef.getExample){
    return exitDef.example;
  }

  // (`getExample()` is provided with a helpful execution-time `env` object)
  var env = {
    _: _
  };

  var newExample;
  // TODO: prepare the input values the same way we prepare them for `.exec()`
  // TODO: but if possible, exclude `===` values, to avoid any destructive changes from
  //       the getExample (i.e. starting to pump on a stream, etc.)
  try {
    newExample = exitDef.getExample.apply(env, [_.cloneDeep(allConfiguredInputValues), env]);
  }
  catch (e) {
    throw (function (){
      var _err = new Error(util.format('`%s` exit: an error was thrown in the exit\'s `getExample()` function:\n', exitName, util.inspect(e)));
      _err.code = 'E_EXIT_GETEXAMPLE';
      _err.reason = _err.message;
      _err.status = 500;
      return _err;
    })();
  }

  // Validate the returned example:
  // If returned example is an array, make sure it only has one item.
  if (_.isArray(newExample)) {
    newExample = newExample.slice(0,1);
  }

  // TODO: sanitize returned example (dont allow null)

  return newExample;
}
