/**
 * Module dependencies
 */

var util = require('util');
var _ = require('@sailshq/lodash');
var rttc = require('rttc');

var getIsProduction = require('./get-is-production');



/**
 * normalizeMachineDef()
 *
 * Verify/normalize a (dry) node-machine definition, potentially coercing it a bit.
 *
 * > Note that this modifies properties in-place, as a direct reference!
 *
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * @param  {Ref} nmDef      [machine definition from implementor-land, MUTATED IN-PLACE!!!]
 *
 * @returns {Array}     [implementation problems]
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 */

module.exports = function normalizeMachineDef(nmDef){

  // Assert valid usage of this utility.
  // > (in production, we skip this stuff to save cycles.  We can get away w/ that
  // > because we only include this here to provide better error msgs in development
  // > anyway)
  if (!getIsProduction()) {
    if (!_.isObject(nmDef) || _.isArray(nmDef) || _.isFunction(nmDef)) {
      throw new Error('Consistency violation: `nmDef` must be a dictionary.  But instead got: '+util.inspect(nmDef, {depth: 5}));
    }//•
  }//ﬁ


  var implProblems = [];

  // Check `identity`, attempting to infer it if it is missing.
  if (!nmDef.identity) {
    if (nmDef.friendlyName || nmDef.description) {
      nmDef.identity = (nmDef.friendlyName && _.kebabCase(nmDef.friendlyName)) || (nmDef.description && _.kebabCase(nmDef.description)).replace(/[^a-zA-Z0-9]/g, '') || undefined;
    }
    else {
      implProblems.push('Missing `identity`, and could not infer one.  (No `friendlyName` or `description` either.)');
    }
  }


  // Check `fn`.
  if (nmDef.fn===undefined) {
    implProblems.push('Missing the `fn` property.');
  }
  else if (!_.isFunction(nmDef.fn)) {
    implProblems.push('Invalid `fn` property.  (Please use a valid JavaScript function.)');
  }
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // FUTURE: Detect whether we're dealing with an arrow function.
  //
  // In the future, we may end up logging a warning about `this` probably not working
  // as expected.  (Thanks @elmigranto and @ljharb!  -- https://stackoverflow.com/a/38830947)
  // (See also https://github.com/ljharb/is-arrow-function/blob/df0c69e2188c7f2a7773116c370136d646fc193f/index.js)
  // ```
  // var isArrowFunction = (function(){
  //   var fnStr = nmDef.fn.toString();
  //   if (fnStr.length === 0) { return false; }
  //   var RX_IS_NOT_ARROW_FN = /^\s*function/;
  //   if (RX_IS_NOT_ARROW_FN.test(fnStr)) { return false; }
  //   var RX_IS_ARROW_FN_WITH_PARENTHESES = /^\([^)]*\) *=>/;
  //   if (!RX_IS_ARROW_FN_WITH_PARENTHESES.test(fnStr)) { return false; }
  //   var RX_IS_ARROW_FN_WITHOUT_PARENTHESES = /^[^=]*=>/;
  //   if (!RX_IS_ARROW_FN_WITHOUT_PARENTHESES.test(fnStr)) { return false; }
  //   return true;
  // })();//†
  //
  // if (isArrowFunction) {
  //   // …
  // }//ﬁ
  // ```
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


  // Check `sync`
  if (nmDef.sync !== undefined) {
    if (!_.isBoolean(nmDef.sync)){
      implProblems.push('Invalid `sync` property.  (If specified, must be boolean: `true` or `false`.)');
    }
  }

  // Check `timeout`
  if (nmDef.timeout !== undefined) {
    if (!_.isNumber(nmDef.timeout) || nmDef.timeout <= 0){
      implProblems.push('Invalid `timeout` property.  (If specified, must be a number greater than zero.)');
    }
  }

  // Check `sideEffects`
  if (nmDef.sideEffects !== undefined) {
    if (nmDef.sideEffects !== 'cacheable' && nmDef.sideEffects !== 'idempotent' && nmDef.sideEffects !== '') {
      implProblems.push('Invalid `sideEffects` property.  (If specified, must be \'cacheable\', \'idempotent\', or \'\'.)');
    }
  }

  // Check `implementationType`
  if (nmDef.implementationType !== undefined) {
    if (nmDef.implementationType !== 'composite' && nmDef.implementationType !== 'es8AsyncFunction' && nmDef.implementationType !== 'classicJsFunction' && nmDef.implementationType !== 'analog' && nmDef.implementationType !== '') {
      implProblems.push('Invalid `implementationType` property.  (If specified, must be \'composite\', \'es8AsyncFunction\', \'classicJsFunction\', or \'analog\'.)');
    }
  }


  // TOP-LEVEL COMPATIBILITY CHECKS:
  // ==========================================

  // `id`
  if (nmDef.id !== undefined) {
    implProblems.push('The `id` property is no longer supported.  (Please use `identity` instead.)');
  }

  // `methodName`/`variableName`
  if (nmDef.methodName !== undefined || nmDef.variableName !== undefined) {
    implProblems.push('The `methodName`/`variableName` property is no longer supported.  (Please use `identity` instead-- a method name will be derived when appropriate.)');
  }

  // `typeSafe`/`typesafe`
  if (nmDef.typeSafe !== undefined || nmDef.typesafe !== undefined) {
    implProblems.push('The `typeSafe` property is no longer supported.  (Please use new opts in `buildWithCustomUsage()` instead.)');
  }

  // `cacheable`
  if (nmDef.cacheable !== undefined) {
    implProblems.push('The `cacheable` property is no longer supported.  (Please use `sideEffects: \'cacheable\' instead.)');
  }

  // `idempotent`
  if (nmDef.idempotent !== undefined) {
    implProblems.push('The `idempotent` property is no longer supported.  (Please use `sideEffects: \'idempotent\' instead.)');
  }

  // `defaultExit`
  if (nmDef.defaultExit !== undefined) {
    implProblems.push('Support for `defaultExit` was removed in machine@7.0.0.  (Nowadays, you can simply use `success`.)');
  }

  // `catchallExit`/`catchAllExit`
  if (nmDef.catchallExit !== undefined || nmDef.catchAllExit !== undefined) {
    implProblems.push('Support for `catchallExit` was removed in machine@7.0.0.  (Nowadays, you can simply use `error`.)');
  }


  //   ██████╗██╗  ██╗███████╗ ██████╗██╗  ██╗    ██╗███╗   ██╗██████╗ ██╗   ██╗████████╗███████╗
  //  ██╔════╝██║  ██║██╔════╝██╔════╝██║ ██╔╝    ██║████╗  ██║██╔══██╗██║   ██║╚══██╔══╝██╔════╝██╗
  //  ██║     ███████║█████╗  ██║     █████╔╝     ██║██╔██╗ ██║██████╔╝██║   ██║   ██║   ███████╗╚═╝
  //  ██║     ██╔══██║██╔══╝  ██║     ██╔═██╗     ██║██║╚██╗██║██╔═══╝ ██║   ██║   ██║   ╚════██║██╗
  //  ╚██████╗██║  ██║███████╗╚██████╗██║  ██╗    ██║██║ ╚████║██║     ╚██████╔╝   ██║   ███████║╚═╝
  //   ╚═════╝╚═╝  ╚═╝╚══════╝ ╚═════╝╚═╝  ╚═╝    ╚═╝╚═╝  ╚═══╝╚═╝      ╚═════╝    ╚═╝   ╚══════╝
  //

  // Sanitize input definitions.
  if (nmDef.inputs === undefined) {
    nmDef.inputs = {};
  }
  else if (!_.isObject(nmDef.inputs) || _.isArray(nmDef.inputs) || _.isFunction(nmDef.inputs)) {
    implProblems.push('Invalid `inputs`.  (If specified, must be a dictionary-- i.e. plain JavaScript object.)');
  }

  var inputCodeNames = Object.keys(nmDef.inputs);
  for (var i=0; i<inputCodeNames; i++) {
    var inputCodeName = inputCodeNames[i];
    var inputDef = nmDef.inputs[inputCodeName];
    var inputProblemPrefix = 'Invalid input definition ("'+inputCodeName+'").  ';

    if (!_.isObject(inputDef) || _.isArray(inputDef) || _.isFunction(inputDef)) {
      implProblems.push(inputProblemPrefix+'Must be a dictionary-- i.e. plain JavaScript object.');
      continue;
    }//•

    // Check `type` & `example`.
    if (inputDef.type !== undefined) {

      // TODO: check type

      if (inputDef.example !== undefined) {
        try {
          rttc.validateStrict(inputDef.type, inputDef.example);
        } catch (err) {
          switch (err.code) {
            case 'E_INVALID':
              implProblems.push(inputProblemPrefix+'Defined with `type: \'' + inputDef.type + '\'`, '+
              'but the specified `example` is not valid for that type.  (If both `type` and `example` '+
              'are provided, they must be compatible.)');
              break;
            default:
              throw err;
          }
        }
      }
    }
    // In the absense of `type`, `example` becomes more formal.
    // (It must be an RTTC exemplar.)
    else if (inputDef.example !== undefined){
      // TODO
    }
    else {
      implProblems.push(inputProblemPrefix+'Must have `type` or `example`.');
    }

    // Check `required`.
    if (inputDef.required !== undefined){
      // TODO
    }

    // Check `defaultsTo`.
    if (inputDef.defaultsTo !== undefined){
      // TODO
    }

    // Check `allowNull`.
    if (inputDef.allowNull !== undefined){
      // TODO
      // https://github.com/node-machine/machine/blob/3cbdf60f7754ef47688320d370ef543eb27e36f0/lib/Machine.build.js
    }


    // INPUT DEF COMPATIBILITY CHECKS:
    // ==========================================

    // `id`
    if (inputDef.id !== undefined) {
      implProblems.push(inputProblemPrefix+'`id` is no longer supported.  (Please use the key within `inputs`-- aka the "input code name"-- instead.)');
    }

    // `like`/`itemOf`/`getExample`
    if (inputDef.like !== undefined || inputDef.itemOf !== undefined || inputDef.getExample !== undefined) {
      implProblems.push(inputProblemPrefix+'`like`, `itemOf`, and `getExample` are not supported for inputs (only exits).');
    }

    // `typeclass`
    if (inputDef.typeclass !== undefined) {
      implProblems.push(inputProblemPrefix+'`typeclass` is no longer supported.  (Please use `type` instead.)');
    }

    // `validate`
    if (inputDef.validate !== undefined) {
      implProblems.push(inputProblemPrefix+'`validate` is no longer supported.  (Please use `custom` instead.)');
    }

  }//∞  </each input>


  //   ██████╗██╗  ██╗███████╗ ██████╗██╗  ██╗    ███████╗██╗  ██╗██╗████████╗███████╗
  //  ██╔════╝██║  ██║██╔════╝██╔════╝██║ ██╔╝    ██╔════╝╚██╗██╔╝██║╚══██╔══╝██╔════╝██╗
  //  ██║     ███████║█████╗  ██║     █████╔╝     █████╗   ╚███╔╝ ██║   ██║   ███████╗╚═╝
  //  ██║     ██╔══██║██╔══╝  ██║     ██╔═██╗     ██╔══╝   ██╔██╗ ██║   ██║   ╚════██║██╗
  //  ╚██████╗██║  ██║███████╗╚██████╗██║  ██╗    ███████╗██╔╝ ██╗██║   ██║   ███████║╚═╝
  //   ╚═════╝╚═╝  ╚═╝╚══════╝ ╚═════╝╚═╝  ╚═╝    ╚══════╝╚═╝  ╚═╝╚═╝   ╚═╝   ╚══════╝
  //

  // Sanitize exit definitions.
  if (nmDef.exits === undefined) {
    nmDef.exits = {};
  }
  else if (!_.isObject(nmDef.exits) || _.isArray(nmDef.exits) || _.isFunction(nmDef.exits)) {
    implProblems.push('Invalid `exits`.  (If specified, must be a dictionary-- i.e. plain JavaScript object.)');
  }

  var exitCodeNames = Object.keys(nmDef.exits);
  for (var i=0; i<exitCodeNames; i++) {
    var exitCodeName = exitCodeNames[i];
    var exitDef = nmDef.exits[exitCodeName];
    var exitProblemPrefix = 'Invalid exit definition ("'+exitCodeName+'").  ';

    if (!_.isObject(exitDef) || _.isArray(exitDef) || _.isFunction(exitDef)) {
      implProblems.push(exitProblemPrefix+'Must be a dictionary-- i.e. plain JavaScript object.');
      continue;
    }//•

    // TODO: the rest
    // (https://github.com/node-machine/machine/blob/3cbdf60f7754ef47688320d370ef543eb27e36f0/lib/Machine.build.js)

  }//∞  </each exit>



  return implProblems;

};
