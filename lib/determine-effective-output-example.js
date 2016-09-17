/**
 * Module dependencies
 */

var _ = require('lodash');
var rttc = require('rttc');

/**
 * determineEffectiveOutputExample()
 *
 * Determine the appropriate output example for a given exit definition,
 *
 * @param  {Dictionary} exitDef
 * @param  {String} exitName
 * @param  {Dictionary} allConfiguredInputValues
 * @param  {Dictionary} machineDef
 *
 * @return {Exemplar?}
 *         An RTTC exemplar, or `undefined` if the exit is effectively void (i.e. has no output guarantee.)
 */
module.exports = function determineEffectiveOutputExample (exitDef, exitName, allConfiguredInputValues, machineDef) {

  // If exit definition does not exist, just return `undefined`.
  if (!exitDef) {
    return;
  }

  // Used below to hold the referenced input definition and its actual configured runtime value, respectively.
  var referencedInputDef;
  var referencedActualVal;

  // If `like` was provided, look up the value of the referenced input,
  // squeeze it until it looks like an rttc-compatible exemplar, then use
  // that as our exemplar for this definition.
  if (!_.isUndefined(exitDef.like)) {
    referencedInputDef = machineDef.inputs[exitDef.like];
    referencedActualVal = allConfiguredInputValues[exitDef.like];

    // If `isExemplar` property is set, then we'll interpret the actual runtime value literally as an RTTC exemplar.
    // Otherwise, we'll assume it is a normal everyday value and coerce it into an exemplar.
    referencedActualVal = rttc.coerceExemplar(referencedActualVal, referencedInputDef.isExemplar);

    // Take the type intersection of the runtime value and the static example
    // (we want our real, runtime exemplar that is used for output coercion to
    //  be the narrowest-possible exemplar that accepts the set of values that
    //  statisfy BOTH schemas-- i.e. the intersection.
    //  Note that, input validation/coercion has already run- so this should never fail)
    return rttc.intersection( referencedInputDef.example, referencedActualVal, true, true );
  }

  // If `itemOf` was provided, look up the value of the referenced input and use it.
  if (!_.isUndefined(exitDef.itemOf)) {
    referencedInputDef = machineDef.inputs[exitDef.itemOf];
    referencedActualVal = allConfiguredInputValues[exitDef.itemOf];

    // If `isExemplar` property is set, then we'll interpret the actual runtime value literally as an RTTC exemplar.
    // Otherwise, we'll assume it is a normal everyday value and coerce it into an exemplar.
    referencedActualVal = rttc.coerceExemplar(referencedActualVal, referencedInputDef.isExemplar);

    // If the runtime value is an empty array, or unspecified altogether, fall back
    // to using the more-generic example in the referenced input def.
    if (!_.isArray(referencedActualVal) || referencedActualVal.length < 1) {
      return referencedInputDef.example[0];
    }

    // Take the type intersection of the runtime input value's pattern, and the
    // pattern of the static input example
    // (we want our real, runtime exemplar that is used for output coercion to
    //  be the narrowest-possible exemplar that accepts the set of values that
    //  statisfy BOTH schemas-- i.e. the intersection.  This will usually work
    //  Note that, input validation/coercion has already run- so this should never fail)
    return rttc.intersection(referencedInputDef.example[0], referencedActualVal[0], true, true);
  }


  // If `getExample()` was not provided, just return the example.
  if (!exitDef.getExample){
    return exitDef.example;
  }

  // (`getExample()` is provided with a helpful execution-time `env` object)
  var env = {
    _: _,
    rttc: rttc
  };

  // Note that input values are prepared exactly the same way we prepared
  // them for `.exec()` (i.e. validating/coercing) precisely _because_ we did
  // that earlier (and set them on the machine instance as `_configuredInputs`)
  //
  // Still, to make sure the `getExample` does not mess things up, we do an extra
  // `cloneDeep`.
  var inputValsForGetExample = _.cloneDeep(allConfiguredInputValues);

  // Note that, potentially, we could exclude values/sub-values where `===` is
  // expected, to avoid any destructive changes from the getExample (e.g. starting
  // to pump on a stream, etc.)  But this could cause unexpected behavior for implementors.
  // For now, we'll pass all input values through.

  var newExample;
  try {
    newExample = exitDef.getExample.apply(env, [inputValsForGetExample, env]);
  }
  catch (e) {
    throw (function (){
      var _err = new Error('The `getExample()` function for exit `'+exitName+'` in machine `'+machineDef.identity+'` threw an error.  Details:\n', e.stack);
      _err.code = 'E_EXIT_GETEXAMPLE';
      _err.reason = _err.message;
      return _err;
    })();
  }

  // Sanitize returned example:
  //  • if returned example is an array, make sure it only has one item.
  //    This is mainly just for sanity- the real enforcement of this part is in
  //    rttc, in the way that it uses the provided `example` for coercion
  //    (that's why we don't have to worry about doing this recursively for nested
  //     arrays)
  if (_.isArray(newExample)) {
    newExample = newExample.slice(0,1);
  }
  //  • turn top-level `null` into `undefined`
  //    (nested `null`s are taken care of by dehydrate() below)
  if (_.isNull(newExample)) {
    newExample = undefined;
  }
  //  • strip out circular references, and don't allow null values/array items
  newExample = rttc.dehydrate(newExample, false);

  return newExample;
};
