/**
 * Module dependencies
 */

var runSuite = require('../node_modules/rttc/spec/helpers/run-suite');
var TEST_SUITE = require('../node_modules/rttc/spec/coercion.spec.js');
var toRunTest = require('./helpers/test-exit-coercion.helper');

describe('exhaustive exit coercion tests', function (){
  runSuite(TEST_SUITE, toRunTest );
});
