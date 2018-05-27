/**
 * Module dependencies
 */

var util = require('util');
var _ = require('@sailshq/lodash');
var rttc = require('rttc');
var ANCHOR_RULES = require('anchor/accessible/rules');

var validateCodeNameStrict = require('./validate-code-name-strict');
var getIsProductionWithoutDebug = require('./get-is-production-without-debug');
var getMethodName = require('../get-method-name');

var STRIP_COMMENTS_RX = /(\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s*=[^,\)]*(('(?:\\'|[^'\r\n])*')|("(?:\\"|[^"\r\n])*"))|(\s*=[^,\)]*))/mg;


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
 * @param  {Ref} nmDef                             [machine definition from implementor-land, MUTATED IN-PLACE!!!]
 * @param  {String} implementationSniffingTactic
 *
 * @returns {Array}     [implementation problems]
 *           @of {String}
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * > This private utility is based on the original implementation from machine@14.x and earlier:
 * > • https://github.com/node-machine/machine/blob/3cbdf60f7754ef47688320d370ef543eb27e36f0/lib/Machine.build.js
 * > • https://github.com/node-machine/machine/blob/3cbdf60f7754ef47688320d370ef543eb27e36f0/lib/private/verify-exit-definition.js
 */

module.exports = function normalizeMachineDef(nmDef, implementationSniffingTactic){

  // Assert valid usage of this utility.
  // > (in production, we skip this stuff to save cycles.  We can get away w/ that
  // > because we only include this here to provide better error msgs in development
  // > anyway)
  if (!getIsProductionWithoutDebug()) {
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

  // Make sure the `identity` (whether it was derived or explicitly specified)
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
        default:
          throw err;
      }
    }
  }//ﬁ


  // Set `implementationType` to the default, if not provided.  Otherwise verify it.
  var isStringImplementation = _.isString(nmDef.implementationType) && nmDef.implementationType.match(/^string\:.+$/);
  if (nmDef.implementationType === undefined) {
    if (!_.isFunction(nmDef.fn)) {
      nmDef.implementationType = 'abstract';
    } else if (implementationSniffingTactic === 'analog') {
      nmDef.implementationType = 'analog';
    } else {
      var lastishParamIsExits = (function(){
        var fnStr = nmDef.fn.toString().replace(STRIP_COMMENTS_RX, '');
        var parametersAsString = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')'));
        return !! (
          parametersAsString.match(/,\s*exits\s*$/) ||
          parametersAsString.match(/,\s*exits\s*,\s*(env|meta)\s*$/)
        );
      })();//†
      if (lastishParamIsExits) {
        nmDef.implementationType = 'analog';
      } else {
        nmDef.implementationType = 'classical';
      }
    }
  } else {

    var ITPM_PREFIX = 'Invalid `implementationType` property.  ';

    var CONCRETE_IMPLEMENTATION_TYPES = [
      'abstract',
      'composite',
      'classical',
      'analog'
    ];

    // Check for misspellings / mixups:
    if (_.contains(['analogue', 'fn'], nmDef.implementationType)) {
      implProblems.push(ITPM_PREFIX+'  (Did you mean \'analog\'?)');
    } else if (_.contains(['circuit'], nmDef.implementationType)) {
      implProblems.push(ITPM_PREFIX+'  (Did you mean \'composite\'?)');
    } else if (_.contains(['abstact', 'interface'], nmDef.implementationType)) {
      implProblems.push(ITPM_PREFIX+'  (Did you mean \'abstract\'?)');
    } else if (_.contains(['classic', 'es8AsyncFunction', 'classicJsFunction'], nmDef.implementationType)) {
      implProblems.push(ITPM_PREFIX+'  (Did you mean \'classical\'?)');
    } else {
      // Ensure implementationType is recognized.
      if (!isStringImplementation && !_.contains(CONCRETE_IMPLEMENTATION_TYPES, nmDef.implementationType)) {
        implProblems.push(ITPM_PREFIX+'  (If specified, must either be a known, concrete implementation type like '+CONCRETE_IMPLEMENTATION_TYPES.join('/')+', or a code string+language declaration like \'string:js\' or \'string:c\'.)');
      }
    }
  }


  // Check `fn`.
  if (nmDef.implementationType === 'abstract' && nmDef.fn !== undefined) {
    implProblems.push('Should not declare a `fn` since implementation is \'abstract\'.');
  } else if (isStringImplementation && !_.isString(nmDef.fn)) {
    implProblems.push('Invalid `fn` property.  (Should be a string, since implementation is declared as a code string.)');
  } else if (nmDef.fn === undefined) {
    implProblems.push('Missing the `fn` property.');
  } else if (!_.isFunction(nmDef.fn) && (nmDef.implementationType === 'classical' || nmDef.implementationType === 'analog')) {
    implProblems.push('Invalid `fn` property.  (Please use a valid JavaScript function.)');
  }//ﬁ

  if (_.isFunction(nmDef.fn)) {
    if (nmDef.fn.constructor.name === 'AsyncFunction') {
      if (nmDef.sync === true) {
        implProblems.push('Invalid `fn` property.  (Cannot use `async function` since implementation is declared `sync: true`.)');
      }//ﬁ
      nmDef._fnIsAsyncFunction = true;
    }
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

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // FUTURE: Recognize and check `humanLanguage`, making sure it's a iso-639-2 language code
  // (e.g. `humanLanguage: 'eng'`).  This prop declares what human language documentation metadata
  // is written in.
  //
  // Reference of iso-639-2 codes:
  //   https://www.loc.gov/standards/iso639-2/php/code_list.php
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


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

  // Track inputs with indeterminate data types (to avoid inadvertently causing bad errors from
  // subsequent checks-- e.g. for the `like`/`itemOf` check that exits go through)
  var inputsWithIndeterminateTypes = [];

  // Sanitize input definitions.
  if (nmDef.inputs === undefined) {
    nmDef.inputs = {};
  }
  else if (!_.isObject(nmDef.inputs) || _.isArray(nmDef.inputs) || _.isFunction(nmDef.inputs)) {
    implProblems.push('Invalid `inputs`.  (If specified, must be a dictionary-- i.e. plain JavaScript object like `{}`.)');
  }

  var inputCodeNames = Object.keys(nmDef.inputs);
  _.each(inputCodeNames, function(inputCodeName){
    var inputDef = nmDef.inputs[inputCodeName];
    var inputProblemPrefix = 'Invalid input definition ("'+inputCodeName+'").  ';

    // Make sure this code name won't conflict with anything important.
    var reasonCodeNameIsInvalid = validateCodeNameStrict(inputCodeName);
    if (reasonCodeNameIsInvalid) {
      implProblems.push('Invalid input name ("'+inputCodeName+'").  Please use something else instead, because this '+reasonCodeNameIsInvalid+'.');
    }//ﬁ

    // Check basic structure.
    if (!_.isObject(inputDef) || _.isArray(inputDef) || _.isFunction(inputDef)) {
      implProblems.push(inputProblemPrefix+'Must be a dictionary-- i.e. plain JavaScript object like `{}`.');
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
    var wasAbleToDeriveValidTypeSchema;
    if (inputDef.type !== undefined) {
      //  ┬ ┬┌─┐┌─┐  ┌─┐─┐ ┬┌─┐┬  ┬┌─┐┬┌┬┐  ╔╦╗╦ ╦╔═╗╔═╗
      //  ├─┤├─┤└─┐  ├┤ ┌┴┬┘├─┘│  ││  │ │    ║ ╚╦╝╠═╝║╣
      //  ┴ ┴┴ ┴└─┘  └─┘┴ └─┴  ┴─┘┴└─┘┴ ┴    ╩  ╩ ╩  ╚═╝

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
          throw new Error('Consistency violation: Should never make it here.  If you\'re seeing this message, you\'ve probably found a bug.  Please let us know at https://sailsjs.com/bugs');
        } catch (err) {
          switch (err.code) {
            case 'E_INVALID':
              // `undefined` (which we passed in as the 2nd argument above) is always invalid
              // in RTTC vs. any type, so we can expect this outcome.
              // (We just used it as a pretend value anyway, as a hack to be able to reuse the code
              // in rttc.validateStrict().)
              wasAbleToDeriveValidTypeSchema = true;
              break;
            case 'E_UNKNOWN_TYPE':
              implProblems.push(inputProblemPrefix+'Unrecognized `type`.  (Must be \'string\', \'number\', \'boolean\', \'json\' or \'ref\'.  Or set it to a type schema like `[{id:\'number\', name: {givenName: \'Lisa\'}}]`.)');
              break;
            default:
              throw err;
          }
        }
      }

      if (wasAbleToDeriveValidTypeSchema && inputDef.example !== undefined) {
        // Since a `type` is also specified, just make sure `example` is a valid instance of that provided type schema.
        try {
          // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
          // FUTURE: If the example _could_ be interpreted as a valid RTTC exemplar schema, then make sure it intersects
          // vs. the declared type schema.  (Otherwise this can be kinda confusing.)  For instance, it would be weird
          // to have `type: 'json', example: '==='`.  Technically, the string '===' is a valid JSON-compatible value,
          // but since it has special meaning, it's kinda weird to allow stuff to be specified this way.  (In fact, it
          // might be just as valid of an idea to prevent special string notation (*/===/->) altogether when a `type`
          // is specified-- this needs more thought.)
          // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
          rttc.validateStrict(inputDef.type, inputDef.example);
        } catch (err) {
          switch (err.code) {
            case 'E_INVALID':
              implProblems.push(inputProblemPrefix+'Defined with `type: \'' + inputDef.type + '\'`, '+
              'but the specified `example` is not strictly valid for that type.  (Since both `type` and `example` '+
              'are provided, they must be compatible.)');
              break;
            default:
              throw err;
          }
        }
      }//ﬁ

    } else if (inputDef.example !== undefined){
      //  ┌┐┌┌─┐  ┌┬┐┬ ┬┌─┐┌─┐    ╦╦ ╦╔═╗╔╦╗  ╔═╗═╗ ╦╔═╗╔╦╗╔═╗╦  ╔═╗
      //  ││││ │   │ └┬┘├─┘├┤     ║║ ║╚═╗ ║   ║╣ ╔╩╦╝╠═╣║║║╠═╝║  ║╣
      //  ┘└┘└─┘   ┴  ┴ ┴  └─┘┘  ╚╝╚═╝╚═╝ ╩   ╚═╝╩ ╚═╩ ╩╩ ╩╩  ╩═╝╚═╝

      // In the absense of `type`, `example` becomes more formal.
      // (It must be an RTTC exemplar which we'll then use to derive a `type`.)
      var isValidExemplar;
      try {
        rttc.validateExemplarStrict(inputDef.example, true);
        isValidExemplar = true;
      } catch (err) {
        switch (err.code) {
          case 'E_DEPRECATED_SYNTAX':
          case 'E_INVALID_EXEMPLAR':
            implProblems.push(inputProblemPrefix+'The specified `example` cannot be unambiguously '+
            'interpreted as a particular data type.  Please either change this input\'s `example` '+
            'or provide an additional `type` to clear up the ambiguity.');
            break;
          default:
            throw err;
        }
      }

      if (isValidExemplar){
        inputDef.type = rttc.infer(inputDef.example);
        wasAbleToDeriveValidTypeSchema = true;
      }

    } else if (inputDef.isExemplar === true) {
      //  ┬┌┐┌┌─┐┬ ┬┌┬┐  ┬┌┬┐┌─┐┌─┐┬  ┌─┐  ╦╔═╗  ╔═╗═╗ ╦╔═╗╔╦╗╔═╗╦  ╔═╗╦═╗
      //  ││││├─┘│ │ │   │ │ └─┐├┤ │  ├┤   ║╚═╗  ║╣ ╔╩╦╝║╣ ║║║╠═╝║  ╠═╣╠╦╝
      //  ┴┘└┘┴  └─┘ ┴   ┴ ┴ └─┘└─┘┴─┘└    ╩╚═╝  ╚═╝╩ ╚═╚═╝╩ ╩╩  ╩═╝╩ ╩╩╚═
      // If this input definition declares itself `isExemplar:true`, but doesn't specify a `type`
      // or `example` as a sort of "meta-schema", then use either "json" or "ref" as the `type`.
      // Either one works, but since "ref" is preferable for performance, we use it if we can.
      // > The only reason we don't use it ALL the time is because it allows a direct reference
      // > to the runtime data to be passed into this machine's `fn`.  So we can only make this
      // > optimization if we're sure that the machine won't mutate the runtime argin provided for
      // > this input.  But if this input definition has `readOnly: true`, then that means we DO
      // > have that guarantee, and so we can safely perform this optimization.
      inputDef.type = (inputDef.readOnly) ? 'ref' : 'json';
      wasAbleToDeriveValidTypeSchema = true;
    } else if (inputDef.custom) {
      //  ┌┐┌┌─┐  ┌─┐─┐ ┬┌─┐┬  ┬┌─┐┬┌┬┐  ┌┬┐┬ ┬┌─┐┌─┐  ┌─┐┌─┐┬ ┬┌─┐┌┬┐┌─┐  ┌─┐┌┬┐┌─┐   ┌┐ ┬ ┬┌┬┐
      //  ││││ │  ├┤ ┌┴┬┘├─┘│  ││  │ │    │ └┬┘├─┘├┤   └─┐│  ├─┤├┤ │││├─┤  ├┤  │ │     ├┴┐│ │ │
      //  ┘└┘└─┘  └─┘┴ └─┴  ┴─┘┴└─┘┴ ┴    ┴  ┴ ┴  └─┘  └─┘└─┘┴ ┴└─┘┴ ┴┴ ┴  └─┘ ┴ └─┘┘  └─┘└─┘ ┴
      //  ┬┌┬┐  ┬ ┬┌─┐┌─┐  ╔═╗╦ ╦╔═╗╔╦╗╔═╗╔╦╗   ┌─┐┌─┐   ┬┬ ┬┌─┐┌┬┐  ┌─┐┌─┐  ┬ ┬┬┌┬┐┬ ┬  ╦═╗╔═╗╔═╗
      //  │ │   ├─┤├─┤└─┐  ║  ║ ║╚═╗ ║ ║ ║║║║   └─┐│ │   ││ │└─┐ │   │ ┬│ │  ││││ │ ├─┤  ╠╦╝║╣ ╠╣
      //  ┴ ┴   ┴ ┴┴ ┴└─┘  ╚═╝╚═╝╚═╝ ╩ ╚═╝╩ ╩┘  └─┘└─┘  └┘└─┘└─┘ ┴   └─┘└─┘  └┴┘┴ ┴ ┴ ┴  ╩╚═╚═╝╚
      // (we don't really 100% know for sure that "ref" is the intent, but we still default to
      // `type: 'ref'` in this case anyway, just to try to be less annoying)
      inputDef.type = 'ref';
    } else if (
      inputDef.isCreditCard ||
      inputDef.isEmail ||
      inputDef.isHexColor ||
      (inputDef.isIn && _.all(inputDef.isIn, function(item){ return _.isString(item); })) ||
      inputDef.isIP ||
      inputDef.isURL ||
      inputDef.isUUID ||
      inputDef.maxLength ||
      inputDef.minLength ||
      inputDef.regex
    ) {
      //  ┌┐┌┌─┐  ┌─┐─┐ ┬┌─┐┬  ┬┌─┐┬┌┬┐  ┌┬┐┬ ┬┌─┐┌─┐  ┌─┐┌─┐┬ ┬┌─┐┌┬┐┌─┐   ┌─┐┌┬┐┌─┐    ┌┐ ┬ ┬┌┬┐
      //  ││││ │  ├┤ ┌┴┬┘├─┘│  ││  │ │    │ └┬┘├─┘├┤   └─┐│  ├─┤├┤ │││├─┤   ├┤  │ │      ├┴┐│ │ │
      //  ┘└┘└─┘  └─┘┴ └─┴  ┴─┘┴└─┘┴ ┴    ┴  ┴ ┴  └─┘  └─┘└─┘┴ ┴└─┘┴ ┴┴ ┴┘  └─┘ ┴ └─┘o┘  └─┘└─┘ ┴
      //  ┌┐ ┬ ┬  ┌─┐─┐ ┬┌─┐┌┬┐┬┌┐┌┬┌┐┌┌─┐  ┌─┐┌┐┌┌─┐┬ ┬┌─┐┬─┐  ┬─┐┬ ┬┬  ┌─┐┌─┐   ┬ ┬┌─┐  ┌─┐┌─┐┌┐┌
      //  ├┴┐└┬┘  ├┤ ┌┴┬┘├─┤││││││││││││ ┬  ├─┤││││  ├─┤│ │├┬┘  ├┬┘│ ││  ├┤ └─┐   │││├┤   │  ├─┤│││
      //  └─┘ ┴   └─┘┴ └─┴ ┴┴ ┴┴┘└┘┴┘└┘└─┘  ┴ ┴┘└┘└─┘┴ ┴└─┘┴└─  ┴└─└─┘┴─┘└─┘└─┘┘  └┴┘└─┘  └─┘┴ ┴┘└┘
      //  ┌┬┐┌─┐┌┬┐┌─┐┬─┐┌┬┐┬┌┐┌┌─┐  ┌┬┐┬ ┬┌─┐┌┬┐  ┬┌┬┐  ╔╦╗╦ ╦╔═╗╔╦╗  ╔╗ ╔═╗  ╔═╗  ╔═╗╔╦╗╦═╗╦╔╗╔╔═╗
      //   ││├┤  │ ├┤ ├┬┘│││││││├┤    │ ├─┤├─┤ │   │ │   ║║║║ ║╚═╗ ║   ╠╩╗║╣   ╠═╣  ╚═╗ ║ ╠╦╝║║║║║ ╦
      //  ─┴┘└─┘ ┴ └─┘┴└─┴ ┴┴┘└┘└─┘   ┴ ┴ ┴┴ ┴ ┴   ┴ ┴   ╩ ╩╚═╝╚═╝ ╩   ╚═╝╚═╝  ╩ ╩  ╚═╝ ╩ ╩╚═╩╝╚╝╚═╝o
      // (not even "ref" or "json"!  i.e. to be valid, any argin would HAVE to be a string.)
      inputDef.type = 'string';
    } else if (
      inputDef.max ||
      inputDef.min ||
      inputDef.isInteger
    ) {
      //  ┌┐┌┌─┐  ┌─┐─┐ ┬┌─┐┬  ┬┌─┐┬┌┬┐  ┌┬┐┬ ┬┌─┐┌─┐  ┌─┐┌─┐┬ ┬┌─┐┌┬┐┌─┐   ┌─┐┌┬┐┌─┐    ┌┐ ┬ ┬┌┬┐
      //  ││││ │  ├┤ ┌┴┬┘├─┘│  ││  │ │    │ └┬┘├─┘├┤   └─┐│  ├─┤├┤ │││├─┤   ├┤  │ │      ├┴┐│ │ │
      //  ┘└┘└─┘  └─┘┴ └─┴  ┴─┘┴└─┘┴ ┴    ┴  ┴ ┴  └─┘  └─┘└─┘┴ ┴└─┘┴ ┴┴ ┴┘  └─┘ ┴ └─┘o┘  └─┘└─┘ ┴
      //  ┌┐ ┬ ┬  ┌─┐─┐ ┬┌─┐┌┬┐┬┌┐┌┬┌┐┌┌─┐  ┌─┐┌┐┌┌─┐┬ ┬┌─┐┬─┐  ┬─┐┬ ┬┬  ┌─┐┌─┐   ┬ ┬┌─┐  ┌─┐┌─┐┌┐┌
      //  ├┴┐└┬┘  ├┤ ┌┴┬┘├─┤││││││││││││ ┬  ├─┤││││  ├─┤│ │├┬┘  ├┬┘│ ││  ├┤ └─┐   │││├┤   │  ├─┤│││
      //  └─┘ ┴   └─┘┴ └─┴ ┴┴ ┴┴┘└┘┴┘└┘└─┘  ┴ ┴┘└┘└─┘┴ ┴└─┘┴└─  ┴└─└─┘┴─┘└─┘└─┘┘  └┴┘└─┘  └─┘┴ ┴┘└┘
      //  ┌┬┐┌─┐┌┬┐┌─┐┬─┐┌┬┐┬┌┐┌┌─┐  ┌┬┐┬ ┬┌─┐┌┬┐  ┬┌┬┐  ╔╦╗╦ ╦╔═╗╔╦╗  ╔╗ ╔═╗  ╔═╗  ╔╗╔╦ ╦╔╦╗╔╗ ╔═╗╦═╗
      //   ││├┤  │ ├┤ ├┬┘│││││││├┤    │ ├─┤├─┤ │   │ │   ║║║║ ║╚═╗ ║   ╠╩╗║╣   ╠═╣  ║║║║ ║║║║╠╩╗║╣ ╠╦╝
      //  ─┴┘└─┘ ┴ └─┘┴└─┴ ┴┴┘└┘└─┘   ┴ ┴ ┴┴ ┴ ┴   ┴ ┴   ╩ ╩╚═╝╚═╝ ╩   ╚═╝╚═╝  ╩ ╩  ╝╚╝╚═╝╩ ╩╚═╝╚═╝╩╚═o
      // (not even "ref" or "json"!  i.e. to be valid, any argin would HAVE to be a number.)
      inputDef.type = 'number';
    } else {
      implProblems.push(inputProblemPrefix+'Must have `type`, or at least some more information.  (If you aren\'t sure what to use, just go with `type: \'ref\'.)');
    }//ﬁ

    // If the data type could not be determined, then track this input.
    if (!wasAbleToDeriveValidTypeSchema) {
      inputsWithIndeterminateTypes.push(inputCodeName);
    }

    // Check `isExemplar`.
    if (inputDef.isExemplar !== undefined){
      // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
      // FUTURE: Maybe remove support for `isExemplar` in favor of the recently-
      // proposed "isType" prop?  Note that this would require some changes in
      // other tooling though...
      // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
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
      else if (inputDef.allowNull === true && inputDef.required === true) {
        implProblems.push(inputProblemPrefix+'Defined with both `allowNull: true` and `required: true`... but that wouldn\'t make any sense.  (These settings are mutually exclusive.)');
      }
      else if (inputDef.allowNull === true && inputDef.isExemplar === true) {
        implProblems.push(inputProblemPrefix+'Defined with both `allowNull: true` and `isExemplar: true`... but that wouldn\'t make any sense.  (These settings are mutually exclusive.)');
      }

      if (wasAbleToDeriveValidTypeSchema && (inputDef.type === 'json' || inputDef.type === 'ref')) {
        implProblems.push(inputProblemPrefix+
        'Defined with `allowNull: true`, which is unnecessary in conjunction with this input\'s '+
        'declared `type`, "'+inputDef.type+'".  (With this type restriction, `null` would always '+
        'be valid anyway.)');
      }
    }

    // Check `defaultsTo`.
    if (inputDef.defaultsTo !== undefined){
      if (inputDef.required === true) {
        implProblems.push('The `defaultsTo` property cannot be used in conjunction with `required: true`.  (Only optional inputs may have a default value.)');
      } else if (inputDef.allowNull === true && _.isNull(inputDef.defaultsTo)) {
        // Always tolerate `defaultsTo: null` if this input has `allowNull: true`
      } else if (wasAbleToDeriveValidTypeSchema) {
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
    // (Note that, at this point, we know we have a valid `type` at least.)
    _.each(ANCHOR_RULES, function(ruleInfo, ruleName){

      // Ignore unspecified rules.
      // > Note that if the rule is `undefined`, we still process it-- so long as
      // > it is specified. (This is to match the behavior of how these rules are
      // > validated against at runtime, where we run the validation if the key
      // > is present, regardless of whether or not it is `undefined`.)
      if (!inputDef.hasOwnProperty(ruleName)) {
        return;
      }

      // Special exception for the "custom" rule, which works with _anything_.
      if (ruleName === 'custom') { return; }

      // But otherwise, we check that the input's `type` is supported:
      if (wasAbleToDeriveValidTypeSchema && !_.contains(ruleInfo.expectedTypes, inputDef.type)) {
        implProblems.push(inputProblemPrefix+'Cannot use `'+ruleName+'` with that type of input.');
      }

      // And check that the configuration of the rule is valid.
      if (!_.isFunction(ruleInfo.checkConfig)) { throw new Error('Consistency violation: Rule is missing `checkConfig` function!  (Could an out-of-date dependency still be installed?  (To resolve, try running `rm -rf node_modules && rm package-lock.json && npm install`.  If that doesn\'t work, please report this at https://sailsjs.com/bugs.)'); }
      var ruleConfigError = ruleInfo.checkConfig(inputDef[ruleName]);
      if (ruleConfigError) {
        implProblems.push(inputProblemPrefix+'Configuration for `'+ruleName+'` is invalid: ' + ruleConfigError);
      }

    });//∞


    // Check `readOnly`.
    if (inputDef.readOnly !== undefined){
      if (!_.isBoolean(inputDef.readOnly)){
        implProblems.push(inputProblemPrefix+'Invalid `readOnly` property.  (If specified, must be boolean: `true` or `false`.)');
      }
    }

    // Check `protect`.
    if (inputDef.protect !== undefined){
      if (!_.isBoolean(inputDef.protect)){
        implProblems.push(inputProblemPrefix+'Invalid `protect` property.  (If specified, must be boolean: `true` or `false`.)');
      }
    }



    // COMMON TYPO CHECKS:
    // ==========================================

    // `defaultsto` (lowercase)
    if (inputDef.defaultsto !== undefined){
      implProblems.push(inputProblemPrefix+'Unrecognized property, "defaultsto".  Did you mean `defaultsTo`? (camelcase, with a capital "T")');
    }

    // `allownull` (lowercase)
    if (inputDef.allownull !== undefined){
      implProblems.push(inputProblemPrefix+'Unrecognized property, "allownull".  Did you mean `allowNull`? (camelcase, with a capital "N")');
    }

    // `outputType`/`outputExample`
    if (inputDef.outputType !== undefined || inputDef.outputExample !== undefined) {
      implProblems.push(inputProblemPrefix+'`outputType` and `outputExample` are not supported for inputs (only exits).  (Tip: This error usually surfaces from mistakes when copying/pasting.)');
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

  });//∞  </each input>


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
    implProblems.push('Invalid `exits`.  (If specified, must be a dictionary-- i.e. plain JavaScript object like `{}`.)');
  }

  var exitCodeNames = Object.keys(nmDef.exits);
  _.each(exitCodeNames, function (exitCodeName){
    var exitDef = nmDef.exits[exitCodeName];
    var exitProblemPrefix = 'Invalid exit definition ("'+exitCodeName+'").  ';

    // Make sure this code name won't conflict with anything important.
    var reasonCodeNameIsInvalid = validateCodeNameStrict(exitCodeName);
    if (reasonCodeNameIsInvalid) {
      implProblems.push('Invalid exit name ("'+exitCodeName+'").  Please use something else instead, because this '+reasonCodeNameIsInvalid+'.');
    }//ﬁ

    if (!_.isObject(exitDef) || _.isArray(exitDef) || _.isFunction(exitDef)) {
      implProblems.push(exitProblemPrefix+'Must be a dictionary-- i.e. plain JavaScript object like `{}`.');
      // Pretend this exit def was an empty dictionary and keep going so that the "implProblems"
      // returned end up being more useful overall:
      exitDef = {};
    }//•


    // Check `outputType` / `outputExample` / `like` / `itemOf` / `getExample`
    //
    // > (Note that `like`, `itemOf`, and `getExample` resolution is still pretty generic here--
    // > when `.exec()` is called, this is taken further to use the runtime values. At this point,
    // > we're just validating that the provided stuff in the definition is meaningful and relevant.)
    // >
    // > For reference, the original implementation:
    // > • https://github.com/node-machine/machine/blob/3cbdf60f7754ef47688320d370ef543eb27e36f0/lib/private/verify-exit-definition.json
    // > • https://github.com/node-machine/machine/blob/3cbdf60f7754ef47688320d370ef543eb27e36f0/lib/Machine.build.js
    var outputDeclarationStyles = _.intersection(Object.keys(exitDef), [
      'outputType',
      'outputExample',
      'like',
      'itemOf',
      'getExample'
    ]);

    // Now that we've counted the number of output declarations, we can analyze:
    // • If 0, this exit is void (has no guaranteed output).
    // • If 1, this exit has exactly one style of output declaration.
    // • If exit has both "outputType" and "outputExample", then that's technically OK.
    //   It just means that this exit has two (valid) co-existing styles of output declaration.
    //   (In this case, we interpret the output example as merely advisory.)
    //
    // But otherwise, this exit has conflicting output declarations.
    // And that's not ok:
    if (outputDeclarationStyles.length > 1 && !(outputDeclarationStyles.length === 2 && _.contains(outputDeclarationStyles, 'outputType') && _.contains(outputDeclarationStyles, 'outputExample'))) {
      implProblems.push(exitProblemPrefix+'Conflicting output declarations: '+outputDeclarationStyles+'.  Please use one or the other.');
    }
    // If this is the error exit, it should either (A) not declare any kind of output or (B) declare a `'ref'` output (i.e. an Error instance)
    // (keep in mind the error exit is shared by built-in functionality such as argin validation, timeouts, uncaught exception catching, and more)
    else if (exitCodeName === 'error' && outputDeclarationStyles.length >= 1 && exitDef.outputType !== 'ref' && exitDef.outputExample !== '===') {
      implProblems.push(exitProblemPrefix+'It\'s best not to declare a specific output type for the "error" exit at all-- but if you have no other option, then please use `outputType: \'ref\'`.');
    }
    // Otherwise the basic structure makes sense, so we'll dive in a bit deeper:
    else {

      // Assuming everything checks out, we then check the output declaration(s) for correctness:
      if (exitDef.outputType !== undefined) {

        if (exitDef.outputType === 'dictionary' || exitDef.outputType === 'object' || exitDef.outputType === '{}'){
          implProblems.push(exitProblemPrefix+'Instead of specifying `outputType: '+util.inspect(exitDef.outputType,{depth:5})+'`, '+
          'please use `outputType: {}`.  (Or, if this data structure might sometimes contain functions or '+
          'other nested data that isn\'t JSON-compatible, then use `outputType: \'ref\'` instead.)');
        }
        else if (exitDef.outputType === 'array' || exitDef.outputType === '[]' || _.isEqual(exitDef.outputType, [])){
          implProblems.push(exitProblemPrefix+'Instead of specifying `outputType: '+util.inspect(exitDef.outputType,{depth:5})+'`, '+
          'please use `outputType: [\'ref\']`.  Or you might opt to use something more specific-- for example, '+
          '`outputType: [\'number\']` indicates that this exit should yield an array of numbers.');
        }
        else if (exitDef.outputType === 'function' || exitDef.outputType === 'lamda' || exitDef.outputType === 'lambda' || exitDef.outputType === '->' || exitDef.outputType === '=>' || _.isFunction(exitDef.outputType)){
          implProblems.push(exitProblemPrefix+'Instead of specifying `outputType: '+util.inspect(exitDef.outputType,{depth:5})+'`, '+
          'please use `outputType: \'ref\'` and provide clarification in this exit\'s `outputDescription`.');
        }
        else {

          // Verify we've got a valid type schema.
          try {
            rttc.validateStrict(exitDef.outputType, undefined);
          } catch (err) {
            switch (err.code) {
              case 'E_INVALID':
                // `undefined` (which we passed in as the 2nd argument above) is always invalid
                // in RTTC vs. any type, so we can expect this outcome.
                // (We just used it as a pretend value anyway, as a hack to be able to reuse the code
                // in rttc.validateStrict().)
                break;
              case 'E_UNKNOWN_TYPE':
                implProblems.push(exitProblemPrefix+'Unrecognized `outputType`.  (Must be \'string\', \'number\', \'boolean\', \'json\' or \'ref\'.  Or set it to a type schema like `{total: \'number\', entries: [{}]}` or `[{id:\'number\', name: {givenName: \'Lisa\'}}]`.)');
                break;
              default:
                throw err;
            }
          }
        }

        // Since an `outputType` is also specified, just make sure `outputExample` is a valid instance of that provided type schema.
        if (exitDef.outputExample !== undefined) {
          try {
            // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
            // FUTURE: If the example _could_ be interpreted as a valid RTTC exemplar schema, then make sure it is valid
            // vs. the declared type schema.  (Otherwise this can be kinda confusing.)  For instance, it would be weird
            // to have `type: 'json', example: '==='`.  Technically, the string '===' is a valid JSON-compatible value,
            // but since it has special meaning, it's kinda weird to allow stuff to be specified this way.  (In fact, it
            // might be just as valid of an idea to prevent special string notation (*/===/->) altogether when a `type`
            // is specified-- this needs more thought.)
            // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
            rttc.validateStrict(exitDef.outputType, exitDef.outputExample);
          } catch (err) {
            switch (err.code) {
              case 'E_INVALID':
                implProblems.push(exitProblemPrefix+'Defined with `outputType: \'' + exitDef.outputType + '\'`, '+
                'but the specified `outputExample` is not strictly valid for that type.  (Since both `outputType` and `outputExample` '+
                'are provided, they must be compatible.)');
                break;
              default:
                throw err;
            }
          }
        }//ﬁ

      } else if (exitDef.outputExample !== undefined) {
        // In the absense of `outputType`, `outputExample` becomes more formal.
        // (It must be an RTTC exemplar which we'll then use to derive an `outputType`.)
        try {
          rttc.validateExemplarStrict(exitDef.outputExample, true);
        } catch (err) {
          switch (err.code) {
            case 'E_DEPRECATED_SYNTAX':
            case 'E_INVALID_EXEMPLAR':
              implProblems.push(exitProblemPrefix+'The specified `outputExample` cannot be unambiguously '+
              'interpreted as a particular data type.  Please either change this exit\'s `outputExample` '+
              'or provide an additional `outputType` to clear up the ambiguity.');
              break;
            default:
              throw err;
          }
        }

        exitDef.outputType = rttc.infer(exitDef.outputExample);
      } else if (exitDef.like !== undefined || exitDef.itemOf !== undefined) {
        var declarationStyle = exitDef.itemOf ? 'itemOf' : 'like';
        var referencedInputCodeName = exitDef.itemOf || exitDef.like;
        var referencedInput = nmDef.inputs[referencedInputCodeName];
        if (!referencedInput) {
          implProblems.push(exitProblemPrefix+'If specified, `'+declarationStyle+'` should refer to one of the declared inputs.  But no such input (`'+referencedInputCodeName+'`) exists.');
        } else if (declarationStyle === 'itemOf' && !_.contains(inputsWithIndeterminateTypes, referencedInputCodeName)) {
          if (!_.isArray(referencedInput.type)) {
            implProblems.push(exitProblemPrefix+'If specified, `'+declarationStyle+'` should refer to an input that accepts only arrays.  But the referenced input (`'+referencedInputCodeName+'`) accepts '+rttc.getNounPhrase(_.isString(referencedInput.type)? referencedInput.type : 'dictionary', {plural: true})+'.');
          }
        }

      } else if (exitDef.getExample !== undefined) {
        if (!_.isFunction(exitDef.getExample)) {
          implProblems.push(exitProblemPrefix+'If specified, `getExample` should be a function.');
        }
      }
    }






    // EXIT DEF COMMON MISTAKES CHECK:
    // ==========================================

    // `defaultsTo`
    if (exitDef.defaultsTo !== undefined) {
      implProblems.push(exitProblemPrefix+'`defaultsTo` is not supported for exits.  (If you want this to be the default output, then it\'s up to you to be sure and send this value through this exit in your implementation.)');
      // FUTURE: Consider adding support for this (Useful for redirects in MaA, for example.)
      // But we would want to name it something more explicit-- e.g.  `outputDefaultsTo`
    }

    // `type`
    if (exitDef.type !== undefined) {
      implProblems.push(exitProblemPrefix+'`type` is not supported for exits.  (For clarity, please use `outputType`.)');
    }

    // `example`
    if (exitDef.example !== undefined) {
      implProblems.push(exitProblemPrefix+'`example` is not supported for exits.  (For clarity, please use `outputExample`.)');
    }

    // `isExemplar`
    if (exitDef.isExemplar !== undefined) {
      implProblems.push(exitProblemPrefix+'`isExemplar` is not supported for exits.  Are you sure that\'s what you actually meant?');
    }

    // `allowNull`
    if (exitDef.allowNull !== undefined) {
      implProblems.push(exitProblemPrefix+'`allowNull` is not supported for exits.  Use `outputType: \'ref\'` or `outputType: \'json\'` if you want to tolerate a `null` values as results from this exit.');
    }

    // `protect`
    if (exitDef.protect !== undefined) {
      implProblems.push(exitProblemPrefix+'`protect` is not supported for exits.  (If you have a use case that would benefit from this, please open a discussion in the newsgroup.)');
    }

    // `readOnly`
    if (exitDef.readOnly !== undefined) {
      implProblems.push(exitProblemPrefix+'`readOnly` is not supported for exits.  (If you have a use case that would benefit from this, please open a discussion in the newsgroup.)');
    }

    // anchor validation rules
    _.each(Object.keys(ANCHOR_RULES), function(ruleName){
      if (exitDef[ruleName]) {
        implProblems.push(exitProblemPrefix+'`'+ruleName+'` is not supported for exits.  (If you are interested in validating implementation vs. interface using validations like these, please open up a discussion in the newsgroup.)');
      }
    });//∞


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

    // `validate`
    if (exitDef.validate !== undefined) {
      implProblems.push(exitProblemPrefix+'The `validate` function is not supported anymore.');
    }


  });//∞  </each exit>


  // If "error" & "success" weren't provided in the definition, then add them.
  // > Note: This is actually the recommended usage-- there's no reason to explicitly
  // > specify an exit unless you actually need to customize it.
  if (!nmDef.exits.error){
    nmDef.exits.error = { description: 'An unexpected error occurred.' };
  }

  if (!nmDef.exits.success){
    nmDef.exits.success = { description: 'Done.' };
  }


  return implProblems;

};
