/**
 * Module dependencies
 */

var util = require('util');
var _ = require('@sailshq/lodash');
var flaverr = require('./flaverr');


/**
 * verifyExitDefinition()
 *
 * Verify the `like`, `itemOf`, `getExample`, or explicit output exemplar
 * in the specified exit definition.
 *
 * @param  {Dictionary} defToResolve
 * @param  {Dictionary} machineDefinition
 */
module.exports = function verifyExitDefinition(defToResolve, machineDefinition){

  // If an explicit example was provided, use that.
  if (!_.isUndefined(defToResolve.example)) {
    return;
  }

  var referencedInput;


  // If `like` was provided, use the example of the specified input.
  if (!_.isUndefined(defToResolve.like)) {
    referencedInput = machineDefinition.inputs[defToResolve.like];

    // If specified input does not exist, this is an error.
    if (!referencedInput) {
      throw flaverr({
        code: 'UNRECOGNIZED_INPUT',
        machine: machineDefinition.identity
      }, new Error('Failed to instantiate "'+machineDefinition.identity+'" from the specified definition.\n`like` should refer to a known input, but there is no input named `'+defToResolve.like+'`.'));
    }//>-•

    // Also ensure that any input referenced via `like` has an explicit example.
    // (i.e. it can't have `like` or `itemOf` itself)
    if (_.isUndefined(referencedInput.example)) {

      // However, if the referenced input definition has `isExemplar: true`, then tolerate
      // its absense of an example and assume the exemplar is either '*' or '==='. (See .build()
      // for more explanation on why we do this, and to find the code that actually does it.)
      if (referencedInput.isExemplar === true) { return; }

      throw flaverr({
        code: 'UNRECOGNIZED_INPUT',
        machine: machineDefinition.identity
      }, new Error('Failed to instantiate "'+machineDefinition.identity+'" from the specified definition.\n`like` should refer to an input with an explicit example (i.e. it can\'t use `like` or `itemOf` too!)  The referenced input (named `'+defToResolve.like+'`) does not have an explicit example.'));
    }//--•

    return;
  }//</if `like` is specified>
  // ‡
  // If `itemOf` was provided, return the pattern of the array example from the specified input.
  else if (!_.isUndefined(defToResolve.itemOf)) {
    referencedInput = machineDefinition.inputs[defToResolve.itemOf];

    // If specified input does not exist, this is an error.
    if (!referencedInput) {
      throw flaverr({
        code: 'UNRECOGNIZED_INPUT',
        machine: machineDefinition.identity
      }, new Error('Failed to instantiate "'+machineDefinition.identity+'" from the specified definition.\n`itemOf` should refer to a known input, but there is no input named `'+defToResolve.itemOf+'`'));
    }//--•

    // Ensure that any input referenced via `itemOf` has an explicit example.
    // (i.e. it can't have `like` or `itemOf` itself)
    if (_.isUndefined(referencedInput.example)) {
      throw flaverr({
        code: 'UNRECOGNIZED_INPUT',
        machine: machineDefinition.identity
      }, new Error(
        'Failed to instantiate `'+machineDefinition.identity+'` from the specified definition.\n`itemOf` should refer to an input with an explicit example (i.e. it can\'t use `like` or `itemOf` too!)  The referenced input (named `'+defToResolve.itemOf+'`) does not have an explicit example.')
      );
    }//--•

    // If specified input example is not an array, this is an error.
    if (!_.isArray(referencedInput.example)) {
      throw flaverr({
        code: 'INPUT_NOT_ARRAY',
        machine: machineDefinition.identity
      }, new Error(
        'Failed to instantiate `'+machineDefinition.identity+'` from the specified definition.\n`itemOf` should refer to an input with a patterned array example, but the example of input `'+defToResolve.itemOf+'` is: '+util.inspect(referencedInput.example, {depth: null})
      ));
    }//--•

    // If specified input example does not have a pattern, this is an error.
    if (referencedInput.length < 1) {
      throw flaverr({
        code: 'INPUT_NOT_ARRAY',
        machine: machineDefinition.identity
      }, new Error(
        'Failed to instantiate `'+machineDefinition.identity+'` from the specified definition.\n`itemOf` should refer to an input with a patterned array example, but instead, the example of input `'+defToResolve.itemOf+'` was `[]`!  To indicate an array with JSON-compatible contents, use `[\'*\']`.  Or to indicate an array of _ANYTHING_, use `[\'===\']`.'
      ));
    }//--•

    return;

  }//</if `itemOf` is specified>

};

