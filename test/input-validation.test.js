/**
 * Module dependencies
 */

var _ = require('lodash');
var runSuite = require('../node_modules/rttc/spec/helpers/run-suite');
var TEST_SUITE = require('../node_modules/rttc/spec/validation.spec.js');
var expandSuite = require('../node_modules/rttc/spec/helpers/expand-suite');
var toRunTest = require('./helpers/test-input-validation.helper');

describe('exhaustive input validation tests', function (){

  // Take the array of tests and extend them with some derivative
  // tests automatically.
  TEST_SUITE = expandSuite(TEST_SUITE);

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
      });
    }
  });
  TEST_SUITE = TEST_SUITE.concat(extraTypeclassTests);

  // Now run all of the tests
  runSuite(TEST_SUITE, toRunTest );
});

