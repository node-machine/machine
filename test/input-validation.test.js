/**
 * Module dependencies
 */

var TEST_SUITE = require('rttc/test/spec/validation.spec');
var runSuite = require('rttc/test/helpers/run-suite');
var toRunTest = require('./helpers/test-input-validation.helper');

describe('.validate()', function (){
  runSuite(TEST_SUITE, toRunTest );
});


// TODO: test typeclasses again

//   // Then run applicable tests again, but using `typeclass`
//   _.each(INPUT_TEST_SUITE, function (test){
//     // Inject extra test to try `example:{}` as `typeclass: 'dictionary'` (at the top-level)
//     if (_.isEqual(test.example, {})) {
//       describeAndExecuteTest({
//         typeclass: 'dictionary',
//         actual: test.actual,
//         result: test.result,
//         error: test.error
//       });
//     }
//     // Inject extra test to try `example:[]` as `typeclass: 'array'` (at the top-level)
//     else if (_.isEqual(test.example, [])) {
//       describeAndExecuteTest({
//         typeclass: 'array',
//         actual: test.actual,
//         result: test.result,
//         error: test.error
//       });
//     }
//     // Inject extra test to try `example: '*'` as `typeclass: '*'` (at the top-level)
//     else if (_.isEqual(test.example, '*')) {
//       describeAndExecuteTest({
//         typeclass: '*',
//         actual: test.actual,
//         result: test.result,
//         error: test.error
//       });
//     }
//   });
