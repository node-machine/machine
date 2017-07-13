/**
 * Module dependencies
 */

var util = require('util');
var _ = require('@sailshq/lodash');
var flaverr = require('flaverr');
var parley = require('parley');

var decorateWetMachine = require('./private/decorate-wet-machine');
var checkAndMungeArgins = require('./private/check-and-munge-argins');


/**
 * .build()
 *
 * > aka Machine()
 *
 * Build a callable ("wet") machine.
 *
 * - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * @param {Dictionary} nmDef
 *        A Node-Machine definition.
 * - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * @returns {Function}
 *          A callable, "wet" machine.
 * - - - - - - - - - - - - - - - - - - - - - - - - - - -
 */

module.exports = function build(nmDef){

  // Make a guess (`isProduction`) as to whether or not we're dealing with a production environment.
  // (This is used below.)
  var isProduction = (function(){
    var _isProductionNodeEnv = typeof process !== 'undefined' && process.env.NODE_ENV === 'production';// eslint-disable-line no-undef
    var _isProductionWindow = typeof window !== 'undefined' && window.environment === 'production';// eslint-disable-line no-undef
    return _isProductionNodeEnv || _isProductionWindow;
  })();

  // Determine the effective identity of this machine
  // > Note that we modify the "dry" definition in place.
  var identity = nmDef.identity || (nmDef.friendlyName && _.camelCase(nmDef.friendlyName)) || undefined;//TODO

  // Verify correctness of node-machine definition.
  // TODO


  // Check `fn`.
  // If it's an arrow function, then log a warning about `this` probably not working as expected.
  // (thanks @elmigranto!  -- https://stackoverflow.com/a/38830947)
  // TODO

  // TODO: Check `sync`
  // TODO: Check `timeout`
  // TODO: Check `sideEffects`
  // TODO: Check `implementationType`

  // Sanitize input definitions.
  nmDef.inputs = nmDef.inputs || {};
  // TODO

  // if (!_.isString(inputDef.type) || inputDef.type === '') {
  //   throw new Error('Consistency violation: There is no way this input (`'+inputCodeName+'`) should have been allowed to be registered with neither a `type` nor `example`!  Here is the input def: '+util.inspect(inputDef, {depth:5})+'');
  // }

  // Sanitize exit definitions.
  nmDef.exits = nmDef.exits || {};
  nmDef.exits.success = nmDef.exits.success || {};
  nmDef.exits.error = nmDef.exits.error || {};
  // TODO


  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // FUTURE: (maybe) Since timeouts, spinlocks, catching, etc don't work unless using the
  // Deferred usage pattern, then log a warning if this machine declares a `timeout`, but
  // an explicit callback was passed in.
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  // Return our callable ("wet") machine (which is just a function, really.)
  var wetMachine = function runFn(argins, explicitCbMaybe, metadata){

    // Tolerate a few alternative usages:
    // • `runFn(function(err, result){...})`
    // • `runFn(function(err, result){...}, {...})`
    if (_.isFunction(argins) && _.isUndefined(explicitCbMaybe)) {
      metadata = explicitCbMaybe;
      explicitCbMaybe = argins;
    }//ﬁ

    // Tolerate unspecified argins:
    if (_.isUndefined(argins)) {
      argins = {};
    }//ﬂ

    // Handle unspecified metadata -- the usual case
    // (these are fka habitat vars)
    if (_.isUndefined(metadata)) {
      metadata = {};
    }//ﬁ


    // Potentially build an "omen": an Error instance defined ahead of time in order to grab
    // a nice, clean, appropriate stack trace originating from the line of code that actually
    // invoked this function in userland.
    // (used for providing a better experience when viewing the stack trace of errors
    // that come from one or more asynchronous ticks down the line; e.g. uniqueness errors)
    //
    // Remember that this omen can only be used as an Error ONCE!
    //
    // > Inspired by the implementation originally devised for Waterline:
    // > https://github.com/balderdashy/waterline/blob/6b1f65e77697c36561a0edd06dff537307986cb7/lib/waterline/utils/query/build-omen.js
    var omen;
    if (!isProduction) {
      // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
      // FUTURE: Potentially provide a way to override omen behavior, irrespective of
      // production vs dev environment  (Or maybe even the ability to use a custom omen.)
      // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
      omen = flaverr({}, new Error('omen'), runFn);
    }//ﬁ


    // Check usage.
    if (!_.isObject(argins) && _.isFunction(argins) && _.isArray(argins)) {
      throw flaverr({
        name:
          'UsageError',
        message:
          'Sorry, this function doesn\'t know how to handle usage like that.\n'+
          'If provided, the 1st argument should be a dictionary like `{...}`\n'+
          'consisting of input values (aka "argins") to pass through to the fn.\n'+
          ' [?] See https://sailsjs.com/support for help.'
      }, omen);
    }
    if (!_.isUndefined(explicitCbMaybe) && !_.isFunction(explicitCbMaybe)) {
      if (!_.isArray(explicitCbMaybe) && _.isObject(explicitCbMaybe)) {
        throw flaverr({
          name:
            'UsageError',
          message:
            'Sorry, this function doesn\'t know how to handle {...} callbacks.\n'+
            'If provided, the 2nd argument should be a function like `function(err,result){...}`\n'+
            '|  If you passed in {...} on purpose as a "switchback" (dictionary of callbacks),\n'+
            '|  please be aware that, as of machine v15, you can no longer pass in a switchback\n'+
            '|  as the 2nd argument.  And you can\'t pass a switchback in to .exec() anymore either.\n'+
            '|  Instead, you\'ll need to explicitly call .switch().\n'+
            ' [?] See https://sailsjs.com/support for more help.'
        }, omen);
      }
      else {
        throw flaverr({
          name:
            'UsageError',
          message:
            'Sorry, this function doesn\'t know how to handle usage like that.\n'+
            'If provided, the 2nd argument should be a function like `function(err,result){...}`\n'+
            'that will be triggered as a callback after this fn is finished.\n'+
            ' [?] See https://sailsjs.com/support for help.'
        }, omen);
      }
    }


    // Build and return an appropriate deferred object.
    // (Or possibly just start executing the machine immediately, depending on usage)
    return parley(

      //  ███████╗██╗  ██╗███████╗ ██████╗██╗   ██╗████████╗██╗ ██████╗ ███╗   ██╗███████╗██████╗
      //  ██╔════╝╚██╗██╔╝██╔════╝██╔════╝██║   ██║╚══██╔══╝██║██╔═══██╗████╗  ██║██╔════╝██╔══██╗
      //  █████╗   ╚███╔╝ █████╗  ██║     ██║   ██║   ██║   ██║██║   ██║██╔██╗ ██║█████╗  ██████╔╝
      //  ██╔══╝   ██╔██╗ ██╔══╝  ██║     ██║   ██║   ██║   ██║██║   ██║██║╚██╗██║██╔══╝  ██╔══██╗
      //  ███████╗██╔╝ ██╗███████╗╚██████╗╚██████╔╝   ██║   ██║╚██████╔╝██║ ╚████║███████╗██║  ██║
      //  ╚══════╝╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═════╝    ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝
      //
      function (done){

        // Now actually run the machine, in whatever way is appropriate based on its implementation type.
        switch (nmDef.implementationType) {

          case 'composite':
            // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
            // See https://www.youtube.com/watch?v=1X-Q-HUS4mg&list=PLIQKJlrxhPyIDGAZ6CastNOmSSQkXSx2E&index=1
            // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
            return done(flaverr({name:'UsageError', message: 'Machines built with the `composite` implementation type cannot be executed using this runner.\n[?] For help, visit https://sailsjs.com/support'}, omen));

          case 'es8AsyncFunction':
            // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
            // FUTURE: Support automatically mapping this usage to the "es8AsyncFunction" implementation type:
            // (see c0d7dba572018a7ec8d1d0683abb7c46f0aabae8)
            //
            // > Note that this should check whether `fn` is an `async function` or not and warn/error accordingly.
            // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
            return done(flaverr({name:'UsageError', message: 'The experimental `es8AsyncFunction` implementation type is not yet supported.  See https://github.com/node-machine/machine/commits/c0d7dba572018a7ec8d1d0683abb7c46f0aabae8 for background, or https://sailsjs.com/support for help.'}, omen));

          case 'classicJsFunction':
            // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
            // FUTURE: Support automatically mapping this usage to the "classicJsFunction" implementation type:
            // (see https://github.com/node-machine/spec/pull/2/files#diff-eba3c42d87dad8fb42b4080df85facecR95)
            //
            // > Note that this should check whether `fn` is an `async function` or not and warn/error accordingly.
            // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
            return done(flaverr({name:'UsageError', message: 'The experimental `classicJsFunction` implementation type is not yet supported.  See https://github.com/node-machine/spec/pull/2/files#diff-eba3c42d87dad8fb42b4080df85facecR95 for background, or https://sailsjs.com/support for help.'}, omen));

          case '':
          case undefined:

            // Validate argins vs. the declared input definitions, honoring type safety, potentially performing
            // light coercion, applying defaultsTo, ensuring required argins are present for all required inputs,
            // and preventing unexpected extraneous argins unless a special meta key is set.
            // > Note that this is currently modifying `argins` in-place, as a direct reference.
            var validationProblems = checkAndMungeArgins(argins, metadata, nmDef, isProduction);
            if (validationProblems.length > 0) {

              var bulletPrefixedProblems = _.map(validationProblems, function (vProblem){ return '  • '+vProblem.message; });
              var prettyPrintedValidationProblemsStr = bulletPrefixedProblems.join('\n');
              var finalErrorMsg =
              'Could not run `'+identity+'` due to '+validationProblems.length+' '+
              'validation error'+(validationProblems.length>1?'s':'')+':\n'+prettyPrintedValidationProblemsStr;

              var err = flaverr({
                name: 'ValidationError',
                raw: validationProblems,
                message: finalErrorMsg,
              }, omen);
              // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
              // FUTURE: Potentially also add some backwards-compatibility:
              // ```
              //     code: 'E_MACHINE_RUNTIME_VALIDATION',
              // ```
              //
              // (And/or use name: 'UsageError' for consistency with Waterline)
              // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

              return done(err);
            }//-•

            // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
            // FUTURE: (maybe) Anchor validation rules
            // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


            // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
            // FUTURE: (maybe) Build callable forms of lambda inversions (aka submachines)??
            // But really, maybe consider ripping out support for this in the interest of simplicity.
            // Only a few machines really need to use it, and it's easy to make it work.  The only thing
            // is that we would then lose the nice, consistent handling of edge cases provided by the machine
            // runner.  But the performance benefits and simplification are probably worth it.
            // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


            // Build & return exit handler callbacks for use by the machine's `fn`.
            // > Note: The only reason this is a self-calling function is to keep private variables insulated.
            var implSideExitHandlerCbs = (function _gettingHandlerCbs(){

              var handlerCbs = function (){ throw flaverr({name:'CompatibilityError', message: 'Implementor-land switchbacks are no longer supported by default in the machine runner.  Instead of `exits()`, please call `exits.success()` or `exits.error()` from within your machine `fn`.  (For help, visit https://sailsjs.com/support)'}); };

              /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
              //
              //    USAGE: Node-style callback, or with a promise, or with async...await
              //    (note that, when leveraging switchbacks, there are slightly different rules)
              //
              //  _______________________________________________________________________________________________________________________________________________________________________________________________________________________________________
              //  ||            exit => | 'error' (explicit)      | 'error' (throw)         | 'error' (timeout)       | 'error' (validation)    | misc. exit              | misc. exit              | success                 | success                 |
              //  \/ output             | `exits.error()`         | `throw new Error()`     |                         |                         | (NOT expecting output)  | (EXPECTING output)      | (NOT expecting output)  | (EXPECTING output)      |
              //  ______________________|_________________________|_________________________|_________________________|_________________________|_________________________|_________________________|_________________________|_________________________|
              //  Error instance        | pass straight through   | pass straight through   | N/A - always an Error   | N/A - always an Error   | pass straight through   | coerce                  | pass straight through   | coerce                  |
              //                        |                         |   (handled by parley)   |   (handled by parley)   |                         |                         |                         |                         |                         |
              //  ----------------------| --  --  --  --  --  --  | --  --  --  --  --  --  | --  --  --  --  --  --  | --  --  --  --  --  --  | --  --  --  --  --  --  | --  --  --  --  --  --  | --  --  --  --  --  --  | --  --  --  --  --  --  |
              //  String data           | new Error w/ str as msg | new Error w/ str as msg | N/A - always an Error   | N/A - always an Error   | new Error w/ str as msg | coerce                  | pass straight through   | coerce                  |
              //                        |                         |                         |   (handled by parley)   |                         |                         |                         |                         |                         |
              //  ----------------------| --  --  --  --  --  --  | --  --  --  --  --  --  | --  --  --  --  --  --  | --  --  --  --  --  --  | --  --  --  --  --  --  | --  --  --  --  --  --  | --  --  --  --  --  --  | --  --  --  --  --  --  |
              //  Other non-Error data  | new Error + wrap output | new Error + wrap output | N/A - always an Error   | N/A - always an Error   | new Error + wrap output | coerce                  | pass straight through   | coerce                  |
              //                        |                         |                         |   (handled by parley)   |                         |                         |                         |                         |                         |
              //  ----------------------| --  --  --  --  --  --  | --  --  --  --  --  --  | --  --  --  --  --  --  | --  --  --  --  --  --  | --  --  --  --  --  --  | --  --  --  --  --  --  | --  --  --  --  --  --  | --  --  --  --  --  --  |
              //  No output (undefined) | new Error, generic      | new Error, generic      | N/A - always an Error   | N/A - always an Error   | new Error, w/ descrptn. | coerce                  | pass straight through   | coerce                  |
              //                        |                         |                         |   (handled by parley)   |                         |                         |                         |                         |                         |
              //  _______________________________________________________________________________________________________________________________________________________________________________________________________________________________________
              //
              /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

              // Set up support for exit forwarding in implementor-side exit handler callbacks:
              // > Note: We use another self-calling function in order to share future logic-- it's just for convenience/deduplication.
              // > The important thing is that we call `done` herein.
              (function _attachingHandlerCbs(proceed){

                // * * * Implementation of exits.error()... * * *
                handlerCbs.error = function(rawOutput){

                  // Ensure that the catchall error exit (`error`) always comes back with an Error instance
                  // (i.e. so node callback expectations are fulfilled)
                  var err;
                  if (_.isUndefined(rawOutput)) {
                    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
                    // FUTURE: Consider actually NOT using the omen in this case -- since we might
                    // be interested in the line of code where the `exits.error()` was called.
                    // OR, better yet, still use the omen, but also capture an additional trace
                    // and attach it as an extra property. (**We might actually consider doing the
                    // same thing for a few of the other cases below!**)
                    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
                    err = flaverr({
                      message: 'Internal error occurred while running `'+identity+'`.'
                    }, omen);
                  }
                  else if (_.isError(rawOutput)) {
                    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
                    // FUTURE: Consider this:  Imagine we checked the Error instance to see if it has a
                    // `code` or `name` that indicates any special meaning -- whether that be a `name`
                    // of `RuntimeValidationError`/ `TimeoutError`, or just a `code` that happens to
                    // overlap with the name of one of this machine's declared exits.  In either of these
                    // cases, we might strip that information off and preserve it instead.
                    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
                    err = rawOutput;
                  }
                  // Note that async+await/bluebird/Node 8 errors are not necessarily "true" Error instances,
                  // as per _.isError() anyway (see https://github.com/node-machine/machine/commits/6b9d9590794e33307df1f7ba91e328dd236446a9).
                  // So if we want to keep a reasonable stack trace, we have to be a bit more relaxed here and
                  // tolerate these sorts of "errors" directly as well (by tweezing out the `cause`, which is
                  // where the original Error lives.)
                  else if (_.isObject(rawOutput) && rawOutput.cause && _.isError(rawOutput.cause)) {
                    err = rawOutput.cause;
                  }
                  else if (_.isString(rawOutput)) {
                    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
                    // FUTURE: add in separate warning message explaining that there should always
                    // be an Error instance sent back -- not some other value like this.
                    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
                    err = flaverr({
                      message: rawOutput,
                      raw: rawOutput
                    }, omen);
                  }
                  else {
                    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
                    // FUTURE: add in separate warning message explaining that there should always
                    // be an Error instance sent back -- not some other value like this.
                    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
                    err = flaverr({
                      message: 'Internal error occurred while running `'+identity+'`.  Got non-error: '+util.inspect(rawOutput, {depth: 5}),
                      raw: rawOutput
                    }, omen);
                  }

                  return proceed(err);
                };//</ƒ>

                // * * * Implementation of exits.success()... * * *
                handlerCbs.success = function(rawOutput){
                  // Ensure valid result (vs. expected output type for this exit)
                  var result = rawOutput;//TODO: RTTC coercion
                  return proceed(undefined, result);
                };//</ƒ>

                // * * * Implementation of each of the other misc. exits  (`exits.*()`)... * * *
                _.each(_.difference(_.keys(nmDef.exits), ['error','success']), function (miscExitCodeName){
                  handlerCbs[miscExitCodeName] = function (rawOutput){
                    // Now build our Error instance for our "exception" (fka "forwarding error").
                    var err = flaverr({
                      name: 'Exception',
                      code: miscExitCodeName,
                      raw: rawOutput,
                      message: (function _gettingErrMsg(){
                        // The error msg always begins with a standard prefix:
                        var errMsg = '`'+identity+'` triggered its `'+miscExitCodeName+'` exit';
                        // And is then augmented by some additional basic rules:
                        //  • if there is no raw output, append the exit description if available.
                        if (_.isUndefined(rawOutput)) {
                          if (!_.isObject(nmDef.exits[miscExitCodeName])) { throw new Error('Consistency violation: Machine ('+identity+') has become corrupted!  One of its exits (`'+miscExitCodeName+'`) has gone missing _while the machine was being executed_!'); }
                          if (nmDef.exits[miscExitCodeName].description) {
                            errMsg += ': '+nmDef.exits[miscExitCodeName].description;
                          }
                        }
                        //  • if the raw output is an Error instance, then just append _its_ message
                        else if (_.isError(rawOutput)) {
                          errMsg += ': '+rawOutput.message;
                        }
                        //  • if the raw output is BASICALLY an Error instance, then just append its message
                        //    (see comments around other usages of _.isError() in this file for more info)
                        else if (_.isObject(rawOutput) && rawOutput.cause && _.isError(rawOutput.cause)) {
                          errMsg += ': '+rawOutput.cause.message;
                        }
                        //  • if the raw output is anything else, inspect and append it
                        else {
                          errMsg += ' with: \n\n' + util.inspect(rawOutput, {depth: 5});
                        }

                        return errMsg;
                      })(),
                      // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
                      // FUTURE: Potentially also add backwards-compatibility:
                      // ```
                      //     exit: miscExitCodeName,
                      //     output: rawOutput,
                      // ```
                      // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
                    }, omen);

                    return proceed(err);
                  };//</ƒ>
                });//</ each misc. exit >

              })(function (err, result){

                // Then trigger our callback with the appropriate arguments.
                if (err) { return done(err); }
                if (_.isUndefined(result)) { return done(); }
                return done(undefined, result);
              });//</ ... (_∏_) >

              return handlerCbs;
            })();


            // Run `fn`.
            //
            // > Notes:
            // > (1) When running our fn, we apply a special `this` context using
            // >     the provided meta keys (aka habitat vars)
            // >
            // > (2) If the `fn` is an ES8 async function, then we also attach a handler
            // >     to `.catch()` its return value (which will be a promise) in order to
            // >     react to unhandled promise rejections in the same way that parley
            // >     automatically handles any uncaught exceptions that it throws synchronously.
            // >     (https://trello.com/c/UdK9ooJ3/108-es7-async-await-in-core-sniff-request-handler-function-to-see-if-it-s-an-async-function-if-so-then-grab-the-return-value-from-th)
            // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
            // FUTURE: benchmark this `constructor.name` check and, if tangible enough,
            // provide some mechanism for passing in this information so that it can be
            // predetermined (e.g. at build-time).
            // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
            if (nmDef.fn.constructor.name === 'AsyncFunction') {
              // Note that `_.bind()` works perfectly OK with ES8 async functions, at least
              // in platforms tested (such as Node 8.1.2).  We still keep this as a separate
              // code path from below though, just to be 100% about what's going on.
              var boundES8AsyncFn = _.bind(nmDef.fn, metadata);
              var promise = boundES8AsyncFn(argins, implSideExitHandlerCbs, metadata);
              // Also note that here, we don't write in the usual `return done(e)` style.
              // This is deliberate -- to provide a conspicuous reminder that we aren't
              // trying to get up to any funny business with the promise chain.
              promise.catch(function(e) {
                done(e);
              });
            }
            else {
              var boundFn = _.bind(nmDef.fn, metadata);
              boundFn(argins, implSideExitHandlerCbs, metadata);
            }

            // ==================================================================
            // HERE'S WHAT ALL THIS MEANS:
            // ```
            // fn: async function(inputs, exits) {
            //
            //   var Machine = require('machine');
            //   var helpExperiment = Machine(require('./help-experiment'));
            //
            //
            //   // In the future, with `implementationType: 'es8AsyncFunction'`,
            //   // you could simply do something like this:
            //   // ---------------------------------
            //   // return await helpExperiment({});
            //
            //   // But RIGHT NOW, you can do:
            //   // ---------------------------------
            //   return exits.success(await helpExperiment({}));
            //
            //   // Equivalent to:
            //   // ---------------------------------
            //   // helpExperiment({}).exec(function(err, result){
            //   //   if (err) { return exits.error(err); }
            //   //   return exits.success(result);
            //   // });
            //
            // },
            // ```
            // ==================================================================

            break;

          default:
            throw new Error('Consistency violation: Unrecognized implementation type in the middle of the machine runner -- but this should have been caught earlier!');

        }//</ switch(nmDef.implementationType) >

      },

      //  ███████╗██╗  ██╗██████╗ ██╗     ██╗ ██████╗██╗████████╗     ██████╗██████╗
      //  ██╔════╝╚██╗██╔╝██╔══██╗██║     ██║██╔════╝██║╚══██╔══╝    ██╔════╝██╔══██╗
      //  █████╗   ╚███╔╝ ██████╔╝██║     ██║██║     ██║   ██║       ██║     ██████╔╝
      //  ██╔══╝   ██╔██╗ ██╔═══╝ ██║     ██║██║     ██║   ██║       ██║     ██╔══██╗
      //  ███████╗██╔╝ ██╗██║     ███████╗██║╚██████╗██║   ██║       ╚██████╗██████╔╝
      //  ╚══════╝╚═╝  ╚═╝╚═╝     ╚══════╝╚═╝ ╚═════╝╚═╝   ╚═╝        ╚═════╝╚═════╝
      //
      // If provided, use the explicit callback.
      explicitCbMaybe || undefined,

      //  ███████╗██╗  ██╗████████╗██████╗  █████╗
      //  ██╔════╝╚██╗██╔╝╚══██╔══╝██╔══██╗██╔══██╗
      //  █████╗   ╚███╔╝    ██║   ██████╔╝███████║
      //  ██╔══╝   ██╔██╗    ██║   ██╔══██╗██╔══██║
      //  ███████╗██╔╝ ██╗   ██║   ██║  ██║██║  ██║
      //  ╚══════╝╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝
      //
      //  ███╗   ███╗███████╗████████╗██╗  ██╗ ██████╗ ██████╗ ███████╗
      //  ████╗ ████║██╔════╝╚══██╔══╝██║  ██║██╔═══██╗██╔══██╗██╔════╝
      //  ██╔████╔██║█████╗     ██║   ███████║██║   ██║██║  ██║███████╗
      //  ██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██║   ██║██║  ██║╚════██║
      //  ██║ ╚═╝ ██║███████╗   ██║   ██║  ██║╚██████╔╝██████╔╝███████║
      //  ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝
      //
      // Extra methods for the Deferred:
      {

        /**
         * .execSync()
         *
         * @returns {Ref} output from machine's success exit
         * @throws {Error} If something goes wrong, or the machine's fn triggers a non-success exit.
         */
        execSync: function (){

          // Check that the machine definition explicitly flagged itself as synchronous.
          // > If `sync` was NOT set, then this is a usage error.
          // > You can't run a machine synchronously unless it proudly declares itself as such.
          if (!nmDef.sync) {
            throw flaverr({
              name:
                'UsageError',
              message:
                'Sorry, this function cannot be called synchronously, because it does not\n'+
                'declare support for synchronous usage (i.e. `sync: true`)\n'+
                ' [?] See https://sailsjs.com/support for help.'
            }, omen);
          }//-•


          var isFinishedExecuting;
          var immediateResult;
          this.exec(function (err, result){
            isFinishedExecuting = true;
            if (err) { throw err; }
            immediateResult = result;
          });

          if (!isFinishedExecuting) {
            throw flaverr({
              name:
                'ImplementationError',
              message:
                'Failed to call this function synchronously, because it is not\n'+
                'actually synchronous.  Instead, its implementation is asynchronous --\n'+
                'which is inconsistent with its declared interface (`sync: true`).\n'+
                ' [?] See https://sailsjs.com/support for help.'
            }, omen);
          }

          return immediateResult;
        },


        /**
         * .meta()
         */
        meta: function (_metadata){
          // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
          // FUTURE: Maybe log warning when `.meta()` is called more than once?
          // (since it can be confusing that the existing metadata gets replaced)
          // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
          metadata = _metadata;
          return this;
        },


        /**
         * .switch()
         */
        switch: function (userlandHandlers) {

          // Check usage.
          if (!_.isObject(userlandHandlers) || _.isArray(userlandHandlers) || _.isFunction(userlandHandlers)) {
            throw flaverr({
              name:
                'UsageError',
              message:
                'Sorry, .switch() doesn\'t know how to handle usage like that.\n'+
                'You should pass in a dictionary like `{...}` consisting of at least two\n'+
                'handler functions: one for `error` and one for `success`.  You can also\n'+
                'provide additional keys for any other exits you want to explicitly handle.\n'+
                ' [?] See https://sailsjs.com/support for help.'
            }, omen);
          }//-•

          // Before proceeding, ensure error exit is still configured w/ a callback.
          // If it is not, then get crazy and **throw** BEFORE calling the machine's `fn`.
          //
          // This is just yet another failsafe-- better to potentially terminate the process than
          // open up the possibility of silently swallowing errors later.
          if (!userlandHandlers.error){
            throw flaverr({
              name:
                'UsageError',
              message:
                'Invalid usage of .switch() -- missing `error` handler.\n'+
                'If you use .switch({...}), the provided dictionary (aka "switchback"), must\n'+
                'define an `error` key with a catchall callback function.  Otherwise, there\n'+
                'would be no way to handle any unexpected or internal errors!\n'+
                ' [?] See https://sailsjs.com/support for help.'
            }, omen);
          }//-•

          // Same thing for the `success` handler -- except in this case, use the provided `error`
          // handler, rather than throwing an uncatchable Error.
          if (!userlandHandlers.success){
            return userlandHandlers.error({
              name:
                'UsageError',
              message:
                'Invalid usage of .switch() -- missing `success` handler.\n'+
                'If you use .switch({...}), the provided dictionary (aka "switchback"), must\n'+
                'define a `success` key with a callback function.  If you do not care about\n'+
                'the success scenario, please provide a no-op callback, or use .exec() instead.\n'+
                ' [?] See https://sailsjs.com/support for help.'
            }, omen);
          }//-•

          // Make sure that no callbacks for undeclared exits were configured.
          var unrecognizedExitCodeNames = _.difference(_.keys(userlandHandlers), _.keys(nmDef.exits));
          if (unrecognizedExitCodeNames.length > 0) {
            return userlandHandlers.error({
              name:
                'UsageError',
              message:
                'Invalid usage of .switch() -- '+unrecognizedExitCodeNames.length+' handler function(s)\n'+
                'do not match up with any recognized exit: `' + unrecognizedExitCodeNames.join(', ') +'`.\n'+
                'Please change the keys of these function(s) so that they match up with recognized exits.\n'+
                '(Or, if the exceptions they are handling are no longer relevant, you can just remove them.)\n'+
                ' [?] See https://sailsjs.com/support for help.'
            }, omen);
          }//-•

          this.exec(function (err, result){

            if (err) {

              if (err.name === 'Exception' && err === omen) {
                // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
                // To explain why this `=== omen` check is necessary, have a look at this example:
                // ```
                // var inner = require('./')({ exits: { foo: {description: 'Whoops' } }, fn: function(inputs, exits) { return exits.foo(987); } }); var outer = require('./')({ exits: { foo: { description: 'Not the same' }}, fn: function(inputs, exits) { inner({}, (err)=>{ if (err) { return exits.error(err); } return exits.success(); }); } })().switch({ error: (err)=>{ console.log('Got error:',err); }, foo: ()=>{ console.log('Should NEVER make it here.  The `foo` exit of some other machine in the implementation has nothing to do with THIS `foo` exit!!'); }, success: ()=>{ console.log('Got success.'); }, });
                // ```
                // > Note: The same thing is true any time we might want to negotiate uncaught errors or unhandled
                // > promise rejections thrown from inside `fn`, timeout errors, or RTTC validation errors.
                // > It is important to remember that other machines used internally within `fn` could cause
                // > the same errors!
                // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
                // console.log('This represents an actual exit traversal');

                if (!err.code) { throw new Error('Consistency violation: Recognized exceptions from the machine runner should always have a `code` property, but this one does not!  Here is the error:'+util.inspect(err, {depth:null})); }
                if (err.code === 'error' || !userlandHandlers[err.code]) {
                  return userlandHandlers.error(err);
                }
                else {
                  return userlandHandlers[err.code](err.raw);
                }
              }//-•

              // if (err.name === 'Exception') { console.log('DEBUG: This error must have come from some internal machine from within THIS machine\'s implementation (aka `fn`)!'); }
              return userlandHandlers.error(err);
            }//-•

            userlandHandlers.success(result);
          });//</ .exec() >

          return;
        },


        // Compatibility:
        // =====================================================================================================================
        setEnv: function (_metadata) {
          // Old implementation, for reference:
          // https://github.com/node-machine/machine/blob/3cbdf60f7754ef47688320d370ef543eb27e36f0/lib/Machine.constructor.js#L365-L383
          console.warn(
            'DEPRECATED AS OF MACHINE v15: Please use `.meta()` instead of `.setEnv()` in the future\n'+
            '(adjusting it for you automatically this time)\n'
          );
          return this.meta(_metadata);
        },

        // FUTURE: Consider completely removing the rest of these niceties in production
        // (to optimize performance of machine construction -- esp. since there are a lot of
        // other straight-up removed features that we haven't added improved err msgs for via new shims)
        // =====================================================================================================================
        demuxSync: function () {
          throw flaverr({
            name:
              'CompatibilityError',
            message:
              'As of machine v15, the experimental `.demuxSync()` method is no longer supported.\n'+
              'Instead, please use something like this:\n'+
              '\n'+
              '```\n'+
              '    var origResultFromDemuxSync = (()=>{\n'+
              '      try {\n'+
              '        thisMethod().execSync();\n'+
              '        return true;\n'+
              '      } catch (e) { return false; }\n'+
              '    })();\n'+
              '```\n'+
              '\n'+
              'Here is a link to the original implementation, for reference:\n'+
              'https://github.com/node-machine/machine/blob/3cbdf60f7754ef47688320d370ef543eb27e36f0/lib/Machine.prototype.demuxSync.js'
          }, omen);
        },
        cache: function () {
          throw flaverr({
            name:
              'CompatibilityError',
            message:
              'As of machine v15, built-in caching functionality (and thus the `.cache()` method) is no longer supported.\n'+
              'Instead, please use your own caching mechanism-- for example:\n'+
              '\n'+
              '```\n'+
              '    global.MY_CACHE = global.MY_CACHE || {};\n'+
              '    var result = MY_CACHE[\'foo\'];\n'+
              '    if (_.isUndefined(result)) {\n'+
              '      result = await thisMethod({id:\'foo\'});\n'+
              '      MY_CACHE[\'foo\'] = result;\n'+
              '    }\n'+
              '```\n'+
              '\n'+
              'Here is a link to part of the original implementation, for reference:\n'+
              'https://github.com/node-machine/machine/blob/3cbdf60f7754ef47688320d370ef543eb27e36f0/lib/Machine.prototype.cache.js'
          }, omen);
        },

      },

      //  ████████╗██╗███╗   ███╗███████╗ ██████╗ ██╗   ██╗████████╗
      //  ╚══██╔══╝██║████╗ ████║██╔════╝██╔═══██╗██║   ██║╚══██╔══╝
      //     ██║   ██║██╔████╔██║█████╗  ██║   ██║██║   ██║   ██║
      //     ██║   ██║██║╚██╔╝██║██╔══╝  ██║   ██║██║   ██║   ██║
      //     ██║   ██║██║ ╚═╝ ██║███████╗╚██████╔╝╚██████╔╝   ██║
      //     ╚═╝   ╚═╝╚═╝     ╚═╝╚══════╝ ╚═════╝  ╚═════╝    ╚═╝
      //
      // If provided, use the timeout (max # of ms to wait for this machine to finish executing)
      nmDef.timeout || undefined,
      // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
      // FUTURE: Write tests that ensure all of the scenarios in c4e738e8016771bd55b78cba277e62a83d5c61fc are working.
      // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


      //   ██████╗ ███╗   ███╗███████╗███╗   ██╗
      //  ██╔═══██╗████╗ ████║██╔════╝████╗  ██║
      //  ██║   ██║██╔████╔██║█████╗  ██╔██╗ ██║
      //  ██║   ██║██║╚██╔╝██║██╔══╝  ██║╚██╗██║
      //  ╚██████╔╝██║ ╚═╝ ██║███████╗██║ ╚████║
      //   ╚═════╝ ╚═╝     ╚═╝╚══════╝╚═╝  ╚═══╝
      //
      // Pass in the omen, if we were able to create one.
      omen || undefined,


      // FUTURE: To allow for improved error messages, we could pass in an interceptor
      // (aka lifecycle callback) here, for interfering with the error/result on the way back out from .exec().
      undefined

    );//</ parley() >

  };//</ƒ>


  // Attach sanitized node machine definition properties to the callable ("wet") machine function.
  // (This is primarily for compatibility with existing tooling, and for easy access to the def.)
  // > Note that these properties should NEVER be changed after this point!
  decorateWetMachine(wetMachine, nmDef);


  return wetMachine;

};
