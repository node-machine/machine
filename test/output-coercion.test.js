/**
 * Module dependencies
 */

var runSuite = require('../node_modules/rttc/spec/helpers/run-suite');
var TEST_SUITE = require('../node_modules/rttc/spec/coercion.spec.js');
var toRunTest = require('./helpers/test-exit-coercion.helper');
var expandSuite = require('../node_modules/rttc/spec/helpers/expand-suite');

describe('exhaustive exit coercion tests', function (){

  // Take the array of tests and extend them with some derivative
  // tests automatically.  Then run them.
  runSuite(expandSuite(TEST_SUITE), toRunTest );
});
