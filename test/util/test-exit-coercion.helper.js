/**
 * Module dependencies
 */

var util = require('util');
var _ = require('@sailshq/lodash');
var rttc = require('rttc');
var Machine = require('../../');
var isEquivalent = require('../../node_modules/rttc/spec/helpers/is-equivalent');


module.exports = function testExitCoercion(expectations, cb){

  // Determine type schema of the value.
  // (using inference to pull it from the `example`, if provided)
  var typeSchema = rttc.infer(expectations.example);

  var machine = Machine.build({
    inputs: {},
    exits: {
      error: {},
      success: (function _determineExitDefinition(){
        var def = {};
        if (!_.isUndefined(expectations.example)) {
          def.example = expectations.example;
        }
        if (!_.isUndefined(expectations.getExample)) {
          def.getExample = expectations.getExample;
        }
        if (!_.isUndefined(expectations.void)) {
          def.void = expectations.void;
        }
        return def;
      })()
    },
    fn: function (inputs, exits) {
      exits(null, expectations.actual);
    }
  })
  .exec(function (err, actualResult){
    if (err) return cb(new Error('Unexpected error:'+require('util').inspect(err, false, null)));

    // If `example` is undefined, automatically pass the test (because `undefined` exit example
    //  is a special case that is slightly different than ref: ie. it skips base value coercion)
    if (_.isUndefined(expectations.example)) {
      // TODO: consider doing a strictEq check here instead
      return cb();
    }

    // If an expected `result` is provided, compare the actual result against that.
    // Otherwise compare it against the original value (`actual`)
    var compareTo = expectations.hasOwnProperty('result') ? expectations.result : expectations.actual;

    // if `result` is set, use a lodash equality check
    if (!isEquivalent(actualResult, compareTo, typeSchema)) {
      return cb(new Error('returned incorrect value: '+util.inspect(actualResult, false, null)));
    }

    // Test using strict equality (===) if explicitly requested
    if (expectations.strictEq) {
      if (actualResult !== compareTo) {
        return cb(new Error('returned value is equivalent (but not ===)'));
      }
    }

    // Test AGAINST strict equality using `isNew` if requested
    // (i.e. guarantees this is a new value and is !== what was passed in)
    if (expectations.isNew) {

      // Check both the expected result and the actual value, just to be safe.
      // (should never even be possible for it to be a direct reference to the expected result)
      if (actualResult === compareTo || actualResult === expectations.actual) {
        return cb(new Error('returned value === value that was passed in -- but should have been a new value!'));
      }
    }

    // If we made it here, everything's good!
    return cb();
  });
};
