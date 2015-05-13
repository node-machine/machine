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
      extraTypeclassTests.push((function(newTest){
        _.extend(newTest, _.cloneDeep(test));
        delete newTest.example;
        newTest.typeclass = 'dictionary';
        return newTest;
      })({}));
    }
    // Inject extra test to try `example:[]` as `typeclass: 'array'` (at the top-level)
    else if (_.isEqual(test.example, [])) {
      extraTypeclassTests.push((function(newTest){
        _.extend(newTest, _.cloneDeep(test));
        delete newTest.example;
        newTest.typeclass = 'array';
        return newTest;
      })({}));
    }
    // Inject extra test to try `example: '*'` as `typeclass: '*'` (at the top-level)
    else if (_.isEqual(test.example, '*')) {
      extraTypeclassTests.push((function(newTest){
        _.extend(newTest, _.cloneDeep(test));
        delete newTest.example;
        newTest.typeclass = '*';
        return newTest;
      })({}));
    }
  });
  TEST_SUITE = TEST_SUITE.concat(extraTypeclassTests);

  // Now run all of the tests
  runSuite(TEST_SUITE, toRunTest );
});

