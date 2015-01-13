/**
 * Given a set of machine inputs, determine their types.
 * @param  {Object} inputs
 */

var _ = require('lodash');
var T = require('rttc');

module.exports = function Machine_setTypes (inputs, configuredInputs) {

  var errors = [];
  var typeDef = {};

  // Build up an env object
  var env = this._configuredEnvironment || {};

  // For each input, ensure the type is valid
  _.each(_.keys(inputs), function(inputName) {
    var input = inputs[inputName];
    var type;
    var example;

    // validate rules all
    if(input.validate) {
      try {
        // Build up some helpful execution time env options to pass into getExample
        var callTimeEnv = {
          _: require('lodash'),
          types: T
        };

        var valid = input.validate.call(callTimeEnv, inputs, env);
        if(!valid) {
          errors.push(inputName + ' does not contain valid input values.');
          return;
        }
      }
      catch(e) {
        errors.push(inputName + ' does not contain valid input values.');
        return;
      }

      // Add a valid flag to show it was run through the runtime type check
      typeDef[inputName] = {
        valid: true,
        required: input.required || false
      };
      return;
    }

    // Get Example rules all
    else if(input.getExample) {
      try {

        // Build up some helpful execution time env options to pass into getExample
        var callTimeEnv = {
          _: require('lodash'),
          types: T
        };


        input.example = input.getExample.call(callTimeEnv, configuredInputs, env, configuredInputs[inputName]);

        // Validate the returned example
        // If returned example is an array, make sure it only has one item
        if (_.isArray(input.example)) {
          input.example = input.example.slice(0,1);
        }
      }
      catch(e) {
        errors.push(inputName + ' errored when running .getExample()');
        return;
      }

      // Double check if a typeclass AND a getExample were used
      if(input.typeclass && input.typeclass === 'array') {
        if(!_.isArray(input.example)) {
          errors.push(inputName + ' expected an array but got something else.');
          return;
        }
      }

      if(input.typeclass && input.typeclass === 'dictionary') {
        if(!_.isPlainObject(input.example)) {
          errors.push(inputName + ' expected an object but got something else.');
          return;
        }
      }
    }

    // Check for an explicit typeclass
    else if(input.typeclass) {

      // Handle typeclass array by setting the star array
      if(input.typeclass === 'array') {
        type = ['*'];
      }

      // Handle typeclass dictionary by setting an empty object
      if(input.typeclass === 'dictionary') {
        type = {};
      }

      // Handle typeclass * by setting a '*'
      if(input.typeclass === '*') {
        type = '*';
      }

      typeDef[inputName] = {
        type: type,
        required: input.required || false
      };

      return;
    }

    ////////////////////////////////////////////////////////////////////
    // Use the example and infer a type or interface
    ////////////////////////////////////////////////////////////////////

    // If no example is given we can't infer a type
    if(!T.types.defined.is(input.example)) {
      errors.push(inputName + ' missing example or explicit type');
      return;
    }

    // Attempt to infer the types from the configured inputs
    type = T.infer(input.example);

    // If the example array is longer than one item, return an error.
    if(_.isArray(type) && input.example.length > 1) {
      errors.push(inputName + ' can only contain a single example value');
      return;
    }

    typeDef[inputName] = {
      type: type,
      required: input.required || false
    };
  });

  if(errors.length) {
    throw new Error(errors);
  }

  return typeDef;
};
