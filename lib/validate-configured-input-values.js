/**
 * Module dependencies
 */

var util = require('util');
var _ = require('lodash');
var rttc = require('rttc');
var buildLamdaMachine = require('./build-lamda-machine');




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
        //
        // NOTE: This step is crucial!
        // This check in the machine runner is the only way to allows undefined values
        // when there is an explicit example; even when that example is `===`.
        //
        // `rttc` normally treats everything as if it is required.
        // So if you are validating against a nested `===` in the example, for instance,
        // if the actual value is `undefined`, the validation will fail.
        //
        // That said, `undefined` _can_ make it past validation if it is attached
        // to a key in a nested dictionary, or as an item in a nested array within
        // a dict/array that is passed through `example: '==='`.
        //
        // In the same situation, but with `example: {}` or `example: []`, `undefined` items
        // will be removed from arrays, and if there are any keys with `undefined` attached as
        // a value, those keys will be stripped.
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

    // Look up input's `example`, using `like`/`itemOf`/or running the `getExample()`
    // function, if one exists.
    //
    //////////////////////////////////////////////////////////////////////////////////
    // WARNING: INPUT GETEXAMPLE FUNCTIONS WILL BE DEPRECATED IN AN UPCOMING RELEASE.
    //////////////////////////////////////////////////////////////////////////////////
    var example;
    try {
      example = getExample(inputDef, inputName, machine._configuredInputs, machine);
    }
    catch (e) {
      e.input = inputName;
      errors.push(e);
    }



    // Now infer the `typeSchema`.
    var typeSchema;



    // If the input has no example, but it has an explicit `typeclass`,
    // infer a type schema from that `typeclass`
    //
    ////////////////////////////////////////////////////////////////////////
    // WARNING: THIS FEATURE WILL BE DEPRECATED IN AN UPCOMING RELEASE.
    ////////////////////////////////////////////////////////////////////////
    if (_.isUndefined(typeSchema) && inputDef.typeclass){

      // Handle typeclass array by setting `example: []`
      if(inputDef.typeclass === 'array') {
        typeSchema = [];
      }

      // Handle typeclass dictionary by setting `example: {}`
      if(inputDef.typeclass === 'dictionary') {
        typeSchema = {};

        // But also ensure that the configured input value is not an array
        // if (_.isArray(machine._configuredInputs[inputName])){
        //   errors.push((function (){
        //     var _err = new Error(util.format('input %s: typeclass: dictionary, but an array was provided: %s', inputName, util.inspect(machine._configuredInputs[inputName], false, null)));
        //     _err.code = 'E_TYPECLASS';
        //     _err.input = inputName;
        //     _err.reason = _err.message;
        //     // _err.status = 400;
        //     return _err;
        //   })());
        // }
      }

      // Handle typeclass * by setting type to 'ref'
      if(inputDef.typeclass === '*') {
        typeSchema = 'ref';
      }

      // Handle typeclass 'machine' (which will be deprecated soon) by setting type to 'ref'
      if (inputDef.typeclass === 'machine') {
        typeSchema = 'ref';
      }
    }


    // Prefer the example over typeclass, if one exists.
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


    // Now that we have a type schema, we're about to validate the input value.
    // Since this oftentimes sanitizes it a little bit, we need a new variable to
    // hold that transformed value in.  Also, we'll first instantiate a machine for
    // lamda inputs which provide a `contract`, so same deal there.
    var coercedInputValue;


    // If...
    //  (1) this input is expecting a `lamda` type value at the top-level
    //    -AND-
    //  (2) a `contract` was provided for this input
    //
    // then instantiate the provided lamda into a callable lamda machine for our `fn` to use.
    //
    // Note:
    // If this is just an input which happens to expect a `lamda`,
    // i.e. no contract was provided, no problem, just continue onwards
    // and treat it like any other value.
    //
    if (!_.isUndefined(inputDef.contract)) {
      if (typeSchema === 'lamda') {
        try {

          coercedInputValue = buildLamdaMachine(machine._configuredInputs[inputName], inputName, machine, machine._rootMachine||machine);

          // Return early for now
          // (TODO: remove this if rttc supports contracts in the future)
          coercedInputValues[inputName] = coercedInputValue;
          return;
        }
        catch (e) {
          e.input = inputName;
          errors.push(e);
          return;
        }
      }
      // If a `contract` was provided, but the input is not expecting a lamda function,
      // then we never should have made it this far (machine would have failed to build)
    }


    // Validate the input (potentially mildly coercing it as well) and push on any errors
    // we detect.
    try {
      if (!machine._inputCoercion) {
        // If `inputCoercion` is disabled, use `.validateStrict()` instead
        // of `.validate()` and make `coercedInputValue` a direct reference.
        // Warning! This can cause unexpected issues with entanglement!
        // Use at your own risk!
        coercedInputValue = machine._configuredInputs[inputName];
        rttc.validateStrict(typeSchema, machine._configuredInputs[inputName]);
      }
      else {
        coercedInputValue = rttc.validate(typeSchema, machine._configuredInputs[inputName]);
      }
    }
    catch (e) {
      e.input = inputName;
      errors.push(e);
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
 * Determine the real runtime exemplar for an input.
 * Could use an explicit `example`, a `like` or `itemOf` binding,
 * or a `getExample` function.
 *
 *
 * @param  {[type]} inputDef                 [description]
 * @param  {[type]} inputName                [description]
 * @param  {[type]} allConfiguredInputValues [description]
 * @param  {[type]} machineDef [description]
 * @return {[type]}                          [description]
 */
function getExample (inputDef, inputName, allConfiguredInputValues, machineDef) {

  var newExample;

  // Used below to hold the referenced input definition and its actual configured runtime value, respectively.
  var referencedInputDef;
  var referencedActualVal;

  // Handle `like`:
  if (_.isString(inputDef.like)) {
    referencedInputDef = machineDef.inputs[inputDef.like];
    referencedActualVal = allConfiguredInputValues[inputDef.like];

    if (!referencedInputDef) {
      throw new Error(util.format('Could not find input `%s` referenced by `like` in machine `%s`', inputDef.like, machineDef.identity));
    }

    // If `isExemplar` property is set, then we'll interpret the actual runtime value literally as an RTTC exemplar.
    // Otherwise, we'll assume it is a normal everyday value and coerce it into an exemplar.
    referencedActualVal = rttc.coerceExemplar(referencedActualVal, referencedInputDef.isExemplar);

    // Take the type intersection of the runtime value and the static example
    // (we want our real, runtime exemplar that is used for input validation/coercion
    //  to be the narrowest-possible exemplar that accepts the set of values that
    //  statisfy BOTH schemas-- i.e. the intersection.  This MAY NOT always work
    //  because, at this point, input validation has not run yet.)
    var likeIntersection = rttc.intersection(referencedInputDef.example, referencedActualVal, true, true);
    if (_.isNull(likeIntersection)) {
      // If the intersection failed, use the defined example of the referenced
      // input (which is probably more broad, but oh well, that's the best we can do
      // since the types aren't compatible.)
      return referencedInputDef.example;
    }
    return likeIntersection;
  }

  // Handle `itemOf`:
  if (_.isString(inputDef.itemOf)) {
    referencedInputDef = machineDef.inputs[inputDef.itemOf];
    referencedActualVal = allConfiguredInputValues[inputDef.itemOf];

    if (!referencedInputDef) {
      throw new Error(util.format('Could not find input `%s` referenced by `itemOf` in machine `%s`', inputDef.itemOf, machineDef.identity));
    }

    // If `isExemplar` property is set, then we'll interpret the actual runtime value literally as an RTTC exemplar.
    // Otherwise, we'll assume it is a normal everyday value and coerce it into an exemplar.
    referencedActualVal = rttc.coerceExemplar(referencedActualVal, referencedInputDef.isExemplar);

    // If the runtime value is an empty array, or unspecified altogether, fall back
    // to using the more-generic example we already figured out when building this machine instance.
    if (!referencedActualVal || referencedActualVal.length < 1) {
      return machineDef.inputs[inputDef.itemOf].example[0];
    }

    // Take the type intersection of the runtime input value's pattern, and the
    // pattern of the static input example
    // (we want our real, runtime exemplar that is used for input coercion to
    //  be the narrowest-possible exemplar that accepts the set of values that
    //  statisfy BOTH schemas-- i.e. the intersection.  This MAY NOT always work
    //  because, at this point, input validation has not run yet.)
    var itemOfIntersection = rttc.intersection(referencedInputDef.example[0], referencedActualVal[0], true, true);
    if (_.isNull(itemOfIntersection)) {
      // If the intersection failed, use the defined example of the referenced
      // input (which is probably more broad, but oh well, that's the best we can do
      // since the types aren't compatible.)
      return referencedInputDef.example[0];
    }
    return itemOfIntersection;
  }

  // Handle explicit example:
  if (!inputDef.getExample){
    // If `getExample()` was not provided, just return the explicit example.
    return inputDef.example;
  }

  // Handle getExample():
  // (`getExample()` is provided with a helpful execution-time `env` object)
  // TODO: deprecate
  var env = {
    _: _,
    types: rttc
  };
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

