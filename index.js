/**
 * Module dependencies
 */

var _ = require('@sailshq/lodash');
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

  // Verify correctness of node-machine definition, throwing if necessary
  // and potentially coercing it a bit, potentially with some warnings.
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
  return function runFn(argins, explicitCbOrCbsMaybe){

    // Validate argins vs. our declared input definitions.
    // TODO

    // Build and return an appropriate deferred object.
    // (Or possibly just start executing the machine immediately, depending on usage)
    return parley(
      function (done){

        // Now actually run the machine, in whatever way is appropriate based on its implementation type.
        switch (nmDef.implementationType) {
          // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
          // FUTURE: Support other implementation types
          // (see https://github.com/node-machine/spec/pull/2/files#diff-eba3c42d87dad8fb42b4080df85facecR95)
          // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
          case 'traditional':
            throw new Error('The `traditional` implementation type is experimental, and not yet supported.  See https://github.com/node-machine/spec/pull/2/files#diff-eba3c42d87dad8fb42b4080df85facecR95 for background, or https://sailsjs.com/support for help.');

          case 'composite':
            throw new Error('Machines built with the `composite` implementation type cannot be executed using this runner.  (For help, visit https://sailsjs.com/support)');

          default:

            // Note: Implementor-land switchbacks are no longer supported in this implementation type.
            var exitHandlers = function (){ throw new Error('Implementor-land switchbacks are no longer supported by default in the machine runner.  Instead of `exits()`, please call `exits.success()` or `exits.error()` from within your machine `fn`.  (For help, visit https://sailsjs.com/support)'); };
            nmDef.exits = // .. TODO: finish
            _.each(_.omit(nmDef.exits, ['success', 'error']), function (){

            });
            nmDef.fn(argins, exitHandlers);

        }//</ switch >

      },
      undefined,
      {
        execSync: function (){
          // TODO
          throw new Error('TODO');
        },
        setEnv: function (){
          // TODO
          throw new Error('TODO');
        },
        getMethodName: function (){
          // TODO
          throw new Error('TODO');
        }
      }
    );

  };//</ return >

};



// {
//   inputs: {/*...*/},
//   exits: {/*...*/},
//   fn: function(inputs, exits){
//     return exits.error(new Error('asdf'));
//   }
// }




Passwords.encrypt({
  foo: 'bar'
})

