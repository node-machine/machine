/**
 * Module dependencies
 */

var util = require('util');
var _ = require('@sailshq/lodash');
var rttc = require('rttc');
var ANCHOR_RULES = require('anchor/accessible/rules');

var getIsProduction = require('./get-is-production');
var getMethodName = require('../get-method-name');



/**
 * normalizeMachineDef()
 *
 * Verify/normalize a (dry) node-machine definition, potentially coercing it a bit.
 *
 * > Note that this modifies properties in-place, as a direct reference!
 * > (This is for performance reasons, but it comes at a price.  For an example
 * > of what that means, and to get an idea of what to be aware of when building
 * > higher-level tools/modules on top of this runner, see node-machine/machine/issues/42)
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * @param  {Ref} nmDef      [machine definition from implementor-land, MUTATED IN-PLACE!!!]
 *
 * @returns {Array}     [implementation problems]
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * > This private utility is based on the original implementation from machine@14.x and earlier:
 * > • https://github.com/node-machine/machine/blob/3cbdf60f7754ef47688320d370ef543eb27e36f0/lib/Machine.build.js
 * > • https://github.com/node-machine/machine/blob/3cbdf60f7754ef47688320d370ef543eb27e36f0/lib/private/verify-exit-definition.js
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
  var originalIdentity = nmDef.identity;
  if (nmDef.identity === undefined) {
    if (nmDef.friendlyName || nmDef.description) {
      nmDef.identity = (nmDef.friendlyName && _.kebabCase(nmDef.friendlyName)) || (nmDef.description && _.kebabCase(nmDef.description)).replace(/[^a-zA-Z0-9]/g, '') || undefined;
    }
    else {
      implProblems.push('Missing `identity`, and could not infer one.  (No `friendlyName` or `description` either.)');
      // > (Note that in many cases, it is conventional to use a tool like `.pack()` to infer the `identity` from the filename.
      // > In those cases, the inferred-from-filename identity takes precedence, but it is still a good idea to make sure the
      // > `friendlyName` you choose is consistent.)
    }
  } else if (!_.isString(nmDef.identity) || nmDef.identity === '') {
    implProblems.push('Invalid `identity` property.  (Please use a valid, non-empty string.)');
    // Wipe the `identity` to avoid breaking the very error message we'll use to display
    // this implementation problem in userland.
    delete nmDef.identity;
  }

  // Make sure the `identity` (whether it was explicilty specified or derived)
  // won't conflict with anything important.
  if (nmDef.identity !== undefined) {
    try {
      getMethodName(nmDef.identity);
    } catch (err) {
      switch (err.code) {
        case 'E_RESERVED':
          implProblems.push(
          'Cannot use '+(originalIdentity?'specified':'derived')+' `identity` '+
          '("'+nmDef.identity+'").  '+err.message);
        default: throw err;
      }
    }
  }//ﬁ


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
  // > Note that we don't explicitly check `protect`, `contract`, `readOnly`, or other metadata
  // > like `description`, `moreInfoUrl`, etc.

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

    // Check basic structure.
    if (!_.isObject(inputDef) || _.isArray(inputDef) || _.isFunction(inputDef)) {
      implProblems.push(inputProblemPrefix+'Must be a dictionary-- i.e. plain JavaScript object.');
      // Pretend this input def was an empty dictionary and keep going so that the "implProblems"
      // returned end up being more useful overall:
      inputDef = {};
    }

    // Check `type` & `example`
    // > • If a `type` is given, we verify that it's a valid type.
    // > • If an `example` is given with NO `type`, we verify that
    // >   it is a formal RTTC exemplar.
    // > • And if both are provided, then verfy that the `example`
    // >   is at least a valid hypothetical argin for the given type.
    if (inputDef.type !== undefined) {

      if (inputDef.type === 'dictionary' || inputDef.type === 'object' || inputDef.type === '{}'){
        implProblems.push(inputProblemPrefix+'Instead of specifying `type: '+util.inspect(inputDef.type,{depth:5})+'`, '+
        'please use `type: {}`.  (Or, if this data structure might sometimes contain functions or '+
        'other nested data that isn\'t JSON-compatible, then use `type: \'ref\'` instead.)');
      }
      else if (inputDef.type === 'array' || inputDef.type === '[]' || _.isEqual(inputDef.type, [])){
        implProblems.push(inputProblemPrefix+'Instead of specifying `type: '+util.inspect(inputDef.type,{depth:5})+'`, '+
        'please use `type: [\'ref\']`.  Or you might opt to use something more specific-- for example, '+
        '`type: [\'number\']` indicates an array of numbers.');
      }
      else if (inputDef.type === 'function' || inputDef.type === 'lamda' || inputDef.type === 'lambda' || inputDef.type === '->' || inputDef.type === '=>' || _.isFunction(inputDef.type)){
        implProblems.push(inputProblemPrefix+'Instead of specifying `type: '+util.inspect(inputDef.type,{depth:5})+'`, '+
        'please use `type: \'ref\'` and provide clarification in this input\'s `description`.');
      }
      else {

        try {
          rttc.validateStrict(inputDef.type, undefined);
        } catch (err) {
          switch (err.code) {
            case 'E_INVALID':
              // `undefined` is always invalid in RTTC vs. any type, so we can expect this outcome.
              // (We just used it as a pretend value anyway, as a hack to be able to reuse the code
              // in rttc.validateStrict().)
              break;
            case 'E_UNKNOWN_TYPE':
              implProblems.push(inputProblemPrefix+'Unrecognized `type`.  (Must be \'string\', \'number\', \'boolean\', \'json\' or \'ref\'.  Or set it to a type schema like `[{id:\'number\', name: {givenName: \'Lisa\'}}]`.)');
              break;
            default:
              throw err;
          }
        }
      }


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
      }//ﬁ

    } else if (inputDef.example !== undefined){

      // In the absense of `type`, `example` becomes more formal.
      // (It must be an RTTC exemplar which we'll then use to derive a `type`.)
      try {
        rttc.validateExemplarStrict(inputDef.example, true);
      } catch (err) {
        switch (err.code) {
          case 'E_DEPRECATED_SYNTAX':
          case 'E_INVALID_EXEMPLAR':
            implProblems.push(inputProblemPrefix+'The specified `example` cannot be unambiguously '+
            'interpreted as a particular data type.  Please either change this input\'s `example` '+
            'or provide an additional `type` to clear up the ambiguity.');
            break;
          default: throw err;
        }
      }

      inputDef.type = rttc.infer(inputDef.example);

    } else if (inputDef.isExemplar === true) {
      // If this input definition declares itself `isExemplar`, but doesn't specify a `type`
      // or `example` as a sort of "meta-schema", then use either "json" or "ref" as the `type`.
      // Either one works, but since "ref" is preferable for performance, we use it if we can.
      // > The only reason we don't use it ALL the time is because it allows a direct reference
      // > to the runtime data to be passed into this machine's `fn`.  So we can only make this
      // > optimization if we're sure that the machine won't mutate the runtime argin provided for
      // > this input.  But if this input definition has `readOnly: true`, then that means we DO
      // > have that guarantee, and so we can safely perform this optimization.
      inputDef.type = (inputDef.readOnly) ? 'ref' : 'json';
    } else {
      implProblems.push(inputProblemPrefix+'Must have `type`, or at least an `example`.');
    }

    // Check `isExemplar`.
    if (inputDef.isExemplar !== undefined){
      if (!_.isBoolean(inputDef.isExemplar)){
        implProblems.push(inputProblemPrefix+'Invalid `isExemplar` property.  (If specified, must be boolean: `true` or `false`.)');
      }
    }

    // Check `required`.
    if (inputDef.required !== undefined){
      if (!_.isBoolean(inputDef.required)){
        implProblems.push(inputProblemPrefix+'Invalid `required` property.  (If specified, must be boolean: `true` or `false`.)');
      }
    }

    // Check `allowNull`.
    if (inputDef.allowNull !== undefined){
      if (!_.isBoolean(inputDef.allowNull)){
        implProblems.push(inputProblemPrefix+'Invalid `allowNull` property.  (If specified, must be boolean: `true` or `false`.)');
      }
      else if (inputDef.required === true) {
        implProblems.push(inputProblemPrefix+'Defined with both `allowNull: true` and `required: true`... but that wouldn\'t make any sense.  (These settings are mutually exclusive.)');
      }
      else if (inputDef.allowNull === true) {
        implProblems.push(inputProblemPrefix+'Defined with both `allowNull: true` and `isExemplar: true`... but that wouldn\'t make any sense.  (These settings are mutually exclusive.)');
      }

      if (inputDef.type === 'json' || inputDef.type === 'ref') {
        implProblems.push(
        inputProblemPrefix+
        'Defined with `allowNull: true`, which is unnecessary in conjunction with this input\'s '+
        'declared `type`, "'+inputDef.type+'".  (With this type restriction, `null` would always '+
        'be valid anyway.)');
      }
    }

    // Check `defaultsTo`.
    if (inputDef.defaultsTo !== undefined){
      if (inputDef.required === true) {
        implProblems.push('The `defaultsTo` property cannot be used in conjunction with `required: true`.  (Only optional inputs may have a default value.)');
      } else {
        try {
          rttc.validateStrict(inputDef.type, inputDef.defaultsTo);
        } catch (err) {
          switch (err.code) {
            case 'E_INVALID':
              implProblems.push(
              inputProblemPrefix+'Invalid `defaultsTo` property.  (Input is defined with '+
              '`type: \'' + inputDef.type + '\'`, but the specified `defaultsTo` is not valid for '+
              'that type.)');
              break;
            default:
              throw err;
          }
        }
      }
    }

    // Check anchor validation rules.
    // TODO: use `ANCHOR_RULES`


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
  // > Note that we don't explicitly check metadata like `description`, `moreInfoUrl`, etc.

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
      // Pretend this exit def was an empty dictionary and keep going so that the "implProblems"
      // returned end up being more useful overall:
      exitDef = {};
    }//•

    // Check `outputType` / `outputExample` / `like` / `itemOf` / `getExample`
    // > (Note that `like`, `itemOf`, and `getExample` resolution is still pretty generic here--
    // > when `.exec()` is called, this is taken further to use the runtime values. At this point,
    // > we're just validating that the provided stuff in the definition is meaningful and relevant.)
    // TODO
    // (https://github.com/node-machine/machine/blob/3cbdf60f7754ef47688320d370ef543eb27e36f0/lib/private/verify-exit-definition.js)


    // TODO: the rest
    // (https://github.com/node-machine/machine/blob/3cbdf60f7754ef47688320d370ef543eb27e36f0/lib/Machine.build.js)


    // EXIT DEF COMPATIBILITY CHECKS:
    // ==========================================

    // `id`
    if (exitDef.id !== undefined) {
      implProblems.push(exitProblemPrefix+'`id` is no longer supported.  (Please use the key within `exits`-- aka the "exit code name"-- instead.)');
    }

    // `typeclass`
    if (exitDef.typeclass !== undefined) {
      implProblems.push(exitProblemPrefix+'`typeclass` is no longer supported.  (Please use `outputType` instead.)');
    }

    // `type`
    if (exitDef.type !== undefined) {
      implProblems.push(exitProblemPrefix+'`type` is not supported for exits.  (For clarity, please use `outputType`.)');
    }

    // `example`
    if (exitDef.example !== undefined) {
      implProblems.push(exitProblemPrefix+'`example` is not supported for exits.  (For clarity, please use `outputExample`.)');
    }

    // `validate`/`custom`
    if (exitDef.validate !== undefined || exitDef.custom !== undefined) {
      implProblems.push(exitProblemPrefix+'Custom validation is not currently supported for exits.');
    }


  }//∞  </each exit>



  return implProblems;

};
