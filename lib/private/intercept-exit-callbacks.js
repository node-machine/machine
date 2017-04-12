/**
 * Module dependencies
 */

var util = require('util');
var _ = require('@sailshq/lodash');
var rttc = require('rttc');
var Debug = require('debug');
var getCombinedErrorStack = require('./get-combined-error-stack');
var removeNonUserlandCallsFromStack = require('./remove-non-userland-calls-from-stack');
var determineEffectiveOutputExample = require('./determine-effective-output-example');
var getStackTraceWithoutInitialMessage = require('./get-stack-trace-without-initial-message');


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
 * @param  {Dictionary} liveMachine - the live machine instance
 *
 * @return {Dictionary} of new callbacks which intercept the configured callback functions
 */
module.exports = function interceptExitCallbacks (callbacks, _cache, hash, liveMachine){

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

      // `thisStack` is only used if the `_doAlterStack` flag is enabled on the live machine instance.
      // (stack alteration is **experimental** as of machine@v13.x)
      var thisStack;
      // ===================================================================================================================
      if (liveMachine._doAlterStack) {
        thisStack = (new Error()).stack.split('\n');

        // Remove the first line (the error message) from the stack track.
        thisStack = thisStack.slice(1);

        // Remove all non-userland calls (i.e. calls from the machine runner or internal to Node).
        thisStack = removeNonUserlandCallsFromStack(thisStack);
      }//>-
      // ===================================================================================================================

      // If the machine has already timed out, then we should bail.
      if (liveMachine._timedOut) {
        return;
      }// --•

      // Assert that our `_exited` spinlock has not already been set.
      // If it has, log a warning and bail.
      if (liveMachine._exited) {
        console.warn(
          '`'+liveMachine.identity+'` just attempted to trigger its `'+exitName+'` exit, '+
          'but another one of its exits (`'+liveMachine._exited+'`) has already been called!  '+
          'This is probably due to a bug in `'+liveMachine.identity+'`.  But it could also '+
          'possibly be that `'+liveMachine.identity+'` has an overly-aggressive (but otherwise '+
          'harmless) try/catch block, and that your userland callback threw an unhandled error; '+
          'e.g. trying to `JSON.parse()` a non-string.\n'+
          '(If you are the maintainer of `'+liveMachine.identity+'`, make sure your code always '+
          'calls exactly one exit, exactly once-- and avoid writing code like `try { exits.foo(); }`.)'
        );
        if (!_.isUndefined(value)) {
          console.warn(
            '\n'+
            '--\n'+
            'For debugging purposes, here is the output sent along with the extraneous exit attempt:\n'+
            '```\n'+
            util.inspect(value, {depth: 5})+'\n'+
            '```'
          );
        }
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
          liveMachine.warn(err);
        }// >-

        // Look up appropriate exit definition.
        var exitDef = liveMachine.exits && liveMachine.exits[exitName];

        // Determine if the exit has been explicitly "voided".
        // TODO: deprecate this
        var voided = (function _determineIfExitShouldBeVoided(){
          return exitDef && exitDef.void || false;
        })();

        // This will be used to hold the exit's effective output exemplar, if possible.
        var example;

        // Coerce exit's output value (if `_exitCoercion` flag enabled)
        if(liveMachine._exitCoercion && !voided) {

          // Get exit's example if possible
          // (will run the exit's getExample() function, or apply its `like` or `itemOf` reference)
          try {
            example = determineEffectiveOutputExample(exitDef, exitName, liveMachine._configuredInputs, liveMachine);
          }
          catch (e) {
            // If we encounter an error attempting to figure out the effective output example,
            // emit a warning, but then continue on sending back the output below.
            liveMachine.warn('Encountered issue when attempting to determine example of '+exitName+' exit in machine ('+liveMachine.identity+'): ' + e.stack);
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
                  throw new Error('Consistency violation: Encountered unexpected internal error in machine runner when attempting to coerce output for exit (`'+exitName+'`) of machine (`'+liveMachine.identity+'`).  Details: '+e.stack);

              }//</switch>
            }//</catch :: error inferring type schema or coercing against it>
          }//</if :: `example` is NOT undefined>
        }//</if exit coercion is enabled>
        //>-


        // Now, we'll potentially introduce an artificial delay, if necessary.
        // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
        // This is to be sure that our flow control always works like this:
        // ```
        // //1
        // foo().exec(function (err){
        //   //3
        // });
        // //2
        // ```
        //
        // And NEVER like this:
        // ```
        // //1
        // foo().exec(function (err){
        //   //2
        // });
        // //3
        // ```
        // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
        (function maybeArtificiallyWait(proceed){

          // If the machine ran synchronously (i.e. with `.execSync()`), then there's no
          // need to introduce an artificial delay.
          if (liveMachine._runningSynchronously) {
            return proceed();
          }//-•


          // Otherwise, we know that the machine was run asynchronously with `.exec()`.
          //
          // But if its `fn` has already "yielded", that means that it did not call this
          // exit synchronously.  So in that case, we can continue without delay.
          if (liveMachine._hasFnYieldedYet) {
            return proceed();
          }//-•


          // Otherwise, the `fn` has not "yielded" yet, meaning that it called this exit
          // synchronously.  So we'll need to introduce an artificial delay.
          //
          // To do that, we'll use setImmediate() (or `setTimeout(...,0)` if necesary) to
          // ensure that at least one tick goes by.
          if (typeof setImmediate === 'function') {
            setImmediate(function (){
              return proceed();
            });
          }
          else {
            setTimeout(function (){
              return proceed();
            });
          }

        })(function afterMaybeArtificiallyWaiting() {

          // Ensure that the catchall error exit (`error`) always has a value
          // (i.e. so node callback expectations are fulfilled)
          if (exitName === 'error') {
            voided = false;
            if (_.isUndefined(value)) {
              value = new Error('Unexpected error occurred while running `'+liveMachine.identity+'`.');
            }
          }//>-

          // Don't send back data if the exit has void: true
          if(voided) {
            value = undefined;
          }

          var DEBUG_LOG_LINE_LEN = 45;
          var identity = liveMachine.identity;
          var paddedIdentity = _.padRight(_.trunc('machine-log:'+identity, {length: DEBUG_LOG_LINE_LEN, omission: ''}), DEBUG_LOG_LINE_LEN);

          Debug('machine:'+liveMachine.identity+':exec')('%s',liveMachine._exited);
          Debug(paddedIdentity)('     \\_ %s',liveMachine._exited);


          var msElapsed;
          if (liveMachine._doTrackDuration){
            liveMachine._execFinishTimestamp = new Date();
            try {
              msElapsed = liveMachine._execFinishTimestamp.getTime() - liveMachine._execBeginTimestamp.getTime();
              liveMachine._msElapsed = msElapsed;
            }
            catch (e) {
              liveMachine.warn('Consistency violation: Unexpected error calculating duration of liveMachine execution:\n',e);
            }
          }
          if (liveMachine._isLogEnabled) {
            try {
              liveMachine._output = value;
              liveMachine._onInvoke(liveMachine);
            }
            catch (e) {
              liveMachine.warn('Consistency violation: Unexpected error logging liveMachine info\n:',e);
            }
          }

          // Clear timeout alarm so the error exit callback isn't fired after we're done.
          clearTimeout(liveMachine._timeoutAlarm);

          // Set the `._exited` property to indicate that the liveMachine instance's `fn`
          // has attempted to trigger an exit callback.
          liveMachine._exited = exitName;

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
            // to the `output` property
            if (!_.isError(value)) {

              var oldValue = value;
              // Create a new, descriptive error.
              value = new Error('`' + liveMachine.identity + '` called its `error` exit with:\n' + util.inspect(oldValue, {depth: null}));
              // Set the original value as the `output` property of the error.
              value.output = oldValue;

              // ===================================================================================================================
              if (liveMachine._doAlterStack) {
                // Finally, copy the stack from `thisStack` created at the
                // beginning of this function _before_ the setImmediate().

                // Set the new error's stack to that of `thisStack`, with the error message prepended.
                // We prepend the message because the code below that modifies the stack expects
                // it to be there.
                value.stack = value.message + '\n' + thisStack.join('\n');
              }//>-
              // ===================================================================================================================

            }//</if output is NOT an error instance>

            // ===================================================================================================================
            if (liveMachine._doAlterStack) {
              //  ┌─┐─┐ ┬┌─┐┌─┐┌┐┌┌┬┐  ┌─┐┌┬┐┌─┐┌─┐┬┌─  ┌─┐┌─┐┬─┐  ┌─┐┬─┐┬─┐┌─┐┬─┐  ┌─┐┬ ┬┌┬┐┌─┐┬ ┬┌┬┐
              //  ├┤ ┌┴┬┘├─┘├─┤│││ ││  └─┐ │ ├─┤│  ├┴┐  ├┤ │ │├┬┘  ├┤ ├┬┘├┬┘│ │├┬┘  │ ││ │ │ ├─┘│ │ │
              //  └─┘┴ └─┴  ┴ ┴┘└┘─┴┘  └─┘ ┴ ┴ ┴└─┘┴ ┴  └  └─┘┴└─  └─┘┴└─┴└─└─┘┴└─  └─┘└─┘ ┴ ┴  └─┘ ┴
              //
              // At this point, the value is guaranteed to be an error instance.
              // But it may or may not have already had its stack combined with
              // the stacks in the environment.  If not, we'll do it now.
              if (!value.stackModified) {
                value.stack = value.name + ': ' + value.message + '\n' + getCombinedErrorStack(getStackTraceWithoutInitialMessage(value).split('\n'), liveMachine._configuredEnvironment.debug.stack);
                // Indicate that we've already massaged this stack, so we don't do it again.
                Object.defineProperty(value, 'stackModified', {value: true});
              }
            }//>-
            // ===================================================================================================================

          }//</if this is the error exit>
          //‡
          //  ╔═╗┌┬┐┌┬┐  ┌─┐┬ ┬┌┬┐┌─┐┬ ┬┌┬┐  ┌─┐┌─┐┬─┐  ┬  ┬┌─┐┬┌┬┐  ┌┬┐┬┌─┐┌─┐  ┌─┐─┐ ┬┬┌┬┐┌─┐
          //  ╠═╣ ││ ││  │ ││ │ │ ├─┘│ │ │   ├┤ │ │├┬┘  └┐┌┘│ ││ ││  ││││└─┐│    ├┤ ┌┴┬┘│ │ └─┐
          //  ╩ ╩─┴┘─┴┘  └─┘└─┘ ┴ ┴  └─┘ ┴   └  └─┘┴└─   └┘ └─┘┴─┴┘  ┴ ┴┴└─┘└─┘  └─┘┴ └─┴ ┴ └─┘
          //  If the void exit is called with no output (as will normally be the case)
          else if (exitName !== 'success' && _.isUndefined(example) && _.isUndefined(value)) {
            // Create a new error with the name of the machine and exit that was triggered, and the description
            // of that exit if available.
            value = new Error('`' + liveMachine.identity + '` called its `' + exitName + '` exit' + (exitDef.description ? (': ' + exitDef.description) : '.'));

            // ===================================================================================================================
            if (liveMachine._doAlterStack) {
              // Make sure the error stack reaches all the way back to the beginning of the run, following asynchronous hops.
              value.stack = value.name + ': ' + value.message + '\n' + getCombinedErrorStack(getStackTraceWithoutInitialMessage(value).split('\n'), liveMachine._configuredEnvironment.debug.stack);
              // Indicate that we've already massaged this stack, so we don't do it again.
              Object.defineProperty(value, 'stackModified', {value: true});
            }//>-
            // ===================================================================================================================

          }//</else if not success exit, there is no runtime output, and that's what the exit was expcting (i.e. was expecting void)>
          //‡
          //  If the void exit is called with non-error output (this is weird but permissable)
          else if (exitName !== 'success' && _.isUndefined(example) && !_.isError(value)) {
            // Create a new error with the name of the machine and exit that was triggered, and the description
            // of that exit if available.
            value = new Error('`' + liveMachine.identity + '` called its `' + exitName + '` exit with:\n' + util.inspect(value, {depth: null}));

            // ===================================================================================================================
            if (liveMachine._doAlterStack) {
              // Make sure the error stack reaches all the way back to the beginning of the run, following asynchronous hops.
              value.stack = value.name + ': ' + value.message + '\n' + getCombinedErrorStack(getStackTraceWithoutInitialMessage(value).split('\n'), liveMachine._configuredEnvironment.debug.stack);
              // Indicate that we've already massaged this stack, so we don't do it again.
              Object.defineProperty(value, 'stackModified', {value: true});
            }//>-
            // ===================================================================================================================

          }//</else if not success exit, and there IS runtime output other than an Error instance, but that's NOT what the exit was expecting (i.e. it was expecting void)>

          //>-

          // FUTURE: Handle the case of a "void" exit that nevertheless is called with an Error instance
          // as output, using some code like the blocks above.  The trick is to make sure any metadata
          // that the machine runner adds to the exit (".exit", ".output", etc.) is maintained while we
          // also enhance the stack and error message.

          // ===================================================================================================================
          if (liveMachine._doAlterStack) {
            //  ┬ ┬┌─┐┌┬┐┌─┐┌┬┐┌─┐  ┌─┐┌┐┌┬  ┬  ┌─┐┌┬┐┌─┐┌─┐┬┌─
            //  │ │├─┘ ││├─┤ │ ├┤   ├┤ │││└┐┌┘  └─┐ │ ├─┤│  ├┴┐
            //  └─┘┴  ─┴┘┴ ┴ ┴ └─┘  └─┘┘└┘ └┘   └─┘ ┴ ┴ ┴└─┘┴ ┴
            //  Leaving through an exit means popping something off the stack

            // Pop the last entry off our stack
            liveMachine._configuredEnvironment.debug.stack.pop();

            // console.log('`' + liveMachine.identity + '`.exit ('+exitName+') stacks:');
            // console.log(liveMachine._configuredEnvironment.debug.stack);
            // console.log('=====');
          }//>-
          // ===================================================================================================================

          // Call the configured callback for this exit
          return fn.call(liveMachine._configuredEnvironment, value);


        });//</self-calling function :: _maybeArtificiallyWait>
      });//</running self-calling function :: _cacheIfAppropriate()>
    };//</interceptor callback definition>

    return memo;

  }, {});//</_.reduce() :: each configured exit callback>


  // Return the new dictionary of (now-intercepted) callbacks.
  return interceptedCallbacks;

};

