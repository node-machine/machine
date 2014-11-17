/**
 * Given a set of machine inputs, determine their types.
 * @param  {Object} inputs
 */

var _ = require('lodash');
var T = require('./types');

module.exports = function MachineºsetTypes (inputs) {

  var errors = [];
  var typeDef = {};

  // For each input, ensure the type is valid
  _.each(_.keys(inputs), function(inputName) {
    var input = inputs[inputName];
    var type;
    var example;

    // Check for an explicit typeclass
    if(input.typeclass) {

      // Handle typeclass array by setting the star array
      if(input.typeclass === 'array') {
        type = ['*'];
      }

    }

    // Otherwise use the example and infer a type or interface
    else {

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
    }

    typeDef[inputName] = {
      type: type,
      required: input.required || false
    };
  });

  return typeDef;
};
