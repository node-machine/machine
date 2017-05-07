/**
 * Module dependencies
 */

var util = require('util');
var _ = require('@sailshq/lodash');
var flaverr = require('flaverr');
var parley = require('parley');


/**
 * buildCallableMachine()
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

  // Verify correctness of node-machine definition.
  // TODO

  // Determine the effective identity of this machine.
  var identity;//TODO

  // Sanitize input definitions.
  // var inputDefs = nmDef.inputs || {};
  // TODO

  // Sanitize exit definitions.
  var exitDefs = nmDef.exits || {};
  exitDefs.success = exitDefs.success || {};
  exitDefs.error = exitDefs.error || {};
  // TODO


  // Return our callable ("wet") machine function in the appropriate format.
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // FUTURE: Consider support for returning a machine function with other usage styles
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

    // Tolerate unspecified metadata (aka habitat vars):
    if (_.isUndefined(metadata)) {
      metadata = {};
    }//>-

    // Check usage.
    if (!_.isObject(argins) && _.isFunction(argins) && _.isArray(argins)) {
      throw new Error(
        'Sorry, this function doesn\'t know how to handle usage like that.\n'+
        'If provided, the 1st argument should be a dictionary like `{...}`\n'+
        'consisting of input values (aka "argins") to pass through to the fn.\n'+
        '> See https://sailsjs.com/support for help.'
      );
    }
    if (!_.isUndefined(explicitCbMaybe) && !_.isFunction(explicitCbMaybe)) {
      throw new Error(
        'Sorry, this function doesn\'t know how to handle usage like that.\n'+
        'If provided, the 2nd argument should be a function like `function(err,result){...}`\n'+
        'that will be triggered as a callback after this fn is finished.\n'+
        '> See https://sailsjs.com/support for help.'
      );
    }

    // Build and return an appropriate deferred object.
    // (Or possibly just start executing the machine immediately, depending on usage)
    return parley(
      function (done){

        // Now actually run the machine, in whatever way is appropriate based on its implementation type.
        switch (nmDef.implementationType) {
          // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
          // FUTURE: Support automatically mapping this usage to other implementation types:
          // (see https://github.com/node-machine/spec/pull/2/files#diff-eba3c42d87dad8fb42b4080df85facecR95)
          // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
          case 'traditional':
            throw new Error('The `traditional` implementation type is experimental, and not yet supported.  See https://github.com/node-machine/spec/pull/2/files#diff-eba3c42d87dad8fb42b4080df85facecR95 for background, or https://sailsjs.com/support for help.');

          case 'composite':
            throw new Error('Machines built with the `composite` implementation type cannot be executed using this runner.  (For help, visit https://sailsjs.com/support)');

          default:

            // Run `fn`.
            // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
            // TODO: When running our fn, apply a special `this` context using the provided "metadata" (aka habitat vars)
            // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
            nmDef.fn(

              (function _gettingArgins(){
                // Validate argins vs. our declared input definitions.
                // (Potentially, also coerce them.)
                // TODO

                return argins;
              })(),

              (function _gettingHandlerCbs(){
                // Build & return exit handler callbacks for use by the machine's `fn`.
                var handlerCbs = function (){ throw new Error('Implementor-land switchbacks are no longer supported by default in the machine runner.  Instead of `exits()`, please call `exits.success()` or `exits.error()` from within your machine `fn`.  (For help, visit https://sailsjs.com/support)'); };
                (function _attachingHandlerCbs(proceed){
                  handlerCbs.error = function(rawOutput){
                    // Ensure error instance.
                    var err = rawOutput;//TODO
                    return proceed(err);
                  };

                  handlerCbs.success = function(rawOutput){
                    // Ensure valid result (vs. expected output type for this exit)
                    var result = rawOutput;//TODO
                    return proceed(undefined, result);
                  };

                  _.each(_.omit(_.keys(exitDefs), ['error','success']), function (miscExitCodeName){
                    handlerCbs[miscExitCodeName] = function (rawOutput){

                      // Now build our Error instance (our "forwarding error").
                      var err = flaverr({
                        exit: miscExitCodeName,
                        code: miscExitCodeName,// `exit` and `code` are just aliases of each other
                        raw: rawOutput,
                        // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
                        // FUTURE: Potentially add backwards-compatibility:
                        // ```
                        //     output: rawOutput,//<<for backwards-compatibility
                        // ```
                        // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
                      }, new Error((function _gettingErrMsg(){
                        // The error msg always begins with a standard prefix:
                        var errMsg = '`'+identity+'` triggered its `'+miscExitCodeName+'` exit';
                        // And is then augmented by some additional basic rules:
                        //  • if there is no raw output, append the exit description if available.
                        if (_.isUndefined(rawOutput)) {
                          if (!_.isObject(exitDefs[miscExitCodeName])) { throw new Error('Consistency violation: Live machine instance ('+identity+') has become corrupted!  One of its exits (`'+miscExitCodeName+'`) has gone missing _while the machine was being executed_!'); }
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
                      })()));

                      return proceed(err);
                    };
                  });//</ each misc. exit >

                })(function (err, result){
                  if (err) { return done(err); }
                  if (_.isUndefined(result)) { return done(); }
                  return done(undefined, result);
                });//</ ... >
                return handlerCbs;
              })(),

              (function _gettingHabitatVars() {
                return metadata;
              })()
            );

        }//</ switch >

      },

      // If provided, use the explicit callback.
      _.isFunction(explicitCbMaybe) ? explicitCbMaybe : undefined,

      // Extra methods for the Deferred:
      {
        execSync: function (){
          // throw new Error('TODO');
          // TODO: Finish implementing this properly, including the various checks & balances.
          var immediateResult;
          this.exec(function (err, result){
            if (err) { throw err; }
            immediateResult = result;
          });
          return immediateResult;
        },

        meta: function (_metadata){
          metadata = _metadata;
        },

        // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
        // TODO: figure out how/if we're going to support userland switchbacks going forward.
        // e.g.
        // ```
        //     .switch({
        //       error: function(err){...},
        //       foo: function(){...},
        //       success: function(){...}
        //     })
        // ```
        // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
      }
    );

  };//</ return >

};

