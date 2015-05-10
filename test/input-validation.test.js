/**
 * Module dependencies
 */

var _ = require('lodash');
var TEST_SUITE = require('./node_modules/rttc/test/spec/validation.spec');
var runSuite = require('./node_modules/rttc/test/helpers/run-suite');
var toRunTest = require('./helpers/test-input-validation.helper');

describe('.validate()', function (){


  // Modify the test suite to also test `typeclass` alongside the comparable examples.
  var extraTypeclassTests = [];
  _.each(TEST_SUITE, function (test){
    // Inject extra test to try `example:{}` as `typeclass: 'dictionary'` (at the top-level)
    if (_.isEqual(test.example, {})) {
      extraTypeclassTests.push({
        typeclass: 'dictionary',
        actual: test.actual,
        result: test.result,
        error: test.error
      });
    }
    // Inject extra test to try `example:[]` as `typeclass: 'array'` (at the top-level)
    else if (_.isEqual(test.example, [])) {
      extraTypeclassTests.push({
        typeclass: 'array',
        actual: test.actual,
        result: test.result,
        error: test.error
      });
    }
    // Inject extra test to try `example: '*'` as `typeclass: '*'` (at the top-level)
    else if (_.isEqual(test.example, '*')) {
      extraTypeclassTests.push({
        typeclass: '*',
        actual: test.actual,
        result: test.result,
        error: test.error,
        // We have to mark this as `required: false` because the definition
        // of "required" is "not undefined".  However since `rttc` doesn't
        // have a notion of required vs. not, we need to enforce
        // a special exception for this edge case.
        //
        // TODO: eventually we should be able to remove the `required`
        // check from the machine runner, and just rttc defaults.  When
        // that happens, everything should just work.
        required: false
      });
    }
  });
  TEST_SUITE = TEST_SUITE.concat(extraTypeclassTests);



  // Now run all of the tests
  runSuite(TEST_SUITE, toRunTest );
});

