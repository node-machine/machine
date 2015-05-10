/**
 * Module dependencies
 */

var TEST_SUITE = require('rttc/test/spec/coercion.spec');
var runSuite = require('rttc/test/helpers/run-suite');
var toRunTest = require('./helpers/test-exit-coercion.helper');

describe('.coerce()', function (){
  runSuite(TEST_SUITE, toRunTest );
});
