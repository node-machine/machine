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

      // If the machine has already timed out, then we should do nothing.
      if (machine._timedOut) {
        return;
      }

      // Set the `._exited` property to indicate that the machine instance's `fn`
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
          // (will run exit's getExample() function, or apply its `like` or `itemOf` reference)
          var example;
          try {
            example = getExample(exitDef, exitName, machine._configuredInputs, machine);
          }
          catch (e) {
            // If getExample() encounters an error, emit a warning but
            // continue with sending back the output.
            machine.warn('Encountered issue when attempting to determine example of '+exitName+' exit in machine ('+machine.identity+'): ' + e.stack);
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
                  value = new Error('Invalid example specified in the `error` exit definition of this machine:'+util.inspect(example, false, null));
                }
                else {
                  return memo.error(new Error('Invalid example for `'+exitName+'` exit: '+util.inspect(example, false, null)));
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

          var DEBUG_LOG_LINE_LEN = 45;
          var identity = machine.identity;
          var paddedIdentity = _.padRight(_.trunc('machine-log:'+identity, {length: DEBUG_LOG_LINE_LEN, omission: ''}), DEBUG_LOG_LINE_LEN);

          Debug('machine:'+machine.identity+':exec')('%s',machine._exited);
          Debug(paddedIdentity)('     \\_ %s',machine._exited);


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

          // Clear timeout alarm so the error exit callback isn't fired after we're done.
          clearTimeout(machine._timeoutAlarm);

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
function getExample (exitDef, exitName, allConfiguredInputValues, machineDef) {

  // If exit definition does not exist, just return `undefined`.
  if (!exitDef) {
    return;
  }

  // Used below to hold the referenced input definition and its actual configured runtime value, respectively.
  var referencedInputDef;
  var referencedActualVal;

  // If `like` was provided, look up the value of the referenced input,
  // squeeze it until it looks like an rttc-compatible exemplar, then use
  // that as our exemplar for this definition.
  if (!_.isUndefined(exitDef.like)) {
    referencedInputDef = machineDef.inputs[exitDef.like];
    referencedActualVal = allConfiguredInputValues[exitDef.like];

    // Use the `isExemplar` property to determine how best to coerce the actual runtime value.
    referencedActualVal = rttc.coerceExemplar(referencedActualVal, referencedInputDef.isExemplar);

    // Take the type intersection of the runtime value and the static example
    // (we want our real, runtime exemplar that is used for output coercion to
    //  be the narrowest-possible exemplar that accepts the set of values that
    //  statisfy BOTH schemas-- i.e. the intersection.
    //  Note that, input validation/coercion has already run- so this should never fail)
    return rttc.intersection( referencedInputDef.example, referencedActualVal, true, true );
  }

  // If `itemOf` was provided, look up the value of the referenced input and use it.
  if (!_.isUndefined(exitDef.itemOf)) {
    referencedInputDef = machineDef.inputs[exitDef.itemOf];
    referencedActualVal = allConfiguredInputValues[exitDef.itemOf];

    // Use the `isExemplar` property to determine how best to coerce the actual runtime value.
    referencedActualVal = rttc.coerceExemplar(referencedActualVal, referencedInputDef.isExemplar);

    // If the runtime value is an empty array, or unspecified altogether, fall back
    // to using the more-generic example in the referenced input def.
    if (!_.isArray(referencedActualVal) || referencedActualVal.length < 1) {
      return referencedInputDef.example[0];
    }

    // Take the type intersection of the runtime input value's pattern, and the
    // pattern of the static input example
    // (we want our real, runtime exemplar that is used for output coercion to
    //  be the narrowest-possible exemplar that accepts the set of values that
    //  statisfy BOTH schemas-- i.e. the intersection.  This will usually work
    //  Note that, input validation/coercion has already run- so this should never fail)
    return rttc.intersection(referencedInputDef.example[0], referencedActualVal[0], true, true);
  }


  // If `getExample()` was not provided, just return the example.
  if (!exitDef.getExample){
    return exitDef.example;
  }

  // (`getExample()` is provided with a helpful execution-time `env` object)
  var env = {
    _: _
  };

  // Note that input values are prepared exactly the same way we prepared
  // them for `.exec()` (i.e. validating/coercing) precisely _because_ we did
  // that earlier (and set them on the machine instance as `_configuredInputs`)
  //
  // Still, to make sure the `getExample` does not mess things up, we do an extra
  // `cloneDeep`.
  var inputValsForGetExample = _.cloneDeep(allConfiguredInputValues);

  // Note that, potentially, we could exclude values/sub-values where `===` is
  // expected, to avoid any destructive changes from the getExample (e.g. starting
  // to pump on a stream, etc.)  But this could cause unexpected behavior for implementors.
  // For now, we'll pass all input values through.

  var newExample;
  try {
    newExample = exitDef.getExample.apply(env, [inputValsForGetExample, env]);
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

  // Sanitize returned example:
  //  • if returned example is an array, make sure it only has one item.
  //    This is mainly just for sanity- the real enforcement of this part is in
  //    rttc, in the way that it uses the provided `example` for coercion
  //    (that's why we don't have to worry about doing this recursively for nested
  //     arrays)
  if (_.isArray(newExample)) {
    newExample = newExample.slice(0,1);
  }
  //  • turn top-level `null` into `undefined`
  //    (nested `null`s are taken care of by dehydrate() below)
  if (_.isNull(newExample)) {
    newExample = undefined;
  }
  //  • strip out circular references, and don't allow null values/array items
  newExample = rttc.dehydrate(newExample, false);

  return newExample;
}
