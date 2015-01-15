/**
 * Module dependencies
 */

var _ = require('lodash');
var rttc = require('rttc');
var setTypes = require('./Machine.setTypes');


/**
 * validateConfiguredInputValues()
 *
 * Return true
 * @param  {Machine} machine  - a machine instance
 *
 * @returns {Object} of new, "lightly"-coerced input values, if they could be coerced
 * @throws {Error} If configured inputs are invalid
 */
module.exports = function validateConfiguredInputValues(machine){

  var validationErrors = [];

  var coercedInputValues = _.reduce(machine.inputs, function (memo, inputDef, inputName){
    var inputTypeSchema;

    var coercedInputValue;
    try {
      coercedInputValue = rttc.validate(inputTypeSchema, machine._configuredInputs[inputName]);
    }
    catch (e) {

    }

    return memo;
  }, {});

  if (errors.length) {
    throw (function (){
      var err = new Error(util.format('%d error(s) validating value:\n', errors.length, errors));
      err.code = errors[0].code;
      err.errors = errors;
      return err;
    })();
  }

  return coercedInputValues;
};




function buildInputTypeSchema(inputDef){

  // Build up an env object
  var env = this._configuredEnvironment || {};

}
