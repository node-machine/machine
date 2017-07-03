/**
 * Module dependencies
 */

var util = require('util');
var _ = require('@sailshq/lodash');
var flaverr = require('flaverr');
var parley = require('parley');


/**
 * `buildCallableMachine()`
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

module.exports = function buildCallableMachine(nmDef){ 

  // Determine the effective identity of this machine.
  var identity = nmDef.identity || undefined;//TODO

  // Verify correctness of node-machine definition.
  // TODO

  // Sanitize input definitions.
  // var inputDefs = nmDef.inputs || {};
  // TODO

  // Sanitize exit definitions.
  var exitDefs = nmDef.exits || {};
  exitDefs.success = exitDefs.success || {};
  exitDefs.error = exitDefs.error || {};
  // TODO

  // Check `sync`.
  // TODO

  // Check `timeout`.
  // TODO


  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // FUTURE: (maybe) Since timeouts, spinlocks, catching, etc don't work unless using the
  // Deferred usage pattern, then log a warning if this machine declares a `timeout`, but
  // an explicit callback was passed in.
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


  // Attach sanitized node machine definition properties to the callable ("wet") machine function.
  // (This is primarily for compatibility with existing tooling, and for easy access to the def.)
  // > Note that these properties should NEVER be changed!!
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // TODO: Either do this, OR better yet, figure out a different way-- e.g. using an accessor function.
  // (that would be a breaking change, but it would be worth it for the perf. gains-- esp. w/ simple
  // synchronous machines)
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -



  // Return our callable ("wet") machine function in the appropriate format.
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // FUTURE: Consider support for returning a machine function with other usage styles
  // > Note: This is the same idea as "invocation style" or "invocation type" -- i.e. as envisioned
  // > for performance improvements when ideating with jdalton earlier in 2017 (see node-machine/spec
  // > repo for details/memory-jogging)
  //
  // For example, instead of:
  //
  // ```
  // var add = Machine.build(nmDef);
  // // ...
  // var result = add({a:1,b:1}).execSync();
  // ```
  //
  // You could do:
  // ```
  // var add = Machine.buildWithCustomUsage({
  //   arginStyle: 'serial',
  //   def: _.extend({ args: ['a','b'] }, nmDef)
  // });
  // // ...
  // var result = add(1,2).execSync();
  // ```
  //
  // Or even:
  // ```
  // var add = Machine.buildWithCustomUsage({
  //   arginStyle: 'serial',   // vs. "named"
  //   execStyle: 'immediate', // vs. "deferred"
  //   def: _.extend({ args: ['a','b'] }, nmDef)
  // });
  // // ...
  // var result = add(1,2);
  // ```
  //
  // Same idea for asynchronous logic:
  // (using the `immediate` exec style, a promise is returned, instead of the actual result)
  // ```
  // var fetchTweets = Machine.buildWithCustomUsage({
  //   arginStyle: 'serial',   // vs. "named"
  //   execStyle: 'immediate', // vs. "deferred"
  //   def: _.extend({
  //     args: [
  //       [ 'tweetSearchQuery','done()' ],
  //       [ 'tweetSearchQuery','{...}', 'done()' ]
  //     ]
  //   }, nmDef)
  // });
  // // ...
  // var result = await fetchTweets('twinkle', {lat: 37.2332, long: -92.323852});
  // ```
  //
  // One more example:
  // ```
  // var fetchTweets = Machine.buildWithCustomUsage({
  //   arginStyle: 'named',   // vs. "serial"
  //   execStyle: 'immediate', // vs. "deferred"
  //   def: _.extend({
  //     args: [
  //       [ 'tweetSearchQuery','done()' ],
  //       [ 'tweetSearchQuery','{...}', 'done()' ]
  //     ]
  //   }, nmDef)
  // });
  // // ...
  // var result = await fetchTweets({
  //   tweetSearchQuery: 'twinkle',
  //   lat: 37.2332,
  //   long: -92.323852
  // });
  // ```
  //
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  return function runFn(argins, explicitCbMaybe, metadata){

    // Tolerate a few alternative usages:
    // • `runFn(function(err, result){...})`
    // • `runFn(function(err, result){...}, {...})`
    if (_.isFunction(argins) && _.isUndefined(explicitCbMaybe)) {
      metadata = explicitCbMaybe;
      explicitCbMaybe = argins;
    }//>-

    // Tolerate unspecified argins:
    if (_.isUndefined(argins)) {
      argins = {};
    }//>-

    // Handle unspecified metadata -- the usual case
    // (these are fka habitat vars)
    if (_.isUndefined(metadata)) {
      metadata = {};
    }//>-

    // Check usage.
    if (!_.isObject(argins) && _.isFunction(argins) && _.isArray(argins)) {
      throw flaverr({name:'UsageError'}, new Error(
        'Sorry, this function doesn\'t know how to handle usage like that.\n'+
        'If provided, the 1st argument should be a dictionary like `{...}`\n'+
        'consisting of input values (aka "argins") to pass through to the fn.\n'+
        '> See https://sailsjs.com/support for help.'
      ));
    }
    if (!_.isUndefined(explicitCbMaybe) && !_.isFunction(explicitCbMaybe)) {
      if (!_.isArray(explicitCbMaybe) && _.isObject(explicitCbMaybe)) {
        throw flaverr({name:'UsageError'}, new Error(
          'Sorry, this function doesn\'t know how to handle {...} callbacks.\n'+
          'If provided, the 2nd argument should be a function like `function(err,result){...}`\n'+
          '|  If you passed in {...} on purpose as a "switchback" (dictionary of callbacks),\n'+
          '|  please be aware that, as of machine v15, you can no longer pass in a switchback\n'+
          '|  as the 2nd argument.  And you can\'t pass a switchback in to .exec() anymore either.\n'+
          '|  Instead, you\'ll need to explicitly call .switch().\n'+
          'See https://sailsjs.com/support for more help.'
        ));
      }
      else {
        throw flaverr({name:'UsageError'}, new Error(
          'Sorry, this function doesn\'t know how to handle usage like that.\n'+
          'If provided, the 2nd argument should be a function like `function(err,result){...}`\n'+
          'that will be triggered as a callback after this fn is finished.\n'+
          '> See https://sailsjs.com/support for help.'
        ));
      }
    }

    // Build an "omen": an Error instance defined ahead of time in order to grab a stack trace.
    // (used for providing a better experience when viewing the stack trace of errors
    // that come from one or more asynchronous ticks down the line; e.g. uniqueness errors)
    //
    // Remember that this omen can only be used as an Error ONCE!
    //
    // > Inspired by the implementation originally devised for Waterline:
    // > https://github.com/balderdashy/waterline/blob/6b1f65e77697c36561a0edd06dff537307986cb7/lib/waterline/utils/query/build-omen.js
    var omen = flaverr({}, new Error('omen'), runFn);

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
            return done(flaverr({name:'UsageError'}, new Error('Machines built with the `composite` implementation type cannot be executed using this runner.  (For help, visit https://sailsjs.com/support)')));

          case 'classic':
            // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
            // FUTURE: Support automatically mapping this usage to the "classic" implementation type:
            // (see https://github.com/node-machine/spec/pull/2/files#diff-eba3c42d87dad8fb42b4080df85facecR95)
            //
            // > Note that this should check whether `fn` is an `async function` or not and react accordingly.
            // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
            return done(flaverr({name:'UsageError'}, new Error('The experimental `classic` implementation type is not yet supported.  See https://github.com/node-machine/spec/pull/2/files#diff-eba3c42d87dad8fb42b4080df85facecR95 for background, or https://sailsjs.com/support for help.')));

          default:

            // Validate argins vs. our declared input definitions.
            // (Potentially, also coerce them.)
            var finalArgins = argins;
            // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
            // TODO
            // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


            // Prevent using unexpected additional argins -- at least without setting a special meta key
            // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
            // TODO
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

              var handlerCbs = function (){ throw flaverr({name:'CompatibilityError'}, new Error('Implementor-land switchbacks are no longer supported by default in the machine runner.  Instead of `exits()`, please call `exits.success()` or `exits.error()` from within your machine `fn`.  (For help, visit https://sailsjs.com/support)')); };

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

                  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
                  // FUTURE: Consider implementing backwards compatibility for a `code` of `E_TIMEOUT`?
                  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

                  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
                  // FUTURE: Consider implementing backwards compatibility for a `code` of `E_MACHINE_RUNTIME_VALIDATION`?
                  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

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
                };//</ ... >

                // * * * Implementation of exits.success()... * * *
                handlerCbs.success = function(rawOutput){
                  // Ensure valid result (vs. expected output type for this exit)
                  var result = rawOutput;//TODO
                  return proceed(undefined, result);
                };//</ ... >

                // * * * Implementation of each of the other misc. exits  (`exits.*()`)... * * *
                _.each(_.difference(_.keys(exitDefs), ['error','success']), function (miscExitCodeName){
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
                          if (!_.isObject(exitDefs[miscExitCodeName])) { throw new Error('Consistency violation: Machine ('+identity+') has become corrupted!  One of its exits (`'+miscExitCodeName+'`) has gone missing _while the machine was being executed_!'); }
                          if (exitDefs[miscExitCodeName].description) {
                            errMsg += ': '+exitDefs[miscExitCodeName].description;
                          }
                        }
                        //  • if the raw output is an Error instance, then just append _its_ message
                        else if (_.isError(rawOutput)) {
                          errMsg += ': '+rawOutput.message;
                        }
                        //  • if the raw output is anything else, inspect and append it
                        else if (!_.isError(rawOutput)) {
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
                  };
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
            // > Note: When running our fn, we apply a special `this` context
            // > using the provided meta keys (aka habitat vars)
            _.bind(nmDef.fn, metadata)(finalArgins, implSideExitHandlerCbs, metadata);

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
        execSync: function (){
          // throw new Error('...');
          // TODO: Finish implementing this properly, including the various checks & balances.
          var immediateResult;
          this.exec(function (err, result){
            if (err) { throw err; }
            immediateResult = result;
          });
          return immediateResult;
        },

        meta: function (_metadata){
          // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
          // FUTURE: Maybe log warning when `.meta()` is called more than once?
          // (since it can be confusing that the existing metadata gets replaced)
          // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
          metadata = _metadata;
          return this;
        },

        switch: function (userlandHandlers) {

          // Check usage.
          if (!_.isObject(userlandHandlers) || _.isArray(userlandHandlers) || _.isFunction(userlandHandlers)) {
            throw flaverr({name:'UsageError'}, new Error(
              'Sorry, .switch() doesn\'t know how to handle usage like that.\n'+
              'You should pass in a dictionary like `{...}` consisting of at least two\n'+
              'handler functions: one for `error` and one for `success`.  You can also\n'+
              'provide additional keys for any other exits you want to explicitly handle.\n'+
              '> See https://sailsjs.com/support for help.'
            ));
          }//-•

          // Before proceeding, ensure error exit is still configured w/ a callback.
          // If it is not, then get crazy and **throw** BEFORE calling the machine's `fn`.
          //
          // This is just yet another failsafe-- better to potentially terminate the process than
          // open up the possibility of silently swallowing errors later.
          if (!userlandHandlers.error){
            throw flaverr({name:'UsageError'}, new Error(
              'Invalid usage of .switch() -- missing `error` handler.\n'+
              'If you use .switch({...}), the provided dictionary (aka "switchback"), must\n'+
              'define an `error` key with a catchall callback function.  Otherwise, there\n'+
              'would be no way to handle any unexpected or internal errors!\n'+
              '> See https://sailsjs.com/support for help.'
            ));
          }//-•

          // Same thing for the `success` handler -- except in this case, use the provided `error`
          // handler, rather than throwing an uncatchable Error.
          if (!userlandHandlers.success){
            return userlandHandlers.error({name:'UsageError'}, new Error(
              'Invalid usage of .switch() -- missing `success` handler.\n'+
              'If you use .switch({...}), the provided dictionary (aka "switchback"), must\n'+
              'define a `success` key with a callback function.  If you do not care about\n'+
              'the success scenario, please provide a no-op callback, or use .exec() instead.\n'+
              '> See https://sailsjs.com/support for help.'
            ));
          }//-•

          
          // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
          // TODO: Prevent using unexpected additional handler callbacks -- at least without setting a special meta key
          // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

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
          throw flaverr({name:'CompatibilityError'}, new Error('As of machine v15, the experimental `.demuxSync()` method is no longer supported.  Instead, please use something like this:\n'+
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
          ));
        },
        cache: function () {
          throw flaverr({name:'CompatibilityError'}, new Error('As of machine v15, built-in caching functionality (and thus the `.cache()` method) is no longer supported.  Instead, please use your own caching mechanism-- for example:\n'+
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
          ));
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


      // Pass in an interceptor (lifecycle callback) for error/result on the way back out from .exec():
      undefined//TODO

    );

  };//</ return >

};


//  ███████╗████████╗ █████╗ ████████╗██╗ ██████╗    ███╗   ███╗███████╗████████╗██╗  ██╗ ██████╗ ██████╗ ███████╗
//  ██╔════╝╚══██╔══╝██╔══██╗╚══██╔══╝██║██╔════╝    ████╗ ████║██╔════╝╚══██╔══╝██║  ██║██╔═══██╗██╔══██╗██╔════╝
//  ███████╗   ██║   ███████║   ██║   ██║██║         ██╔████╔██║█████╗     ██║   ███████║██║   ██║██║  ██║███████╗
//  ╚════██║   ██║   ██╔══██║   ██║   ██║██║         ██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██║   ██║██║  ██║╚════██║
//  ███████║   ██║   ██║  ██║   ██║   ██║╚██████╗    ██║ ╚═╝ ██║███████╗   ██║   ██║  ██║╚██████╔╝██████╔╝███████║
//  ╚══════╝   ╚═╝   ╚═╝  ╚═╝   ╚═╝   ╚═╝ ╚═════╝    ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝
//                                                                                                                
//   ██╗ ██████╗ ██████╗ ███╗   ███╗██████╗  █████╗ ████████╗██╗██████╗ ██╗██╗     ██╗████████╗██╗   ██╗██╗
//  ██╔╝██╔════╝██╔═══██╗████╗ ████║██╔══██╗██╔══██╗╚══██╔══╝██║██╔══██╗██║██║     ██║╚══██╔══╝╚██╗ ██╔╝╚██╗
//  ██║ ██║     ██║   ██║██╔████╔██║██████╔╝███████║   ██║   ██║██████╔╝██║██║     ██║   ██║    ╚████╔╝  ██║
//  ██║ ██║     ██║   ██║██║╚██╔╝██║██╔═══╝ ██╔══██║   ██║   ██║██╔══██╗██║██║     ██║   ██║     ╚██╔╝   ██║
//  ╚██╗╚██████╗╚██████╔╝██║ ╚═╝ ██║██║     ██║  ██║   ██║   ██║██████╔╝██║███████╗██║   ██║      ██║   ██╔╝
//   ╚═╝ ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝     ╚═╝  ╚═╝   ╚═╝   ╚═╝╚═════╝ ╚═╝╚══════╝╚═╝   ╚═╝      ╚═╝   ╚═╝
//
// Compatibility:
// =====================================================================================================================
module.exports.build = function(){
  console.warn('WARNING: As of v15, machine should be called directly instead of using `.build()`.  (Adjusting for you this time...)');
  return module.exports.apply(undefined, arguments);
};
module.exports.pack = function(){
  throw flaverr({name:'CompatibilityError'}, new Error('As of machine v15, `.pack()` is no longer supported.  Instead, please use `require(\'machinepack\')`.'));
};
