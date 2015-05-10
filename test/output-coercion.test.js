/**
 * Module dependencies
 */

var runSuite = require('../node_modules/rttc/test/helpers/run-suite');
var TEST_SUITE = require('../node_modules/rttc/test/spec/coercion.spec.js');
var toRunTest = require('./helpers/test-exit-coercion.helper');

describe('.coerce()', function (){
  runSuite(TEST_SUITE, toRunTest );
});
