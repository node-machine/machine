/**
 * Module dependencies
 */

var util = require('util');
var _ = require('@sailshq/lodash');
var rttc = require('rttc');
var flaverr = require('./private/flaverr');
var helpConfigureMachineInstance = require('./private/help-configure-machine-instance');
var buildInspectFn = require('./private/build-inspect-fn');
var verifyExitDefinition = require('./private/verify-exit-definition');


/**
 * Module constants
 */

// A generic help suffix for use in error messages.
var GENERIC_HELP_SUFFIX = '--\n'+
'Read more (or ask for help):\n'+
' • http://sailsjs.com/docs/concepts/helpers\n'+
' • http://sailsjs.com/docs/concepts/actions-and-controllers\n'+
' • https://github.com/node-machine/rttc/blob/master/README.md#types--exemplars\n'+
' • http://node-machine.org/spec\n'+
' • http://sailsjs.com/support';


/**
 * `Machine.build()`
 *
 * Construct a machine instance from the provided definition.
 *
 * @param  {Dictionary} machineDefinition
 * @return {Function}
 */

module.exports = function Machine_build (machineDefinition) {// eslint-disable-line camelcase

  // Get the `Machine` constructor
  var Machine = this;


  //  ██╗   ██╗███████╗██████╗ ██╗███████╗██╗   ██╗
  //  ██║   ██║██╔════╝██╔══██╗██║██╔════╝╚██╗ ██╔╝
  //  ██║   ██║█████╗  ██████╔╝██║█████╗   ╚████╔╝
  //  ╚██╗ ██╔╝██╔══╝  ██╔══██╗██║██╔══╝    ╚██╔╝
  //   ╚████╔╝ ███████╗██║  ██║██║██║        ██║
  //    ╚═══╝  ╚══════╝╚═╝  ╚═╝╚═╝╚═╝        ╚═╝
  //
  //  ██████╗ ██████╗  ██████╗ ██╗   ██╗██╗██████╗ ███████╗██████╗
  //  ██╔══██╗██╔══██╗██╔═══██╗██║   ██║██║██╔══██╗██╔════╝██╔══██╗
  //  ██████╔╝██████╔╝██║   ██║██║   ██║██║██║  ██║█████╗  ██║  ██║
  //  ██╔═══╝ ██╔══██╗██║   ██║╚██╗ ██╔╝██║██║  ██║██╔══╝  ██║  ██║
  //  ██║     ██║  ██║╚██████╔╝ ╚████╔╝ ██║██████╔╝███████╗██████╔╝
  //  ╚═╝     ╚═╝  ╚═╝ ╚═════╝   ╚═══╝  ╚═╝╚═════╝ ╚══════╝╚═════╝
  //
  //  ███╗   ███╗ █████╗  ██████╗██╗  ██╗██╗███╗   ██╗███████╗    ██████╗ ███████╗███████╗
  //  ████╗ ████║██╔══██╗██╔════╝██║  ██║██║████╗  ██║██╔════╝    ██╔══██╗██╔════╝██╔════╝
  //  ██╔████╔██║███████║██║     ███████║██║██╔██╗ ██║█████╗      ██║  ██║█████╗  █████╗
  //  ██║╚██╔╝██║██╔══██║██║     ██╔══██║██║██║╚██╗██║██╔══╝      ██║  ██║██╔══╝  ██╔══╝
  //  ██║ ╚═╝ ██║██║  ██║╚██████╗██║  ██║██║██║ ╚████║███████╗    ██████╔╝███████╗██║
  //  ╚═╝     ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝╚══════╝    ╚═════╝ ╚══════╝╚═╝
  //

  // If nothing was provided, build a no-op machine, return that, and bail.
  if (!machineDefinition) {
    return Machine.build({
      identity: '_noop',
      fn: function (inputs,exits) { return exits.success(); }
    });
  }

  // --•
  // If a function was provided, it could mean one of two different things:
  // (1) the user passed in an anonymous function and wants a machine created for it automatically.
  // (2) the user passed in an already-instantiated machine instance
  if (_.isFunction(machineDefinition)) {

    // We'll assume this is a "wet" machine instance if the provided function is also an object and has either:
    //  • the `isWetMachine` flag, or
    //  • `_callableMachineWrapper` as its function name (private/undocumented)
    var wasMachineInstanceProvided = _.isObject(machineDefinition) && (machineDefinition.isWetMachine||machineDefinition.name==='_callableMachineWrapper');
    if (wasMachineInstanceProvided) {
      // In this case, we'll just go ahead and return the wet machine instance:
      return machineDefinition;
    }
    // Otherwise, this is an anonymous function:
    else {
      // If this appears to be an anonymous function, wrap it up as a machine definition automatically.
      // If available, use the name of the function as the machine identity.
      if (machineDefinition.name) {
        machineDefinition = { identity: machineDefinition.name, fn: machineDefinition };
      }
      else {
        machineDefinition = { fn: machineDefinition };
      }
    }
  }


  // Ensure `machineDefinition` is valid
  if (!_.isObject(machineDefinition) || !machineDefinition.fn) {
    throw flaverr('MACHINE_DEFINITION_INVALID', new Error(
      'Failed to build a Node Machine from the specified definition.\n'+
      'Should be defined as a dictionary (aka plain JavaScript object)\n'+
      'with at least one, all-important property: `fn` (a function).\n'+
      '\n'+
      'The specified definition is invalid:\n'+
      '------------------------------------------------------\n'+
      ''+util.inspect(machineDefinition, {depth: 5})+'\n'+
      '------------------------------------------------------\n'+
      '\n'+
      'Tip: Usually, if you\'re seeing this message, it\'s because you forgot to define\n'+
      'a `fn`.  (It is also sometimes due to `.build()` being called on the wrong thing.)\n'+
      GENERIC_HELP_SUFFIX
    ));
  }// --•

  machineDefinition.inputs = machineDefinition.inputs || {};
  machineDefinition.exits = machineDefinition.exits || {};

  // If any inputs were used ensure they have an example or typeclass to determine the type.
  if (_.keys(machineDefinition.inputs).length > 0) {
    var _errors = [];

    _.each(_.keys(machineDefinition.inputs), function(inputKey) {
      var input = machineDefinition.inputs[inputKey];

      // Ensure a valid typeclass value
      // TODO: deprecate typeclass
      if(input.typeclass) {
        if(['array', 'dictionary', '*', 'number', 'string', 'primitive', 'boolean', 'machine', 'stream', 'buffer'].indexOf(input.typeclass) < 0) {
          _errors.push(inputKey);
        }
      }

      // If a `type` is given, validate that it's a valid type,
      // and either provide an example or, if there's already an
      // example, ensure that the example is of the given type.
      if (input.type) {

        // Ensure the type is valid.
        if (!_.contains(['string', 'number', 'boolean', 'json', 'ref'], input.type)) {
          throw flaverr('MACHINE_INPUT_INVALID', new Error(
            'Failed to build `' + machineDefinition.identity + '` from the specified definition.\n'+
            'The `'+inputKey+'` input is defined with an invalid type ("' + input.type + '").  '+
            'Type must be one of "string", "number", "boolean", "json" or "ref".\n'+
            GENERIC_HELP_SUFFIX
          ));
        }//-•

        // If no example was given, use the default exemplar for the given type.
        if (_.isUndefined(input.example)) {
          input.example = rttc.getDefaultExemplar(input.type);
        }
        //‡
        // Otherwise make sure that the given example is compatible with the given type.
        else {
          try {
            rttc.validateStrict(input.type, input.example);
          }
          catch (e) {
            throw flaverr('MACHINE_INPUT_INVALID', new Error(
              'Failed to build `' + machineDefinition.identity + '` from the specified definition.\n'+
              'The `'+inputKey+'` input is defined with `type: \'' + input.type + '\'`, but the '+
              'specified `example` is not valid for that type!  (If BOTH `type` and `example` are '+
              'provided, they must be compatible.)\n'+
              GENERIC_HELP_SUFFIX
            ));
          }
        }

        // Delete the `type` property (we really just care about `example`).
        delete input.type;
      }//>-

      // Don't allow special flags on inputs
      if(!_.isUndefined(input.valid)) {
        _errors.push(inputKey);
      }

      // An input must specify an `example` or `isExemplar: true`.
      if(
        _.isUndefined(input.example) &&
        input.isExemplar !== true &&
        _.isUndefined(input.like) && // <= todo: deprecate
        _.isUndefined(input.itemOf) && // <= todo: deprecate
        _.isUndefined(input.typeclass) && // <= todo: deprecate
        _.isUndefined(input.getExample) && // <= todo: deprecate
        _.isUndefined(input.validate) // <= todo: deprecate
      ) {
        _errors.push(inputKey);
      }

      // If `contract` was provided:
      if (!_.isUndefined(input.contract)) {

        // Validate the `contract` definition
        // and ensure that the input is expecting a lamda function.
        var contractIsInvalid;
        try {
          contractIsInvalid =
          !_.isObject(input.contract) ||
          (input.contract.provides && !_.isObject(input.contract.provides)) ||
          (input.contract.expects && !_.isObject(input.contract.expects)) ||
          _.isUndefined(input.example) ||
          rttc.infer(input.example) !== 'lamda';
        } catch (e) {
          contractIsInvalid = true;
        }

        if (contractIsInvalid){
          _errors.push(inputKey);
        }
      }
    });

    // If there are issues w/ one or more machine inputs, then throw an error.
    if(_errors.length > 0) {
      throw flaverr({ code: 'MACHINE_INPUT_INVALID' }, new Error(
        'Failed to build `' + machineDefinition.identity + '` from the specified definition.\n'+
        'The following `inputs` properties are not valid: \n'+
        '• ' + _errors.join(',\n• ')+'\n'+
        GENERIC_HELP_SUFFIX
      ));
    }//--•

  }//</if provided machine def has inputs  >-

  // Resolve `like` and `itemOf` directives for each input and exit:
  _.each(machineDefinition.inputs, function(inputDef, inputId) {

    // Set `_id` on each input
    inputDef._id = inputId;

    // If an input has a `like` or an `itemOf` instead of an example, but
    // it points to the SAME INPUT, then that is a build error.
    if (inputDef.like === inputId) {
      throw flaverr('MACHINE_INPUT_INVALID', new Error(
        'Failed to instantiate `' + machineDefinition.identity + '` from the specified definition.\n'+
        'The `'+inputId+'` input has a circular `like` directive (references itself).\n'+
        GENERIC_HELP_SUFFIX
      ));
    }
    if (inputDef.itemOf === inputId) {
      throw flaverr('MACHINE_INPUT_INVALID', new Error(
        'Failed to instantiate `' + machineDefinition.identity + '` from the specified definition.\n'+
        'The `'+inputId+'` input has a circular `itemOf` directive (references itself).\n'+
        GENERIC_HELP_SUFFIX
      ));
    }

    // If `example` is not explicitly defined....
    if (_.isUndefined(inputDef.example)) {

      // If this input definition declares itself `isExemplar`, but doesn't specify an `example`
      // as a sort of "meta-exemplar", then use either `*` or `===` as the `example`.
      if (inputDef.isExemplar === true) {
        // (Either one works, but since "===" is preferable for performance, we use it if we can.
        //  The only reason we don't use it all the time is because it allows a direct reference
        //  to the runtime data to be passed into this machine's `fn`.  So we can only make this
        //  optimization if we're sure that the machine won't mutate the runtime argmt provided for
        //  this input (aka "argin").  But if this input definition has `readOnly: true`, then that
        //  means we have that guarantee, and we can safely perform this optimization.)
        inputDef.example = (inputDef.readOnly) ? '===' : '*';
      }
      // Otherwise, this must have `like`/`itemOf`, so check that they make sense.
      else {
        // TODO: deprecate (because `like`/`itemOf` will no longer be allowed on top-lvl machine
        // input defs in a subsequent release)
        verifyExitDefinition(inputDef, machineDefinition);
      }
    }//</if example is not explicitly defined>

  });//</_.each() :: input definition>
  _.each(machineDefinition.exits, function(exitDef, exitId) {
    // Set `_id` on each input
    exitDef._id = exitId;

    // `example` is an alias for `outputExample`.
    // If both were specified, then silently prefer `outputExample`
    if (!_.isUndefined(exitDef.outputExample) && !_.isUndefined(exitDef.example)) {
      // (i.e. replace the `example` with the `outputExample`)
      exitDef.example = exitDef.outputExample;
    }
    // If `outputExample` was specified and `example` was not, then set `example`.
    else if (!_.isUndefined(exitDef.outputExample) && _.isUndefined(exitDef.example)) {
      exitDef.example = exitDef.outputExample;
    }
    // If `example` was specified, but `outputExample` was not, then for now, we don't do
    // anything.  At some point in the future, `example` will be deprecated in exit defs
    // in favor of `outputExample` (for clarity).


    // If `example` is not explicitly defined, then this exit def might still have `like`/`itemOf`/`getExample`.
    // So check that, if provided, they make sense.
    if (_.isUndefined(exitDef.example)) {
      verifyExitDefinition(exitDef, machineDefinition);
    }

    // Prevent building if `getExample` is not a valid function
    if (exitDef.getExample && !_.isFunction(exitDef.getExample)) {
      throw flaverr('MACHINE_EXIT_INVALID', new Error(
        'Failed to build `' + machineDefinition.identity + '` from the specified definition.\n'+
        'The `'+exitId+'` exit is defined with an invalid `getExample` function (should be a function, '+
        'not a '+rttc.getDisplayType(exitDef.getExample)+').\n'+
        GENERIC_HELP_SUFFIX
      ));
    }//--•

    // (Note that `like`, `itemOf`, and `getExample` resolution is still pretty generic here--
    //  when `.exec()` is called, this is taken further to use the runtime values. At this point,
    //  we're just validating that the provided definitions are meaningful and relevant.)

  });//</_.each() :: exit definition>



  // If the catchall exit is defined, fail with a deprecation error.
  // > Note that play nice and allow "catchAllExit" (with the "All" capitalized)
  var isCatchallExitDefined =
    !_.isUndefined(machineDefinition.catchAllExit) ||
    !_.isUndefined(machineDefinition.catchallExit);

  if (isCatchallExitDefined) {
    throw flaverr({
      code: 'CATCHALL_EXIT_SETTING_DEPRECATED',
      machine: machineDefinition.identity
    }, new Error(
      'Failed to build "' + machineDefinition.identity + '" from the specified definition.\n'+
      'The `catchallExit` setting ('+(machineDefinition.catchAllExit||machineDefinition.catchallExit)+') '+
      'was deprecated back in machine@7.0.0.  Nowadays, the catch-all exit should always be `error`.\n'+
      GENERIC_HELP_SUFFIX
    ));
  }//--•


  // If the default exit is defined and not equal to "success", fail with a deprecation error.
  if (machineDefinition.defaultExit && machineDefinition.defaultExit !== 'success') {
    throw flaverr({
      code: 'DEFAULT_EXIT_SETTING_DEPRECATED',
      machine: machineDefinition.identity
    }, new Error(
      'Failed to build "' + machineDefinition.identity + '" from the specified definition.\n'+
      'The `defaultExit` setting ('+(machineDefinition.catchAllExit||machineDefinition.catchallExit)+') '+
      'was deprecated back in machine@7.0.0.  Nowadays, the default exit should always be `success`.\n'+
      GENERIC_HELP_SUFFIX
    ));
  }//--•

  // Ensure "error" exists in the machine def.
  if (!machineDefinition.exits.error){
    machineDefinition.exits.error = { description: 'An unexpected error occurred.' };
  }
  // Ensure "success" exists in the machine def.
  if (!machineDefinition.exits.success){
    machineDefinition.exits.success = { description: 'Done.' };
  }

  // Ensure that an `identity` exists.
  machineDefinition.identity = machineDefinition.identity || machineDefinition.id || machineDefinition.fn.name || 'anonymous';

  // Ensure that an `id` exists for backwards compatibility.
  machineDefinition.id = machineDefinition.id || machineDefinition.identity;
  // TODO: remove this backwards compatibility ^^^^^

  // For backwards compatibility: pre-calculate and cache the `methodName`
  // (an ECMAScript-compatible version of `identity`, replacing dashes w/ camel-case)
  machineDefinition.methodName = Machine.getMethodName(machineDefinition.identity);
  machineDefinition.variableName = machineDefinition.methodName;
  // TODO: remove this backwards compatibility ^^^^^


  // Fold case for `typesafe` (tolerate "typeSafe")
  if (!_.isUndefined(machineDefinition.typeSafe)) {
    machineDefinition.typesafe = machineDefinition.typeSafe;
    delete machineDefinition.typeSafe;
  }

  // Normalize `sideEffects` vs. `cacheable`/`idempotent`
  if (machineDefinition.sideEffects === 'cacheable') {
    machineDefinition.cacheable = true;
    machineDefinition.idempotent = true;
  }
  else if (machineDefinition.sideEffects === 'idempotent') {
    machineDefinition.cacheable = false;
    machineDefinition.idempotent = true;
  }
  else if (machineDefinition.sideEffects === '') {
    machineDefinition.cacheable = false;
    machineDefinition.idempotent = false;
  }
  // If sideEffects is not set or it is null, then determine it based on cacheable/idempotent:
  else if (_.isUndefined(machineDefinition.sideEffects) || _.isNull(machineDefinition.sideEffects)) {
    if (machineDefinition.cacheable) { machineDefinition.sideEffects = 'cacheable'; }
    else if (machineDefinition.idempotent) { machineDefinition.sideEffects = 'idempotent'; }
    else { machineDefinition.sideEffects = ''; }
  }
  // Otherwise, it is invalid.
  else {
    throw flaverr({
      code: 'INVALID_SIDE_EFFECTS',
      machine: machineDefinition.identity
    }, new Error(
      'Failed to build `'+machineDefinition.identity+'` from the specified definition.\n'+
      'If `sideEffects` is provided, it must be \'cacheable\', \'idempotent\', or \'\' (empty string).\n'+
      GENERIC_HELP_SUFFIX
    ));
  }
  //>-•




  //  ██████╗ ███████╗███████╗██╗███╗   ██╗███████╗
  //  ██╔══██╗██╔════╝██╔════╝██║████╗  ██║██╔════╝
  //  ██║  ██║█████╗  █████╗  ██║██╔██╗ ██║█████╗
  //  ██║  ██║██╔══╝  ██╔══╝  ██║██║╚██╗██║██╔══╝
  //  ██████╔╝███████╗██║     ██║██║ ╚████║███████╗
  //  ╚═════╝ ╚══════╝╚═╝     ╚═╝╚═╝  ╚═══╝╚══════╝
  //
  //   ██████╗ █████╗ ██╗     ██╗      █████╗ ██████╗ ██╗     ███████╗
  //  ██╔════╝██╔══██╗██║     ██║     ██╔══██╗██╔══██╗██║     ██╔════╝
  //  ██║     ███████║██║     ██║     ███████║██████╔╝██║     █████╗
  //  ██║     ██╔══██║██║     ██║     ██╔══██║██╔══██╗██║     ██╔══╝
  //  ╚██████╗██║  ██║███████╗███████╗██║  ██║██████╔╝███████╗███████╗
  //   ╚═════╝╚═╝  ╚═╝╚══════╝╚══════╝╚═╝  ╚═╝╚═════╝ ╚══════╝╚══════╝
  //
  //  ██╗    ██╗██████╗  █████╗ ██████╗ ██████╗ ███████╗██████╗
  //  ██║    ██║██╔══██╗██╔══██╗██╔══██╗██╔══██╗██╔════╝██╔══██╗
  //  ██║ █╗ ██║██████╔╝███████║██████╔╝██████╔╝█████╗  ██████╔╝
  //  ██║███╗██║██╔══██╗██╔══██║██╔═══╝ ██╔═══╝ ██╔══╝  ██╔══██╗
  //  ╚███╔███╔╝██║  ██║██║  ██║██║     ██║     ███████╗██║  ██║
  //   ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝     ╚══════╝╚═╝  ╚═╝
  //

  // Define a new callable machine function:
  //
  // > Any time this function or one of its proxy methods is called,
  // > a new live machine instance is returned.

  /**
   * @optional  {Dictionary?} argins
   * @optional  {Dictionary?|Function?} cbs
   * @optional  {Dictionary?} envToSet
   *
   * @return {LiveMachine}
   */
  var _callableMachineWrapper = function _callableMachineWrapper (){
    var machineInstance = new Machine(machineDefinition);

    // Configure provided argins, callbacks, and/or envToSet.
    helpConfigureMachineInstance(machineInstance, arguments[0], arguments[1], arguments[2]);

    // If multiple arguments were provided, go ahead and exec() the machine instance
    if (arguments.length > 1) {
      return machineInstance.exec();
    }

    // Otherwise just return it
    return machineInstance;
  };
  _callableMachineWrapper.isWetMachine = true;
  _callableMachineWrapper.exec = function (){
    var machineInstance = new Machine(machineDefinition);
    return machineInstance.exec.apply(machineInstance, Array.prototype.slice.call(arguments));
  };
  _callableMachineWrapper.execSync = function (){
    var machineInstance = new Machine(machineDefinition);
    return machineInstance.execSync.apply(machineInstance, Array.prototype.slice.call(arguments));
  };
  _callableMachineWrapper.demuxSync = function (){
    var machineInstance = new Machine(machineDefinition);
    return machineInstance.demuxSync.apply(machineInstance, Array.prototype.slice.call(arguments));
  };
  _callableMachineWrapper.setEnv = function (){
    var machineInstance = new Machine(machineDefinition);
    return machineInstance.setEnv.apply(machineInstance, Array.prototype.slice.call(arguments));
  };
  _callableMachineWrapper.configure = function (){
    var machineInstance = new Machine(machineDefinition);
    return machineInstance.configure.apply(machineInstance, Array.prototype.slice.call(arguments));
  };
  _callableMachineWrapper.cache = function (){
    var machineInstance = new Machine(machineDefinition);
    return machineInstance.cache.apply(machineInstance, Array.prototype.slice.call(arguments));
  };
  _callableMachineWrapper.unsafe = function (){
    var machineInstance = new Machine(machineDefinition);
    return machineInstance.unsafe.apply(machineInstance, Array.prototype.slice.call(arguments));
  };

  // Alias `setEnvironment()` => `setEnv()`
  _callableMachineWrapper.setEnvironment = _callableMachineWrapper.setEnv;

  // Next, expose the rest of the machine definition as properties on the wrapper fn.
  _callableMachineWrapper.fn = machineDefinition.fn;
  _callableMachineWrapper.inputs = machineDefinition.inputs;
  _callableMachineWrapper.exits = machineDefinition.exits;
  _callableMachineWrapper.friendlyName = machineDefinition.friendlyName;
  _callableMachineWrapper.description = machineDefinition.description;
  _callableMachineWrapper.extendedDescription = machineDefinition.extendedDescription;
  _callableMachineWrapper.moreInfoUrl = machineDefinition.moreInfoUrl;
  _callableMachineWrapper.sync = machineDefinition.sync;
  _callableMachineWrapper.sideEffects = machineDefinition.sideEffects;
  _callableMachineWrapper.habitat = machineDefinition.habitat;

  _callableMachineWrapper.maxRecursion = machineDefinition.maxRecursion;
  _callableMachineWrapper.timeout = machineDefinition.timeout;
  _callableMachineWrapper._rootMachine = machineDefinition._rootMachine;

  // Last but not least, inject an `.inspect` method to provide usage info
  _callableMachineWrapper.inspect = buildInspectFn(_callableMachineWrapper);

  // Also, throw these in there for backwards compatibility:
  ////////////////////////////////////////////////////////////////////////////////////
  // TODO: officially deprecate these in a major version
  _callableMachineWrapper.cacheable = machineDefinition.cacheable;
  _callableMachineWrapper.idempotent = machineDefinition.idempotent;
  _callableMachineWrapper.methodName = machineDefinition.methodName;
  _callableMachineWrapper.variableName = machineDefinition.methodName;
  _callableMachineWrapper.moduleName = machineDefinition.moduleName;
  _callableMachineWrapper.id = machineDefinition.id;
  _callableMachineWrapper.identity = machineDefinition.identity;//<<can be deprecated _HERE_ at least; should always be dynamically attached if present-- never necessary in compact NM def
  ////////////////////////////////////////////////////////////////////////////////////

  return _callableMachineWrapper;
};

