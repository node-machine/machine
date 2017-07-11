/**
 * Module dependencies
 */

var util = require('util');
var _ = require('@sailshq/lodash');
var flaverr = require('flaverr');
var rttc = require('rttc');


/**
 * checkAndMungeArgins()
 *
 * If argin validation is enabled, validate a dictionary of argins, potentially coercing them a bit.
 *
 * > Note that currently, this is modifying _SOME_ (but not all!) `argins` in-place, as a direct reference.
 *
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * @param  {Dictionary} argins     [argins from userland]
 * @param  {Dictionary?} metadata  [invocation metadata from userland]
 * @param  {Dictionary} nmDef      [machine definition from implementor-land]
 * @param  {Boolean} isProduction  [a flag indicating whether or not we appear to be running in production mode]
 *
 * @returns {Array}     [validation problems]
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 */

module.exports = function checkAndMungeArgins(argins, metadata, nmDef, isProduction){

  var validationProblems = [];

  _.each(nmDef.inputs, function (inputDef, inputCodeName){

    // Where relevant, use the `defaultsTo` value as the runtime value (argin) for the input.
    if (inputDef.defaultsTo !== undefined && argins[inputCodeName] === undefined) {
      argins[inputCodeName] = inputDef.defaultsTo;
      // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
      // Note that this ^^ is currently using a direct reference.
      // FUTURE: Consider deep cloning the default value first to help prevent userland bugs due to
      // entanglement.  Cloning would only occur the input's example does not contain any `===`s
      // or `->`s. (Easiest way to do that is with rttc.dehyrate().) Anyway, regardless of _how_
      // this is implemented, it would need to be configurable.
      // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    }//ﬁ


    // // If input is required, check that the configured input value
    // // is not `undefined` or, for string inputs, the empty string.
    // if (inputDef.required){
    //   if (argins[inputCodeName] === undefined){
    //     validationProblems.push(
    //       flaverr({
    //         code: 'E_INPUT_REQUIRED',
    //         input: inputCodeName,
    //         reason: '`'+inputCodeName+'` is a required input- but it was not defined.'
    //       }, new Error('`'+inputCodeName+'` is a required input- but it was not defined.'))
    //       // TODO: ^^investigate making this a simple dictionary (doesn't really need to be an Error instance,
    //       //  since it'll get wrapped up in another one anyway.  Remember: stack access is very slow.)
    //     );
    //     return;
    //   }
    //   // For inputs with string-type examples (excluding * and ===, which have special meaning), don't allow empty string as a value.
    //   if (_.isString(inputDef.example) && inputDef.example !== '*' && inputDef.example !== '===' && argins[inputCodeName] === '') {
    //     validationProblems.push(
    //       flaverr({
    //         code: 'E_INPUT_REQUIRED',
    //         input: inputCodeName,
    //         reason: '`'+inputCodeName+'` is a required string input- but an empty string was supplied.'
    //       }, new Error('`'+inputCodeName+'` is a required input- but an empty string was supplied.'))
    //       // TODO: ^^investigate making this a simple dictionary (doesn't really need to be an Error instance,
    //       //  since it'll get wrapped up in another one anyway.  Remember: stack access is very slow.)
    //     );
    //     return;
    //   }

    //   // Null is never allowed for required inputs.  Note that for inputs with literal examples and `allowNull: true`,
    //   // `required` is not an option, so a `null` value would be correctly handled as a type validation error later on.
    //   if (_.isNull(argins[inputCodeName]) && (inputDef.example === '*' || inputDef.example === '===')) {
    //     validationProblems.push(
    //       flaverr({
    //         code: 'E_INPUT_REQUIRED',
    //         input: inputCodeName,
    //         reason: '`'+inputCodeName+'` is a required input- but `null` was supplied.'
    //       }, new Error('`'+inputCodeName+'` is a required input- but `null` was supplied.'))
    //       // TODO: ^^investigate making this a simple dictionary (doesn't really need to be an Error instance,
    //       //  since it'll get wrapped up in another one anyway.  Remember: stack access is very slow.)
    //     );
    //     return;
    //   }

    // }


  });//</_.each() :: input definition>


  return validationProblems;

};
