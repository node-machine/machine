/**
 * Given a set of machine inputs, determine their types.
 * @param  {Object} inputs
 */

var T = require('./types');

module.exports = function MachineºsetTypes (inputs) {

  var errors = [];
  var typeDef = {};

  // For each input, ensure the type is valid
  _.each(_.keys(inputs), function(inputName) {
    var input = inputs[inputName];
    var type;
    var example;

    // Check for an explicit type
    if(input.type) {
      type = input.type;
    }

    // Otherwise use the example and infer a type or interface
    else {

      // If no example is given we can't infer a type
      if(!T.types.defined.is(input.example)) {
        errors.push(inputName + ' missing example or explicit type');
        return;
      }

      // Attempt to infer the types from the configured inputs
      type = T.infer(example);
    }

    typeDef[inputName] = {
      type: type,
      required: input.required
    };
  });

  return typeDef;
};
