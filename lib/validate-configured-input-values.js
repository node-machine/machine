/**
 * Module dependencies
 */

var util = require('util');
var _ = require('lodash');
var rttc = require('rttc');


/**
 * validateConfiguredInputValues()
 *
 * Return true
 * @param  {Machine} machine  - a machine instance
 *
 * @returns {Object}
 *   @property {Object} values - object of new, "lightly"-coerced input values, if they could be coerced
 *   @property {Error} errors - error objects representing invalid configured inputs (or anything else that might have gone wrong)
 */

module.exports = function validateConfiguredInputValues(machine){


  // Validate each input, building up an array of errors and an object
  // of coerced input values.
  var errors = [];
  var coercedInputValues = {};
  _.each(machine.inputs, function (inputDef, inputName){

    // If input is required, check that the configured input value
    // is not `undefined`.
    if (inputDef.required){
      if (_.isUndefined(machine._configuredInputs[inputName])){
        errors.push((function (){
          var _err = new Error(util.format('`%s` is a required input- but it was not defined.', inputName));
          _err.code = 'E_INPUT_REQUIRED';
          _err.input = inputName;
          _err.reason = _err.message;
          // _err.status = 400;
          return _err;
        })());
        return;
      }
    }
    // If input is optional
    else {

      // and the configured value is undefined, just provide
      // it to the machine as `undefined`:
      if (_.isUndefined(machine._configuredInputs[inputName])){
        return;
      }
    }

    // Note that the `inputs` provided to `validate()` and `getExample()` are:
    // (1) a deep clone, and
    // (2) not necessarily pre-coerced; i.e. a value to a `number` input provided
    //     as "3" would still appear that way to `getExample()`

    // If `validate()` was provided...
    if (inputDef.validate) {
      try {
        // Run input's `validate()` function, if one exists.
        // (will throw if validation fails)
        runCustomValidation(inputDef,inputName, machine._configuredInputs);
        return;
      }
      catch (e) {
        e.input = inputName;
        errors.push(e);
        return;
      }
    }

    // Look up input's `example`, running the `getExample()`
    // function, if one exists.
    var example;
    try {
      example = getExample(inputDef, inputName, machine._configuredInputs);
    }
    catch (e) {
      e.input = inputName;
      errors.push(e);
    }

    // Now infer the `typeSchema`.
    var typeSchema;

    // Use the example, if it exists.
    if (!_.isUndefined(example)){
      try {
        typeSchema = rttc.infer(example);
      }
      catch (e) {
        e.input = inputName;
        errors.push(e);
        return;
      }
    }

    // If the input has no example, but it has an explicit `typeclass`,
    // use that typeclass as the type schema for validation.
    if (_.isUndefined(typeSchema) && inputDef.typeclass){

      // Handle typeclass array by setting the star array
      if(inputDef.typeclass === 'array') {
        typeSchema = ['*'];
      }

      // Handle typeclass dictionary by setting an empty object
      if(inputDef.typeclass === 'dictionary') {
        typeSchema = {};

        // But also ensure that the configured input value is not an array
        if (_.isArray(machine._configuredInputs[inputName])){
          errors.push((function (){
            var _err = new Error(util.format('input %s: typeclass: dictionary, but an array was provided: %s', inputName, util.inspect(machine._configuredInputs[inputName], false, null)));
            _err.code = 'E_TYPECLASS';
            _err.input = inputName;
            _err.reason = _err.message;
            // _err.status = 400;
            return _err;
          })());
        }
      }

      // Handle typeclass * by setting a '*'
      if(inputDef.typeclass === '*' || inputDef.typeclass === 'machine') {
        typeSchema = '*';
      }
    }

    // console.log('got typeSchema:', typeSchema,'from example:', example);

    // Now that we have a type schema,
    var coercedInputValue;
    try {
      // validate / coerce the input
      coercedInputValue = rttc.validate(typeSchema, machine._configuredInputs[inputName]);
    }
    catch (e) {
      e.input = inputName;
      errors.push(e);

      // Even if a validatoin error occurs, still compute coerced input value
      // for use in the result.
      coercedInputValue = rttc.coerce(typeSchema, machine._configuredInputs[inputName]);
    }


    // Save the coerced input value in result object.
    coercedInputValues[inputName] = coercedInputValue;
  });


  return {
    errors: errors,
    values: coercedInputValues
  };
};


/**
 * [runCustomValidation description]
 * @param  {[type]} inputDef                 [description]
 * @param  {[type]} inputName                [description]
 * @param  {[type]} allConfiguredInputValues [description]
 * @return {[type]}                          [description]
 */
function runCustomValidation(inputDef, inputName, allConfiguredInputValues){

  // (`validate()` is provided with a helpful execution-time `env` object)
  var env = {
    _: _,
    types: rttc
  };

  var isValid;
  try {
    isValid = inputDef.validate.apply(env, [_.cloneDeep(allConfiguredInputValues), env]);
  }
  catch (e) {
    throw (function (){
      var _err = new Error(util.format('`%s` input: an error was thrown in the `validate()` check function:\n', inputName, util.inspect(e)));
      _err.code = 'E_INPUT_CUSTOM_VALIDATE';
      _err.reason = _err.message;
      _err.input = inputName;
      // _err.status = 400;
      return _err;
    })();
  }
  if(!isValid) {
    throw (function (){
      var _err = new Error(util.format('`%s` input: provided value failed the `validate()` check.', inputName));
      _err.code = 'E_INPUT_CUSTOM_VALIDATE';
      _err.reason = _err.message;
      _err.input = inputName;
      // _err.status = 400;
      return _err;
    })();
  }
}



/**
 * [getExample description]
 * @param  {[type]} inputDef                 [description]
 * @param  {[type]} inputName                [description]
 * @param  {[type]} allConfiguredInputValues [description]
 * @return {[type]}                          [description]
 */
function getExample (inputDef, inputName, allConfiguredInputValues) {

  // If `getExample()` was not provided, just return the example.
  if (!inputDef.getExample){
    return inputDef.example;
  }

  // (`getExample()` is provided with a helpful execution-time `env` object)
  var env = {
    _: _,
    types: rttc
  };

  var newExample;
  try {
    newExample = inputDef.getExample.apply(env, [_.cloneDeep(allConfiguredInputValues), env]);
  }
  catch (e) {
    throw (function (){
      var _err = new Error(util.format('`%s` input: an error was thrown in the `getExample()` function:\n', inputName, util.inspect(e)));
      _err.code = 'E_INPUT_GETEXAMPLE';
      _err.reason = _err.message;
      _err.input = inputName;
      // _err.status = 400;
      return _err;
    })();
  }

  // Validate the returned example:
  // If returned example is an array, make sure it only has one item
  if (_.isArray(newExample)) {
    newExample = newExample.slice(0,1);
  }

  return newExample;
}


