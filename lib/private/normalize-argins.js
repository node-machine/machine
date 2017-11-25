/**
 * Module dependencies
 */

var util = require('util');
var _ = require('@sailshq/lodash');
var anchor = require('anchor');
var ANCHOR_RULES = require('anchor/accessible/rules');
var flaverr = require('flaverr');
var rttc = require('rttc');

var getIsProductionWithoutDebug = require('./get-is-production-without-debug');
var GENERIC_HELP_SUFFIX = require('./GENERIC_HELP_SUFFIX.string');

var getMethodName = require('../get-method-name');


/**
 * normalizeArgins()
 *
 * If argin validation is enabled, validate a dictionary of argins, potentially coercing them a bit.
 *
 * > Note that this modifies properties in-place, as a direct reference!
 *
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * @param  {Dictionary} argins              [argins from userland]
 * @param  {String} arginValidationTactic   [build-time usage option (see help-build-machine for more info)]
 * @param  {String} extraArginsTactic       [build-time usage option (see help-build-machine for more info)]
 * @param  {Dictionary?} defaultArgins      [a dictionary of defaults to automatically include as they were passed in as argins, but every time the machine function is executed.  These take precedent over `defaultsTo`.  If any of them don't apply to this machine (i.e. no matching input), they will be ignored..]
 * @param  {Dictionary} nmDef               [machine definition from implementor-land]
 * @param  {Error?} omenForWarnings         [optional omen-- if provided, logged warning messages will include a shortened stack trace from it]
 *
 * @returns {Array}     [argin problems]
 *         @of {String}
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 */

module.exports = function normalizeArgins(argins, arginValidationTactic, extraArginsTactic, defaultArgins, nmDef, omenForWarnings){

  // Assert valid usage of this utility.
  // > (in production, we skip this stuff to save cycles.  We can get away w/ that
  // > because we only include this here to provide better error msgs in development
  // > anyway)
  if (!getIsProductionWithoutDebug()) {
    if (!_.isObject(argins) || _.isArray(argins) || _.isFunction(argins)) {
      throw new Error('Consistency violation: `argins` must be a dictionary.  But instead got: '+util.inspect(argins, {depth: 5}));
    }
    if (!_.isString(arginValidationTactic) || !_.isString(extraArginsTactic)) {
      throw new Error('Consistency violation: `arginValidationTactic` and `extraArginsTactic` should have both been specified as strings!  But instead, for `arginValidationTactic`, got: '+util.inspect(arginValidationTactic, {depth: 5})+' ...and for `extraArginsTactic`, got: '+util.inspect(extraArginsTactic, {depth: 5}));
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
      // 'Unrecognized argin'+(unrecognizedInputCodeNames.length===1?'':'s')+' were passed in.\n'+
      unrecognizedInputCodeNames.length+' of the provided values ('+unrecognizedInputCodeNames.join(', ')+') '+
      (unrecognizedInputCodeNames.length === 1?'does':'do')+' not correspond with any recognized input.\n'+
      'Please try again without the extra value'+(unrecognizedInputCodeNames.length===1?'':'s')+', or '+
      'check your usage and adjust accordingly.\n'+
      GENERIC_HELP_SUFFIX;

      var potentialWarningSuffix = '';
      if (omenForWarnings && _.contains(['warnAndOmit', 'warn'], extraArginsTactic)) {
        potentialWarningSuffix = '\n'+
        flaverr.getBareTrace(omenForWarnings, 3);
      }

      if (extraArginsTactic === 'warnAndOmit') {
        _.each(unrecognizedInputCodeNames, function(extraArginName){
          delete argins[extraArginName];
        });//∞
        console.warn(
          '- - - - - - - - - - - - - - - - - - - - - - - -\n'+
          'WARNING: Automatically trimmed extraneous values!\n'+
          'In call to '+getMethodName(nmDef.identity)+'(), '+extraArginsErrorMsg+
          potentialWarningSuffix+'\n'+
          '- - - - - - - - - - - - - - - - - - - - - - - -'
        );
      }
      else if (extraArginsTactic === 'warn') {
        console.warn(
          '- - - - - - - - - - - - - - - - - - - - - - - -\n'+
          'WARNING: In call to '+getMethodName(nmDef.identity)+'(), '+extraArginsErrorMsg+
          potentialWarningSuffix+'\n'+
          '- - - - - - - - - - - - - - - - - - - - - - - -'
        );
      }
      else if (extraArginsTactic === 'error') {
        arginProblems.push(extraArginsErrorMsg);
      }//ﬁ

    }//ﬁ

  }//ﬁ


  //  ┌─┐┌─┐┌─┐┬ ┬ ┬  ┌─┐┌┐┌┬ ┬  ┬─┐┌─┐┬  ┌─┐┬  ┬┌─┐┌┐┌┌┬┐  ╔╦╗╔═╗╔═╗╔═╗╦ ╦╦ ╔╦╗  ╔═╗╦═╗╔═╗╦╔╗╔╔═╗
  //  ├─┤├─┘├─┘│ └┬┘  ├─┤│││└┬┘  ├┬┘├┤ │  ├┤ └┐┌┘├─┤│││ │    ║║║╣ ╠╣ ╠═╣║ ║║  ║   ╠═╣╠╦╝║ ╦║║║║╚═╗
  //  ┴ ┴┴  ┴  ┴─┘┴   ┴ ┴┘└┘ ┴   ┴└─└─┘┴─┘└─┘ └┘ ┴ ┴┘└┘ ┴   ═╩╝╚═╝╚  ╩ ╩╚═╝╩═╝╩   ╩ ╩╩╚═╚═╝╩╝╚╝╚═╝
  if (defaultArgins) {
    _.each(defaultArgins, function(defaultArgin, inputCodeName) {
      var inputDef = nmDef.inputs[inputCodeName];

      // Ignore/skip any default argins that were actually configured.
      if (argins[inputCodeName] !== undefined) { return; }
      // Ignore/skip any default argins that don't apply to the declared interface of this
      // machine (i.e. if there is no matching input).
      else if (!inputDef){ return; }
      // But otherwise, treat this default argin just like it was passed in by hand.
      else {
        // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
        // Note that, in most cases, this is passed in as a direct reference.
        // But sometimes, we deep-clone it.  (For more context, see the very similar handling of input defs'
        // `defaultsTo` declarations further down in this file.)
        // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
        var isDefaultArginDeepMutableAtRuntime = defaultArgin && typeof defaultArgin === 'object';
        if (arginValidationTactic === 'coerceAndCloneOrError' && isDefaultArginDeepMutableAtRuntime && !inputDef.readOnly) {
          argins[inputCodeName] = _.cloneDeep(defaultArgin);
        }
        else {
          argins[inputCodeName] = defaultArgin;
        }
      }
    });//∞
  }//ﬁ


  _.each(nmDef.inputs, function (inputDef, inputCodeName){

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // FUTURE: Check for extraneous properties (nested AND top-level)
    // -how to handle this might fall into a slightly different category
    // than the `arginValidationTactic`-- or it might not.  Not sure yet
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


    //  ┌─┐┬ ┬┌─┐┬─┐┌─┐┌┐┌┌┬┐┌─┐┌─┐  ╔╦╗╦ ╦╔═╗╔═╗  ╔═╗╔═╗╔═╗╔═╗╔╦╗╦ ╦
    //  │ ┬│ │├─┤├┬┘├─┤│││ │ ├┤ ├┤    ║ ╚╦╝╠═╝║╣   ╚═╗╠═╣╠╣ ║╣  ║ ╚╦╝
    //  └─┘└─┘┴ ┴┴└─┴ ┴┘└┘ ┴ └─┘└─┘   ╩  ╩ ╩  ╚═╝  ╚═╝╩ ╩╚  ╚═╝ ╩  ╩
    // Perform type safety checks, if configured to do so.
    if (arginValidationTactic !== 'doNotCheck') {


      if (argins[inputCodeName] === undefined && !inputDef.required) {
        // NOTE:
        // This check in the machine runner is the only way to allow undefined values
        // when there is an explicit type; even when that type is `ref`.
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
      }
      else if (argins[inputCodeName] === undefined && inputDef.required) {
        arginProblems.push('"' + inputCodeName + '" is required, but it was not defined.');
      }
      else if (argins[inputCodeName] === '' && inputDef.required) {
        arginProblems.push('Invalid "' + inputCodeName + '"'+':  Cannot use \'\' (empty string) for a required input.');
      }
      else if (_.isNull(argins[inputCodeName]) && inputDef.allowNull === true) {
        // If a null value is provided and `allowNull` is `true`, there's no need to
        // validate it further.  We're all good!
      }
      else if (_.isNull(argins[inputCodeName]) && inputDef.required) {
        arginProblems.push('Invalid "' + inputCodeName + '"'+':  Cannot use `null` for this required input.');
      }
      else if (_.isNull(argins[inputCodeName]) && !inputDef.allowNull && !inputDef.required && inputDef.type !== 'json' && inputDef.type !== 'ref') {
        // If `null` is provided for an incompatible optional input, handle with a specific error message.
        arginProblems.push(
          'Invalid "' + inputCodeName + '"'+':  Cannot use `null`.  '+
          'Even though this input is optional, it still does not allow `null` to '+
          'be explicitly passed in, because `null` is not a valid '+rttc.getDisplayTypeLabel(rttc.getRdt(inputDef.type), {capitalization: 'fragment'})+'.  '+
          'Instead, to leave out this value, please omit it altogether or use `undefined`.  '+
          '(See this input definition for more detailed usage information.  If you are the maintainer '+
          'of this function, you specifically want to allow setting `null`, and you are sure your '+
          'implementation already knows how to handle it, then change this input\'s definition to have '+
          '`allowNull: true`.)'
        );
      }
      else if (inputDef.isExemplar === true) {
        // If `isExemplar` property is set, then we'll interpret the actual runtime value literally
        // as an RTTC exemplar schema.  In this case, we assume the machine's implementation presumably
        // uses this dynamic exemplar schema for some purpose.  So we just ensure that it is valid.
        // (For example, a "Parse JSON" machine that uses the provided exemplar in order to ensure
        // the expected format of the output sent back through its success exit.)
        try {
          rttc.validateExemplarStrict(argins[inputCodeName], true);
        } catch (err) {
          switch (err.code) {
            case 'E_INVALID_EXEMPLAR':
            case 'E_DEPRECATED_SYNTAX':
              arginProblems.push(
                'Invalid "' + inputCodeName + '"'+':  Expected the value to be provided as a valid "RTTC exemplar schema" '+
                '(a special "by-example" format for concisely describing a particular data type), but it could not be parsed '+
                'as such.  '+err.message
              );
              break;
            default:
              throw err;
          }
        }
      }
      else {

        // Validate the argin (potentially mildly coercing it as well) and keep track
        // of any errors we detect.
        var potentiallyCoercedArgin;
        try {
          if (arginValidationTactic === 'coerceAndCloneOrError') {
            potentiallyCoercedArgin = rttc.validate(inputDef.type, argins[inputCodeName]);
          }
          else if (arginValidationTactic === 'error') {
            rttc.validateStrict(inputDef.type, argins[inputCodeName]);
          }
        } catch (err) {
          switch (err.code) {
            case 'E_INVALID':
              arginProblems.push(rttc.getInvalidityMessage(inputDef.type, argins[inputCodeName], err, '"'+inputCodeName+'"'));
              break;
            default:
              throw err;
          }
        }


        // Re-attach the coerced/cloned version of the argin, if relevant.
        //
        // Only re-attach if either:
        // 1. A clone is necessary for safety since this argin is deep mutable at runtime,
        //    and the input does not declare itself `readOnly: true`.  (i.e. this is to
        //    protect implementor-land code in the `fn` from accidentally smashing stuff
        //    in here).
        // 2. Or if coercion might have occured
        //
        // (And NEVER re-attach if argin coercion is not enabled.)
        if (arginValidationTactic === 'coerceAndCloneOrError') {
          var isArginDeepMutableAtRuntime = argins[inputCodeName] && typeof argins[inputCodeName] === 'object';
          var wasArginChanged = (potentiallyCoercedArgin !== argins[inputCodeName]);
          if (wasArginChanged || (isArginDeepMutableAtRuntime && !inputDef.readOnly)) {
            argins[inputCodeName] = potentiallyCoercedArgin;
          }
        }//ﬁ

      }//ﬁ

    }//ﬁ







    //  ┌─┐┌─┐┌─┐┬ ┬ ┬  ╔╦╗╔═╗╔═╗╔═╗╦ ╦╦ ╔╦╗╔═╗  ╔╦╗╔═╗
    //  ├─┤├─┘├─┘│ └┬┘   ║║║╣ ╠╣ ╠═╣║ ║║  ║ ╚═╗   ║ ║ ║
    //  ┴ ┴┴  ┴  ┴─┘┴   ═╩╝╚═╝╚  ╩ ╩╚═╝╩═╝╩ ╚═╝   ╩ ╚═╝
    // Where relevant, use the `defaultsTo` value as the runtime value (argin) for the input.
    if (inputDef.defaultsTo !== undefined && argins[inputCodeName] === undefined) {
      // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
      // Note that, in most cases, this is passed in as a direct reference.
      //
      // But sometimes, we do deep-clone the default value first to help prevent userland bugs
      // from entanglement.  Specifically, deep-cloning only occurs if argin coercion is enabled
      // anyway, if the default value is something that JavaScript passes by reference, and if
      // the input does not claim a "read only" guarantee by flagging itself `readOnly: true`.
      //
      // For posterity, the original thoughts around this approach (which were changed somewhat):
      // https://github.com/node-machine/machine/blob/3cbdf60f7754ef47688320d370ef543eb27e36f0/lib/private/help-exec-machine-instance.js#L270-L276
      // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
      var isDefaultValDeepMutableAtRuntime = inputDef.defaultsTo && typeof inputDef.defaultsTo === 'object';
      if (arginValidationTactic === 'coerceAndCloneOrError' && isDefaultValDeepMutableAtRuntime && !inputDef.readOnly) {
        argins[inputCodeName] = _.cloneDeep(inputDef.defaultsTo);
      }
      else {
        argins[inputCodeName] = inputDef.defaultsTo;
      }
    }//ﬁ




    //  ┌─┐┬ ┬┌─┐┌─┐┬┌─  ┌─┐┌─┐┬─┐  ╦═╗╦ ╦╦  ╔═╗  ╦  ╦╦╔═╗╦  ╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
    //  │  ├─┤├┤ │  ├┴┐  ├┤ │ │├┬┘  ╠╦╝║ ║║  ║╣   ╚╗╔╝║║ ║║  ╠═╣ ║ ║║ ║║║║╚═╗
    //  └─┘┴ ┴└─┘└─┘┴ ┴  └  └─┘┴└─  ╩╚═╚═╝╩═╝╚═╝   ╚╝ ╩╚═╝╩═╝╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝
    // If appropriate, strictly enforce our (potentially-mildly-coerced) argin
    // vs. the validation ruleset defined on the corresponding input def.
    // Then, if there are any rule violations, track them as a "problem".
    //
    // > • High-level validation rules are ALWAYS skipped for `null`.
    // > • If there is no `validations` input key, then there's nothing for us to do here.
    if (arginValidationTactic !== 'doNotCheck' && !_.isNull(argins[inputCodeName]) && argins[inputCodeName] !== undefined) {

      var ruleset = _.pick(inputDef, Object.keys(ANCHOR_RULES));

      var ruleViolations;
      try {
        ruleViolations = anchor(argins[inputCodeName], ruleset);
        // e.g.
        // [ { rule: 'isEmail', message: 'Value was not a valid email address.' }, ... ]
      } catch (err) {
        throw flaverr({
          message: 'Consistency violation: Unexpected error occurred when attempting to apply '+
          'high-level validation rules for the provided "'+inputCodeName+'".  '+err.message
        }, err);
      }

      if (ruleViolations.length > 0) {

        // Format and push on a rolled-up summary.
        // e.g.
        // ```
        //  • Value was not in the configured whitelist (delinquent, new, paid)
        //  • Value was an empty string.
        // ```
        arginProblems.push(
          'Invalid "' + inputCodeName + '":\n  · ' + _.pluck(ruleViolations, 'message').join('\n  · ')
        );

      }//ﬁ

    }//ﬁ



  });//∞   </_.each() :: input definition>


  return arginProblems;

};
