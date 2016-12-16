/**
 * Module dependencies
 */

var util = require('util');
var _ = require('@sailshq/lodash');
var rttc = require('rttc');
var Machine = require('../../');
var isEquivalent = require('../../node_modules/rttc/spec/helpers/is-equivalent');



module.exports = function testInputValidation(expectations, cb){

  // Determine type schema of the value.
  // (using inference to pull it from the `example`, if provided)
  var typeSchema;
  if (!_.isUndefined(expectations.typeclass)) {
    if (expectations.typeclass==='dictionary') {
      typeSchema = {};
    }
    else if (expectations.typeclass==='array') {
      typeSchema = [];
    }
    else {
      typeSchema = 'ref';
    }
  }
  else {
    typeSchema = rttc.infer(expectations.example);
  }


  var _inputsInFn;
  var machine = Machine.build({
    inputs: {
      x: (function _determineInputDefinition(){
        var def = {};
        if (_.isUndefined(expectations.required)) {
          // Act like `required` is always present so we can
          // use the existing test suite from `rttc()`.
          def.required = true;
        }
        if (!_.isUndefined(expectations.example)) {
          def.example = expectations.example;
        }
        if (!_.isUndefined(expectations.typeclass)) {
          def.typeclass = expectations.typeclass;
        }
        if (!_.isUndefined(expectations.getExample)) {
          def.getExample = expectations.getExample;
        }
        if (!_.isUndefined(expectations.validate)) {
          def.validate = expectations.validate;
        }
        return def;
      })()
    },
    exits: {
      error: {},
      success: {}
    },
    fn: function (inputs, exits) {
      _inputsInFn = inputs;
      exits();
    }
  })
  .configure({
    x: expectations.actual
  })
  .exec(function (err){

    // validate that error exit was traversed, if expected
    if (err){
      if (expectations.error) return cb();
      return cb(new Error('did not expect machine to call `error`, but it did:\n' + util.inspect(err)));
    }
    else if (expectations.error) {
      // console.log('\nTEST:',expectations);
      // if (_.isObject(expectations.actual)) {
      //   console.log('\nactual constructor name:',expectations.actual.constructor.name);
      // }
      // console.log('\nTYPESCHEMA:',typeSchema);
      return cb(new Error('expected machine to call `error` exit due to input validation error, but it did not. ' + ('Instead got '+util.inspect(_inputsInFn.x, false, null))+'.' ));
    }

    if (!_.isObject(_inputsInFn)) {
      return cb(new Error('`inputs` argument in machine fn was corrupted!'));
    }

    // If an expected `result` is provided, compare the actual result against that.
    // Otherwise compare it against the original value (`actual`)
    var compareTo = expectations.hasOwnProperty('result') ? expectations.result : expectations.actual;

    // Provide direct access to actual result for clarity in comparisons below.
    var actualResult = _inputsInFn.x;

    // use `isEquivalent` from `rttc`
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

