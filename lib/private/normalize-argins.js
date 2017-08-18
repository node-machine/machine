/**
 * Module dependencies
 */

var util = require('util');
var _ = require('@sailshq/lodash');
// var flaverr = require('flaverr');
// var rttc = require('rttc');

var getIsProduction = require('./get-is-production');
var GENERIC_HELP_SUFFIX = require('./GENERIC_HELP_SUFFIX.string');


/**
 * normalizeArgins()
 *
 * If argin validation is enabled, validate a dictionary of argins, potentially coercing them a bit.
 *
 * > Note that this modifies properties in-place, as a direct reference!
 *
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * @param  {Dictionary} argins           [argins from userland]
 * @param  {String} invalidArginsTactic  [build-time usage option (see help-build-machine for more info)]
 * @param  {String} extraArginsTactic    [build-time usage option (see help-build-machine for more info)]
 * @param  {Dictionary} nmDef            [machine definition from implementor-land]
 *
 * @returns {Array}     [argin problems]
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 */

module.exports = function normalizeArgins(argins, invalidArginsTactic, extraArginsTactic, nmDef){

  // Assert valid usage of this utility.
  // > (in production, we skip this stuff to save cycles.  We can get away w/ that
  // > because we only include this here to provide better error msgs in development
  // > anyway)
  if (!getIsProduction()) {
    if (!_.isObject(argins) || _.isArray(argins) || _.isFunction(argins)) {
      throw new Error('Consistency violation: `argins` must be a dictionary.  But instead got: '+util.inspect(argins, {depth: 5}));
    }
    if (!_.isString(invalidArginsTactic) || !_.isString(extraArginsTactic)) {
      throw new Error('Consistency violation: `invalidArginsTactic` and `extraArginsTactic` should have both been specified as strings!  But instead, for `invalidArginsTactic`, got: '+util.inspect(invalidArginsTactic, {depth: 5})+' ...and for `extraArginsTactic`, got: '+util.inspect(extraArginsTactic, {depth: 5}));
    }
    if (!_.isObject(nmDef) || _.isArray(nmDef) || _.isFunction(nmDef)) {
      throw new Error('Consistency violation: `nmDef` must be a dictionary.  But instead got: '+util.inspect(nmDef, {depth: 5}));
    }
  }//ﬁ


  var arginProblems = [];


  // Strip any argins with an undefined value on the right-hand side.
  _.each(_.keys(argins), function (supposedInputCodeName) {
    if (argins[supposedInputCodeName] === undefined)  {
      delete argins[supposedInputCodeName];
    }
  });//∞


  // If any argins exist for undeclared inputs, handle them accordingly.
  if (extraArginsTactic !== 'doNotCheck') {

    var unrecognizedInputCodeNames = _.difference(_.keys(argins), _.keys(nmDef.inputs));
    if (unrecognizedInputCodeNames.length > 0) {

      var extraArginsErrorMsg =
      'Unrecognized argin(s) in call to `'+nmDef.identity+'`.\n'+
      unrecognizedInputCodeNames.length+' of the provided values ('+unrecognizedInputCodeNames.join(', ')+') '+
      (unrecognizedInputCodeNames.length === 1?'does':'do')+' not correspond with any recognized input.\n'+
      'Please try again without the offending argin(s), or check your usage and adjust accordingly.\n'+
      GENERIC_HELP_SUFFIX;

      if (extraArginsTactic === 'warn') {
        console.warn('WARNING: '+extraArginsErrorMsg);
      }
      else if (extraArginsTactic === 'error') {
        arginProblems.push({
          details: extraArginsErrorMsg
        });
      }//ﬁ

    }//ﬁ

  }//ﬁ


  _.each(nmDef.inputs, function (inputDef, inputCodeName){


    // Perform type safety checks, if configured to do so.
    if (invalidArginsTactic !== 'doNotCheck') {
      if (invalidArginsTactic === 'coerceAndCloneOrError') {
        // TODO: actually do the rttc stuff (validate)
        throw new Error('`invalidArginsTactic: "'+invalidArginsTactic+'"` is not yet supported');
      }
      else if (invalidArginsTactic === 'error') {
        // TODO: actually do the rttc stuff (validateStrict)
        throw new Error('`invalidArginsTactic: "'+invalidArginsTactic+'"` is not yet supported');
      }//ﬁ
    }//ﬁ


    // // // Handle a special case where we want a more specific error:
    // // //
    // // // > Note: This is just like normal RTTC validation ("loose" mode), with one major exception:
    // // // > We handle `null` as a special case, regardless of the type being validated against;
    // // // > whether or not this input is `required: true`.  That's because it's so easy to
    // // // > get confused about how `required` works in a given database vs. Waterline vs. JavaScript.
    // // // > (Especially when it comes to null vs. undefined vs. empty string, etc)
    // // // >
    // // // > In RTTC, `null` is only valid vs. `json` and `ref` types -- so that's still true here.
    // // // > But most schemaful databases also support a configuration where `null` is ALSO allowed
    // // // > as an implicit base value for any type of data.  This sorta serves the same purpose as
    // // // > `undefined`, or omission, in JavaScript or MongoDB.  BUT that doesn't mean we necessarily
    // // // > allow `null` -- consistency of type safety rules is too important -- it just means that
    // // // > we give it its own special error message.
    // // // >
    // // // > BUT NOTE: if `allowNull` is enabled, we DO allow null.
    // // // >
    // // // > Review the "required"-ness checks in the `normalize-new-record.js` utility for examples
    // // // > of related behavior, and see the more detailed spec for more information:
    // // // > https://docs.google.com/spreadsheets/d/1whV739iW6O9SxRZLCIe2lpvuAUqm-ie7j7tn_Pjir3s/edit#gid=1814738146
    // // var isProvidingNullForIncompatibleOptionalAttr = (
    // //   _.isNull(value) &&
    // //   inputDef.type !== 'json' &&
    // //   inputDef.type !== 'ref' &&
    // //   !inputDef.allowNull &&
    // //   !inputDef.required
    // // );
    // // if (isProvidingNullForIncompatibleOptionalAttr) {
    // //   throw flaverr({ code: 'E_TYPE', expectedType: inputDef.type }, new Error(
    // //     'Specified value (`null`) is not a valid `'+inputCodeName+'`.  '+
    // //     'Even though this input is optional, it still does not allow `null` to '+
    // //     'be explicitly set, because `null` is not valid vs. the expected '+
    // //     'type: \''+inputDef.type+'\'.  Instead, to indicate "voidness", '+
    // //     'please set the value for this input to the base value for its type, '+
    // //     (function _getBaseValuePhrase(){
    // //       switch(inputDef.type) {
    // //         case 'string': return '`\'\'` (empty string)';
    // //         case 'number': return '`0` (zero)';
    // //         default: return '`'+rttc.coerce(inputDef.type)+'`';
    // //       }
    // //     })()+'.  Or, if you specifically need to save `null`, then change this '+
    // //     'input to either `type: \'json\'` or `type: \'ref\'`.  '+
    // //     (function _getExtraPhrase(){
    // //       if (_.isUndefined(inputDef.defaultsTo)) {
    // //         return 'Also note: Since this input does not define a `defaultsTo`, '+
    // //         'the base value will be used as an implicit default if `'+inputCodeName+'` '+
    // //         'is omitted when creating a record.';
    // //       }
    // //       else { return ''; }
    // //     })()
    // //   ));
    // // }//-•


    // //  ┌─┐┬ ┬┌─┐┬─┐┌─┐┌┐┌┌┬┐┌─┐┌─┐  ╔╦╗╦ ╦╔═╗╔═╗  ╔═╗╔═╗╔═╗╔═╗╔╦╗╦ ╦
    // //  │ ┬│ │├─┤├┬┘├─┤│││ │ ├┤ ├┤    ║ ╚╦╝╠═╝║╣   ╚═╗╠═╣╠╣ ║╣  ║ ╚╦╝
    // //  └─┘└─┘┴ ┴┴└─┴ ┴┘└┘ ┴ └─┘└─┘   ╩  ╩ ╩  ╚═╝  ╚═╝╩ ╩╚  ╚═╝ ╩  ╩
    // // If the value is `null` and the input has allowNull set to true it's ok.
    // if (inputDef.allowNull && _.isNull(value)) {
    //   // Nothing else to validate here.
    // }
    // //‡
    // // Otherwise, verify that this value matches the expected type, and potentially
    // // perform loose coercion on it at the same time.  This throws an E_INVALID error
    // // if validation fails.
    // else {
    //   try {
    //     value = rttc.validate(inputDef.type, value);
    //   } catch (e) {
    //     switch (e.code) {
    //       case 'E_INVALID': throw flaverr({ code: 'E_TYPE', expectedType: inputDef.type }, new Error(
    //         'Specified value is not a valid `'+inputCodeName+'`.  '+e.message
    //       ));
    //       default: throw e;
    //     }
    //   }
    // }


    // //  ┬ ┬┌─┐┌┐┌┌┬┐┬  ┌─┐  ┌─┐┌─┐┌─┐┌─┐┬┌─┐┬    ┌─┐┌─┐┌─┐┌─┐┌─┐
    // //  ├─┤├─┤│││ │││  ├┤   └─┐├─┘├┤ │  │├─┤│    │  ├─┤└─┐├┤ └─┐
    // //  ┴ ┴┴ ┴┘└┘─┴┘┴─┘└─┘  └─┘┴  └─┘└─┘┴┴ ┴┴─┘  └─┘┴ ┴└─┘└─┘└─┘
    // //  ┌─    ┌─┐┌─┐┬─┐  ╦═╗╔═╗╔═╗ ╦ ╦╦╦═╗╔═╗╔╦╗    ─┐
    // //  │───  ├┤ │ │├┬┘  ╠╦╝║╣ ║═╬╗║ ║║╠╦╝║╣  ║║  ───│
    // //  └─    └  └─┘┴└─  ╩╚═╚═╝╚═╝╚╚═╝╩╩╚═╚═╝═╩╝    ─┘
    // if (inputDef.required) {

    //   // "" (empty string) is never allowed as a value for a required input.
    //   if (value === '') {
    //     throw flaverr('E_REQUIRED', new Error(
    //       'Cannot use "" (empty string) for a required input.'
    //     ));
    //   }//>-•


    //   // `null` is never allowed as a value for a required input.
    //   if (_.isNull(value)) {
    //     throw flaverr('E_REQUIRED', new Error(
    //       'Cannot use `null` for a required input.'
    //     ));
    //   }//-•

    // }//>-   </ if required >


    // // //  ┌─┐┬ ┬┌─┐┌─┐┬┌─  ┌─┐┌─┐┬─┐  ╦═╗╦ ╦╦  ╔═╗  ╦  ╦╦╔═╗╦  ╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
    // // //  │  ├─┤├┤ │  ├┴┐  ├┤ │ │├┬┘  ╠╦╝║ ║║  ║╣   ╚╗╔╝║║ ║║  ╠═╣ ║ ║║ ║║║║╚═╗
    // // //  └─┘┴ ┴└─┘└─┘┴ ┴  └  └─┘┴└─  ╩╚═╚═╝╩═╝╚═╝   ╚╝ ╩╚═╝╩═╝╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝
    // // // If appropriate, strictly enforce our (potentially-mildly-coerced) argin
    // // // vs. the validation ruleset defined on the corresponding input def.
    // // // Then, if there are any rule violations, stick them in an Error and throw it.
    // // //
    // // // > • High-level validation rules are ALWAYS skipped for `null`.
    // // // > • If there is no `validations` input key, then there's nothing for us to do here.
    // // var ruleset = inputDef.validations;
    // // var doCheckForRuleViolations = !_.isNull(value) && !_.isUndefined(ruleset);
    // // if (doCheckForRuleViolations) {
    // //   var isRulesetDictionary = _.isObject(ruleset) && !_.isArray(ruleset) && !_.isFunction(ruleset);
    // //   if (!isRulesetDictionary) {
    // //     throw new Error('Consistency violation: If set, an input\'s validations ruleset (`validations`) should always be a dictionary (plain JavaScript object).  But for the `'+modelIdentity+'` model\'s `'+inputCodeName+'` input, it somehow ended up as this instead: '+util.inspect(inputDef.validations,{depth:5})+'');
    // //   }

    // //   var ruleViolations;
    // //   try {
    // //     ruleViolations = anchor(value, ruleset);
    // //     // e.g.
    // //     // [ { rule: 'isEmail', message: 'Value was not a valid email address.' }, ... ]
    // //   } catch (e) {
    // //     throw new Error(
    // //       'Consistency violation: Unexpected error occurred when attempting to apply '+
    // //       'high-level validation rules from `'+modelIdentity+'` model\'s `'+inputCodeName+'` '+
    // //       'input.  '+e.stack
    // //     );
    // //   }//</ catch >

    // //   if (ruleViolations.length > 0) {

    // //     // Format rolled-up summary for use in our error message.
    // //     // e.g.
    // //     // ```
    // //     //  • Value was not in the configured whitelist (delinquent, new, paid)
    // //     //  • Value was an empty string.
    // //     // ```
    // //     var summary = _.reduce(ruleViolations, function (memo, violation){
    // //       memo += '  • '+violation.message+'\n';
    // //       return memo;
    // //     }, '');

    // //     throw flaverr({
    // //       code: 'E_VIOLATES_RULES',
    // //       ruleViolations: ruleViolations
    // //     }, new Error(
    // //       'Violated one or more validation rules:\n'+
    // //       summary
    // //     ));
    // //   }//-•

    // // }//>-•  </if (doCheckForRuleViolations) >














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
    //     arginProblems.push(
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
    //     arginProblems.push(
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
    //     arginProblems.push(
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


  return arginProblems;

};
