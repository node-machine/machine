/**
 * Module dependencies
 */

var util = require('util');
var _ = require('lodash');
var rttc = require('rttc');



/**
 * TODO:
 * This could just be moved into the constructor?
 * (i.e. have constructor return a wrapper fn with the same properties
 * as the underlying instance- rather than being forced to call Machine.build)
 *
 * @param  {Object} machineDefinition
 * @return {Function}
 */

module.exports = function Machine_build (machineDefinition) {

  // Get the `Machine` constructor
  var Machine = this;

  // If nothing was provided, build a no-op machine.
  if (!machineDefinition) {
    return Machine.buildNoopMachine();
  }

  // Understand functions and wrap them automatically
  if (_.isFunction(machineDefinition)) {
    machineDefinition = { fn: machineDefinition };
  }

  var err = new Error();

  // Ensure `machineDefinition` is valid
  if (!_.isObject(machineDefinition) || !machineDefinition.fn) {
    err.code = 'MACHINE_DEFINITION_INVALID';
    err.status = 400;
    err.message = util.format(
    'Failed to instantiate machine from the specified machine definition.\n'+
    'A machine definition should be an object with the following properties:\n'+
    ' • identity\n • inputs\n • exits\n • fn\n\n'+
    'But the actual machine definition was:\n'+
    '------------------------------------------------------\n'+
    '%s\n'+
    '------------------------------------------------------\n',
    util.inspect(machineDefinition, false, null));
    throw err;
  }

  machineDefinition.inputs = machineDefinition.inputs || {};
  machineDefinition.exits = machineDefinition.exits || {};

  // If any inputs were used ensure they have an example or typeclass to determine the type.
  if (_.keys(machineDefinition.inputs).length > 0) {
    var _errors = [];

    _.each(_.keys(machineDefinition.inputs), function(inputKey) {
      var input = machineDefinition.inputs[inputKey];

      // Ensure a valid typeclass value
      // TODO: deprecate
      if(input.typeclass) {
        if(['array', 'dictionary', '*', 'number', 'string', 'primitive', 'boolean', 'machine', 'stream', 'buffer'].indexOf(input.typeclass) < 0) {
          _errors.push(inputKey);
        }
      }

      // Don't allow special flags on inputs
      if(!_.isUndefined(input.valid)) {
        _errors.push(inputKey);
      }

      if(
        _.isUndefined(input.example) &&
        _.isUndefined(input.like) &&
        _.isUndefined(input.itemOf) &&
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

    // Build an error message
    var e = new Error();
    e.code = 'MACHINE_INPUT_INVALID';
    e.status = 400;
    e.message = e.message + '\n' + util.format(
      'Failed to instantiate machine "' + machineDefinition.friendlyName + '" from the specified machine definition.\n'+
      'The following `input` properties are not valid: \n%s',
    '• ' + _errors.join(',\n• '));

    if(_errors.length) {
      throw e;
    }
  }


  // Resolve `like` and `itemOf` directives for each input and exit:
  _.each(machineDefinition.inputs, function(inputDef, inputId) {

    // Set `_id` on each input
    inputDef._id = inputId;

    // If an input has a `like` or an `itemOf` instead of an example, but
    // it points to the SAME INPUT, then that is a build error.
    if (inputDef.like === inputId) {
      throw (function(){
        var err = new Error(
          'Failed to instantiate machine "' + machineDefinition.friendlyName + '" from the specified machine definition.\n'+
          'The machine\'s `'+inputId+'` input has a circular `like` directive (references itself).'
        );
        err.code = 'MACHINE_INPUT_INVALID';
        err.status = 400;
        return err;
      })();
    }
    if (inputDef.itemOf === inputId) {
      throw (function(){
        var err = new Error(
          'Failed to instantiate machine "' + machineDefinition.friendlyName + '" from the specified machine definition.\n'+
          'The machine\'s `'+inputId+'` input has a circular `itemOf` directive (references itself).'
        );
        err.code = 'MACHINE_INPUT_INVALID';
        err.status = 400;
        return err;
      })();
    }

    // If `example` is not explicitly defined, resolve it from `like` or `itemOf`.
    if (_.isUndefined(inputDef.example)) {
      // inputDef.example = resolveExample(inputDef, machineDefinition);
      resolveExample(inputDef, machineDefinition);
    }
  });
  _.each(machineDefinition.exits, function(exitDef, exitId) {
    // Set `_id` on each input
    exitDef._id = exitId;

    // If `example` is not explicitly defined, resolve it from `like`, `itemOf`, or `getExample`.
    if (_.isUndefined(exitDef.example)) {
      // exitDef.example = resolveExample(exitDef, machineDefinition);
      resolveExample(exitDef, machineDefinition);
    }
    // Prevent building if `getExample` is not a valid function
    if (exitDef.getExample && !_.isFunction(exitDef.getExample)) {
      var e = new Error(
        'Failed to instantiate machine "' + machineDefinition.friendlyName + '" from the specified machine definition.\n'+
        'The machine\'s `'+exitId+'` exit has an invalid `getExample` function (should be a function, not a '+rttc.getDisplayType(exitDef.getExample)+').'
      );
      e.code = 'MACHINE_EXIT_INVALID';
      e.status = 400;
      throw e;
    }

    // (Note that `like`, `itemOf`, and `getExample` resolution is still pretty generic here--
    //  when `.exec()` is called, this is taken further to use the runtime values. At this point,
    //  we're just validating that the provided definitions are meaningful and relevant.)

  });



  // If the catchall exit is defined and not equal to "error", fail with a deprecation error.
  if (
      // Be nice and allow "catchAllExit" (with the "All" capitalized)
      (machineDefinition.catchAllExit && machineDefinition.catchAllExit !== 'error') ||
      (machineDefinition.catchallExit && machineDefinition.catchallExit !== 'error')
    ) {
    err = new Error(util.format(
      'Failed to instantiate machine "' + machineDefinition.friendlyName + '" from the specified machine definition.\n'+
      'The `defaultExit` setting (%s) was deprecated in machine@7.0.0.  The default exit should always be `success`.',
    machineDefinition.catchAllExit||machineDefinition.catchallExit));
    err.machine = machineDefinition.identity;
    err.code = 'CATCHALL_EXIT_SETTING_DEPRECATED';
    throw err;
  }


  // If the default exit is defined and not equal to "success", fail with a deprecation error.
  if (machineDefinition.defaultExit && machineDefinition.defaultExit !== 'success') {
    err = new Error(util.format(
      'Failed to instantiate machine from the specified machine definition.\n'+
      'The `defaultExit` setting (%s) was deprecated in machine@7.0.0.  The default exit should always be `success`.',
    machineDefinition.defaultExit));
    err.machine = machineDefinition.identity;
    err.code = 'DEFAULT_EXIT_SETTING_DEPRECATED';
    throw err;
  }

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
  // TODO: remove this backwards compatibility ^^^^^ in next major (v10.0.0)

  // For backwards compatibility: pre-calculate and cache the `methodName`
  // (an ECMAScript-compatible version of `identity`, replacing dashes w/ camel-case)
  machineDefinition.methodName = Machine.getMethodName(machineDefinition.identity);
  machineDefinition.variableName = machineDefinition.methodName;
  // TODO: remove this backwards compatibility ^^^^^ in next major (v10.0.0)


  // Fold case for `typesafe` (tolerate "typeSafe")
  if (!_.isUndefined(machineDefinition.typeSafe)) {
    machineDefinition.typesafe = machineDefinition.typeSafe;
    delete machineDefinition.typeSafe;
  }

  // Define a callable machine function
  //
  // Any time this function or one of its proxy methods is called,
  // a new machine instance is returned.
  var _callableMachineWrapper = function _callableMachineWrapper (){
    var machineInstance = new Machine(machineDefinition);
    machineInstance.configure.apply(machineInstance, Array.prototype.slice.call(arguments));

    // If multiple arguments were provided, go ahead and exec() the machine instance
    if (arguments.length > 1) {
      return machineInstance.exec();
    }

    // Otherwise just return it
    return machineInstance;
  };
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
  _callableMachineWrapper.setEnvironment = function (){
    var machineInstance = new Machine(machineDefinition);
    return machineInstance.setEnvironment.apply(machineInstance, Array.prototype.slice.call(arguments));
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

  // Next, expose the rest of the machine definition as properties on the wrapper fn.
  _callableMachineWrapper.fn = machineDefinition.fn;
  _callableMachineWrapper.inputs = machineDefinition.inputs;
  _callableMachineWrapper.exits = machineDefinition.exits;
  _callableMachineWrapper.identity = machineDefinition.identity;
  _callableMachineWrapper.friendlyName = machineDefinition.friendlyName;
  _callableMachineWrapper.description = machineDefinition.description;
  _callableMachineWrapper.extendedDescription = machineDefinition.extendedDescription;
  _callableMachineWrapper.sync = machineDefinition.sync;
  _callableMachineWrapper.cacheable = machineDefinition.cacheable;
  _callableMachineWrapper.idempotent = machineDefinition.idempotent;
  _callableMachineWrapper.maxRecursion = machineDefinition.maxRecursion;
  _callableMachineWrapper.timeout = machineDefinition.timeout;
  _callableMachineWrapper._rootMachine = machineDefinition._rootMachine;

  // Last but not least, inject an `.inspect` method to provide usage info
  _callableMachineWrapper.inspect = require('./build-inspect-fn')(_callableMachineWrapper);

  // Also, throw these in there for backwards compatibility:
  // TODO: officially deprecate these in a major version
  _callableMachineWrapper.methodName = machineDefinition.methodName;
  _callableMachineWrapper.variableName = machineDefinition.methodName;
  _callableMachineWrapper.moduleName = machineDefinition.moduleName;
  _callableMachineWrapper.id = machineDefinition.id;

  return _callableMachineWrapper;
};












/**
 * [resolveExample description]
 * @param  {[type]} defToResolve    [description]
 * @param  {[type]} machineDefinition [description]
 * @return {[type]}        [description]
 */
function resolveExample(defToResolve, machineDefinition){

  // If an explicit example was provided, use that.
  if (!_.isUndefined(defToResolve.example)) {
    return defToResolve.example;
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

    return referencedInput.example;
  }

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
      throw (function (){
        var err = new Error(util.format(
        'Failed to instantiate machine ("%s") from the specified machine definition.\n'+
        '`itemOf` should refer to a machine input with an explicit example (i.e. it can\'t use `like` or `itemOf` too!)  The referenced input (named `%s`) does not have an explicit example.',
        machineDefinition.friendlyName,
        defToResolve.itemOf));
        err.machine = machineDefinition.identity;
        err.code = 'UNRECOGNIZED_INPUT';
        return err;
      })();
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
      '`itemOf` should refer to a machine input with a patterned array example, but the example of input `%s` is a generic array.',
      machineDefinition.friendlyName,
      defToResolve.itemOf ));
      err.machine = machineDefinition.identity;
      err.code = 'INPUT_NOT_ARRAY';
      throw new Error(err);
    }

    return referencedInput.example[0];

  }

}
