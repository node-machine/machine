/**
 * Module dependencies
 */

var util = require('util');
var _ = require('lodash');
var rttc = require('rttc');
var Debug = require('debug');
var getCombinedErrorStack = require('./get-combined-error-stack');
var removeNonUserlandCallsFromStack = require('./remove-non-userland-calls-from-stack');
var determineEffectiveOutputExample = require('./determine-effective-output-example');


/**
 * interceptExitCallbacks()
 *
 * Build a new dictionary of callbacks by wrapping each of the provided exit callbacks
 * in an intermediary function.
 *
 * > This allows us to inject logic on the way _out_-- i.e. between
 * > the moment when the machine `fn` triggers one of its exits (e.g. `exits.success()`)
 * > and the moment the appropriate prong of the configured switchback is invoked
 * > (e.g. `success: function (){...})`).
 *
 * @param  {Dictionary} callbacks  - a dictionary of callback functions, with a key for each configured exit
 * @param  {Dictionary|false} _cache  - the cache configuration (or `false` if it's not in use)
 * @param  {String} hash?  - the hash string representing this particular input configuration (if the cache is not in use, this is always `undefined`)
 * @param  {Dictionary} machine - the live machine instance
 *
 * @return {Dictionary} of new callbacks which intercept the configured callback functions
 */
module.exports = function interceptExitCallbacks (callbacks, _cache, hash, machine){

  var interceptedCallbacks = _.reduce(callbacks, function (memo,fn,exitName){

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

      var thisStack = (new Error()).stack.split('\n');

      // Remove the first line (the error message) from the stack track.
      thisStack = thisStack.slice(1);

      // Remove all non-userland calls (i.e. calls from the machine runner or internal to Node).
      thisStack = removeNonUserlandCallsFromStack(thisStack);

      // If the machine has already timed out, then we should bail.
      if (machine._timedOut) {
        return;
      }// --•

      // Assert that our `_exited` spinlock has not already been set.
      // If it has, log a warning and bail.
      if (machine._exited) {
        console.warn('In machine `'+_.camelCase(machine.identity)+'`: attempted to call exit `'+exitName+'` after exit `'+machine._exited+'` was already triggered.  If you are the maintainer of this machine, make sure your machine only ever calls one exit, exactly once!');
        return;
      }// --•

      // Now, if appropriate, cache the output.
      (function _cacheIfAppropriate(proceed){
        if (dontCache) {
          return proceed();
        }

        // --•
        try {
          _cache.model.create({
            hash: hash,
            data: value
          }).exec(proceed);
        } catch (e) {
          return proceed(new Error('Consistency violation: Unexpected error when attempting to communicate with the cache via the provided model.  Error details: '+e.stack+'\n- - - - - - - - - - - - - - - - - - - - - - - '));
        }

      })(function afterPotentiallyCaching(err){
        if (err) {
          // If cache write encounters an error, emit a warning but
          // continue with sending back the output.
          machine.warn(err);
        }// >-

        // Look up appropriate exit definition.
        var exitDef = machine.exits && machine.exits[exitName];

        // Determine if the exit has been explicitly "voided".
        // TODO: deprecate this
        var voided = (function _determineIfExitShouldBeVoided(){
          return exitDef && exitDef.void || false;
        })();

        // Coerce exit's output value (if `_exitCoercion` flag enabled)
        if(machine._exitCoercion && !voided) {

          // Get exit's example if possible
          // (will run the exit's getExample() function, or apply its `like` or `itemOf` reference)
          var example;
          try {
            example = determineEffectiveOutputExample(exitDef, exitName, machine._configuredInputs, machine);
          }
          catch (e) {
            // If we encounter an error attempting to figure out the effective output example,
            // emit a warning, but then continue on sending back the output below.
            machine.warn('Encountered issue when attempting to determine example of '+exitName+' exit in machine ('+machine.identity+'): ' + e.stack);
          }
          // >-

          // Only coerce the exit's output value if the `example` is defined.
          if (!_.isUndefined(example)) {

            // Infer a type schema from the effective output example,
            // then use that to coerce the runtime output (`value`).
            try {
              var outputTypeSchema = rttc.infer(example);
              value = rttc.coerce(outputTypeSchema, value);
            } catch (e){
              switch (e.code) {

                // Error due to effective output example turning up invalid:
                case 'E_UNKNOWN_TYPE':
                  // > So, we've discovered that the effective output example is invalid.

                  // If we are intercepting any exit OTHER than `error`,
                  // then we trigger the error exit with an error describing what happened.
                  // > See https://github.com/node-machine/machine/commit/54a0fa6875169b8572853a1dc05069da267e2d89#commitcomment-19063423 for debugging notes.
                  // NOTE we haven't set the `machine._exited` spinlock yet,
                  // so it's okay that we're calling the `error` exit
                  // after having already traversed some other exit.
                  if (exitName !== 'error') {
                    return memo.error(new Error('The effective output example determined for exit (`'+exitName+'`) is not a valid RTTC exemplar: '+util.inspect(example, false, null)));
                  }
                  // --•
                  // Otherwise, we must be intercepting the error exit-- so to avoid recursive loops, we have to be a bit craftier.
                  // To do this, we build a new error and use it as our output (`value`).  Then we break and continue on down below.
                  value = new Error('The effective output example determined for the `error` exit of this machine is not a valid RTTC exemplar: '+util.inspect(example, false, null));
                  break;

                // Misc unrecognized error:
                default:
                  throw new Error('Consistency violation: Encountered unexpected internal error in machine runner when attempting to coerce output for exit (`'+exitName+'`) of machine (`'+machine.identity+'`).  Details: '+e.stack);

              }//</switch>
            }//</catch :: error inferring type schema or coercing against it>
          }//</if :: `example` is NOT undefined>
        }//</if exit coercion is enabled>

        //>-
        (function maybeWait(proceed){

          // In order to allow for synchronous usage, `sync` must be explicitly `true`.
          if (machine._runningSynchronously) {
            return proceed();
          }
          setTimeout(function (){
            return proceed();
          }, 0);

        })(function afterMaybeWaiting() {

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

          // Set the `._exited` property to indicate that the machine instance's `fn`
          // has attempted to trigger an exit callback.
          machine._exited = exitName;

          //  ┌─┐┌┐┌┌─┐┬ ┬┬─┐┌─┐  ┌─┐┬─┐┬─┐┌─┐┬─┐  ┌─┐─┐ ┬┬┌┬┐  ┌─┐┬ ┬┌┬┐┌─┐┬ ┬┌┬┐  ┬┌─┐  ┌─┐┌┐┌
          //  ├┤ │││└─┐│ │├┬┘├┤   ├┤ ├┬┘├┬┘│ │├┬┘  ├┤ ┌┴┬┘│ │   │ ││ │ │ ├─┘│ │ │   │└─┐  ├─┤│││
          //  └─┘┘└┘└─┘└─┘┴└─└─┘  └─┘┴└─┴└─└─┘┴└─  └─┘┴ └─┴ ┴   └─┘└─┘ ┴ ┴  └─┘ ┴   ┴└─┘  ┴ ┴┘└┘
          //  ╔═╗┬─┐┬─┐┌─┐┬─┐
          //  ║╣ ├┬┘├┬┘│ │├┬┘
          //  ╚═╝┴└─┴└─└─┘┴└─
          //
          // If the error exit is being called, make sure the value is an error instance.
          if (exitName === 'error') {
            // If the value is not an error instance, make it one, copying the original value
            // to the `output` property, and copy the stack from `thisStack` created at the
            // beginning of this function _before_ the setTimeout().
            if (!_.isError(value)) {
              var oldValue = value;
              // Create a new, descriptive error.
              value = new Error('Machine `' + machine.identity + '` called its `error` exit with: ' + util.inspect(oldValue, {depth: null}));
              // Set the original value as the `output` property of the error.
              value.output = oldValue;
              // Set the new error's stack to that of `thisStack`, with the error message prepended.
              // We prepend the message because the code below that modifies the stack expects
              // it to be there.
              value.stack = value.message + '\n' + thisStack.join('\n');
            }

            //  ┌─┐─┐ ┬┌─┐┌─┐┌┐┌┌┬┐  ┌─┐┌┬┐┌─┐┌─┐┬┌─  ┌─┐┌─┐┬─┐  ┌─┐┬─┐┬─┐┌─┐┬─┐  ┌─┐┬ ┬┌┬┐┌─┐┬ ┬┌┬┐
            //  ├┤ ┌┴┬┘├─┘├─┤│││ ││  └─┐ │ ├─┤│  ├┴┐  ├┤ │ │├┬┘  ├┤ ├┬┘├┬┘│ │├┬┘  │ ││ │ │ ├─┘│ │ │
            //  └─┘┴ └─┴  ┴ ┴┘└┘─┴┘  └─┘ ┴ ┴ ┴└─┘┴ ┴  └  └─┘┴└─  └─┘┴└─┴└─└─┘┴└─  └─┘└─┘ ┴ ┴  └─┘ ┴
            //
            // At this point, the value is guaranteed to be an error instance.
            // But it may or may not have already had its stack combined with
            // the stacks in the environment.  If not, we'll do it now.
            if (!value.stackModified) {
              value.stack = value.message + '\n' + getCombinedErrorStack(value.stack.split('\n').slice(1), machine._configuredEnvironment.debug.stack);
              value.stackModified = true;
            }
          }

          //  ┬ ┬┌─┐┌┬┐┌─┐┌┬┐┌─┐  ┌─┐┌┐┌┬  ┬  ┌─┐┌┬┐┌─┐┌─┐┬┌─
          //  │ │├─┘ ││├─┤ │ ├┤   ├┤ │││└┐┌┘  └─┐ │ ├─┤│  ├┴┐
          //  └─┘┴  ─┴┘┴ ┴ ┴ └─┘  └─┘┘└┘ └┘   └─┘ ┴ ┴ ┴└─┘┴ ┴
          //  Leaving through an exit means popping something off the stack

          // Pop the last entry off our stack
          var lastStackEntry = machine._configuredEnvironment.debug.stack.pop();

          // console.log('`' + machine.identity + '`.exit stacks:');
          // console.log(machine._configuredEnvironment.debug.stack);
          // console.log('=====');

          // Call the configured callback for this exit
          return fn.call(machine._configuredEnvironment, value);


        });//</self-calling function :: _maybeWait()>
      });//</running self-calling function :: _cacheIfAppropriate()>
    };//</interceptor callback definition>

    return memo;

  }, {});//</_.reduce() :: each configured exit callback>


  // Return the new dictionary of (now-intercepted) callbacks.
  return interceptedCallbacks;

};

