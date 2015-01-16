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
 * @returns {Object} of new, "lightly"-coerced input values, if they could be coerced
 * @throws {Error} If configured inputs are invalid
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
          var err = new Error(util.format('`%s` input is required, but no value was provided (got `undefined`)', inputName));
          return err;
        })());
        return;
      }
    }

    // Note that the `inputs` provided to `validate()` and `getExample()` are:
    // (1) a deep clone, and
    // (2) not necessarily pre-coerced; i.e. a value to a `number` input provided
    //     as "3" would still appear that way to `getExample()`

    try {
      // Run input's `validate()` function, if one exists.
      // (will throw if validation fails)
      runCustomValidation(inputDef,inputName, machine._configuredInputs);
    }
    catch (e) {
      errors.push(e);
      return;
    }

    // Look up input's `example`, running the `getExample()`
    // function, if one exists.
    var example;
    try {
      example = getExample(inputDef, inputName, machine._configuredInputs);
    }
    catch (e) {
      errors.push(e);
      return;
    }

    // Now infer the `typeSchema`.
    var typeSchema;

    // Use the example, if it exists.
    if (!_.isUndefined(example)){
      try {
        typeSchema = rttc.infer(example);
      }
      catch (e) {
        errors.push(e);
        return;
      }
    }

    // If the input has no example, but it has an explicit `typeclass`,
    // use that typeclass as the type schema for validation.
    if (_.isUndefined(typeSchema) && input.typeclass){

      // Handle typeclass array by setting the star array
      if(input.typeclass === 'array') {
        typeSchema = ['*'];
      }

      // Handle typeclass dictionary by setting an empty object
      if(input.typeclass === 'dictionary') {
        typeSchema = {};
      }

      // Handle typeclass * by setting a '*'
      if(input.typeclass === '*') {
        typeSchema = '*';
      }
    }

    // Now that we have a type schema,
    var coercedInputValue;
    try {
      coercedInputValue = rttc.validate(typeSchema, machine._configuredInputs[inputName]);
      coercedInputValues[inputName] = coercedInputValue;
    }
    catch (e) {
      errors.push(e);
      return;
    }
  });

  if (errors.length) {
    throw (function (){
      var err = new Error(util.format('`%s` machine: %d error(s) encountered validating inputs:\n', machine.identity, errors.length, util.inspect(errors)));
      err.code = errors[0].code;
      err.errors = errors;
      return err;
    })();
  }

  return coercedInputValues;
};


/**
 * [runCustomValidation description]
 * @param  {[type]} inputDef                 [description]
 * @param  {[type]} inputName                [description]
 * @param  {[type]} allConfiguredInputValues [description]
 * @return {[type]}                          [description]
 */
function runCustomValidation(inputDef, inputName, allConfiguredInputValues){

  // If `validate()` was not provided, just return;
  if (!inputDef.validate) {
    return;
  }

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
      return new Error(util.format('`%s` input: an error was thrown in the `validate()` check function:\n', inputName, util.inspect(e)));
    })();
  }
  if(!isValid) {
    throw (function (){
      return new Error(util.format('`%s` input: provided value failed the `validate()` check.', inputName));
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
      return new Error(util.format('`%s` input: an error was thrown in the `getExample()` function:\n', inputName, util.inspect(e)));
    })();
  }

  // Validate the returned example:
  // If returned example is an array, make sure it only has one item
  if (_.isArray(newExample)) {
    newExample = newExample.slice(0,1);
  }

  return newExample;
}


