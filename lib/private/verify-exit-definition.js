/**
 * Module dependencies
 */

var util = require('util');
var _ = require('lodash');
var rttc = require('rttc');
var flaverr = require('./private/flaverr');


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

  var err;
  var referencedInput;


  // If `like` was provided, use the example of the specified input.
  if (!_.isUndefined(defToResolve.like)) {
    referencedInput = machineDefinition.inputs[defToResolve.like];

    // If specified input does not exist, this is an error.
    if (!referencedInput) {
      err = new Error(util.format(
      'Failed to instantiate machine ("%s") from the specified machine definition.\n'+
      '`like` should refer to a known machine input, but there is no input named `%s`.',
      machineDefinition.friendlyName,
      defToResolve.like));
      err.machine = machineDefinition.identity;
      err.code = 'UNRECOGNIZED_INPUT';
      throw new Error(err);
    }

    // Also ensure that any input referenced via `like` has an explicit example.
    // (i.e. it can't have `like` or `itemOf` itself)
    if (_.isUndefined(referencedInput.example)) {

      // However, if the referenced input definition has `isExemplar: true`, then tolerate
      // its absense of an example and assume the exemplar is either '*' or '==='. (See above
      // for more explanation on why we do this, and to find the code that actually does it.)
      if (referencedInput.isExemplar === true) { return; }

      throw (function (){
        var err = new Error(util.format(
        'Failed to instantiate machine ("%s") from the specified machine definition.\n'+
        '`like` should refer to a machine input with an explicit example (i.e. it can\'t use `like` or `itemOf` too!)  The referenced input (named `%s`) does not have an explicit example.',
        machineDefinition.friendlyName,
        defToResolve.like));
        err.machine = machineDefinition.identity;
        err.code = 'UNRECOGNIZED_INPUT';
        return err;
      })();
    }

    return;
  }//</if `like` is specified>

  // If `itemOf` was provided, return the pattern of the array example from the specified input.
  else if (!_.isUndefined(defToResolve.itemOf)) {
    referencedInput = machineDefinition.inputs[defToResolve.itemOf];

    // If specified input does not exist, this is an error.
    if (!referencedInput) {
      err = new Error(util.format(
      'Failed to instantiate machine ("%s") from the specified machine definition.\n'+
      '`itemOf` should refer to a known machine input, but there is no input named `%s`.',
      machineDefinition.friendlyName,
      defToResolve.itemOf));
      err.machine = machineDefinition.identity;
      err.code = 'UNRECOGNIZED_INPUT';
      throw new Error(err);
    }

    // Ensure that any input referenced via `itemOf` has an explicit example.
    // (i.e. it can't have `like` or `itemOf` itself)
    if (_.isUndefined(referencedInput.example)) {
      throw flaverr({
        code: 'UNRECOGNIZED_INPUT',
        machine: machineDefinition.identity
      }, new Error(
        'Failed to instantiate machine (`'+machineDefinition.identity+'`) from the specified machine definition.\n'+
        '`itemOf` should refer to a machine input with an explicit example (i.e. it can\'t use `like` or `itemOf` too!)  '+
        'The referenced input (named `'+defToResolve.itemOf+'`) does not have an explicit example.')
      );
    }

    // If specified input example is not an array, this is an error.
    if (!_.isArray(referencedInput.example)) {
      err = new Error(util.format(
      'Failed to instantiate machine ("%s") from the specified machine definition.\n'+
      '`itemOf` should refer to a machine input with a patterned array example, but the example of input `%s` is:',
      machineDefinition.friendlyName,
      defToResolve.itemOf,
      referencedInput.example ));
      err.machine = machineDefinition.identity;
      err.code = 'INPUT_NOT_ARRAY';
      throw new Error(err);
    }

    // If specified input example does not have a pattern, this is an error.
    if (referencedInput.length < 1) {
      err = new Error(util.format(
      'Failed to instantiate machine ("%s") from the specified machine definition.\n'+
      '`itemOf` should refer to a machine input with a patterned array example, but the example of input `%s` is `[]`.  To indicate an array with JSON-compatible contents, use `[\'*\']`.',
      machineDefinition.friendlyName,
      defToResolve.itemOf ));
      err.machine = machineDefinition.identity;
      err.code = 'INPUT_NOT_ARRAY';
      throw new Error(err);
    }

    return;

  }//</if `itemOf` is specified>

};

