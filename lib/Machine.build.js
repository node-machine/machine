/**
 * Module dependencies
 */

var util = require('util');
var _ = require('lodash');
var makeECMAScriptCompatible = require('convert-to-ecmascript-compatible-varname');



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

  // Understand functions and wrap them automatically
  if (_.isFunction(machineDefinition)) {
    machineDefinition = { fn: machineDefinition };
  }

  var err = new Error();

  // Ensure `machineDefinition` is valid
  if (!_.isObject(machineDefinition) || !machineDefinition.fn) {
    err.code = 'MACHINE_DEFINITION_INVALID';
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

  // Don't allow machines to be both cacheable and synchronous
  if (machineDefinition.cacheable && machineDefinition.sync) {
    throw (function (){
      var _err = new Error(
      'Failed to instantiate machine ('+machineDefinition.identity+') from the specified machine definition.\n'+
      'A machine cannot be both `cacheable:true` and `sync:true`.\n'+
      'To resolve, you (or whoever built this machine) should either:\n'+
      '(A) force this machine to be used asynchronously by setting `sync: false`\n'+
      'or (B) prevent the use of automated caching by setting `cacheable: false`\n'+
      '\n'+
      'Caching of synchronous machine results should be implemented in userland with _.memoize().\n'+
      '(This is because the built-in machine cache is configurable, database-agnostic, and asynchronous.)'
      );
      _err.code = 'MACHINE_DEFINITION_INVALID';
      return _err;
    })();
  }

  machineDefinition.inputs = machineDefinition.inputs || {};
  machineDefinition.exits = machineDefinition.exits || {};

  // If any inputs were used ensure they have an example or typeclass to determine the type
  if (_.keys(machineDefinition.inputs).length) {
    var _errors = [];

    _.each(_.keys(machineDefinition.inputs), function(inputKey) {
      var input = machineDefinition.inputs[inputKey];

      // Ensure a valid typeclass value
      if(input.typeclass) {
        if(['array', 'dictionary', '*', 'machine'].indexOf(input.typeclass) < 0) {
          _errors.push(inputKey);
        }
      }

      // Don't allow special flags on inputs
      if(!_.isUndefined(input.valid)) {
        _errors.push(inputKey);
      }

      if(
        _.isUndefined(input.example) &&
        _.isUndefined(input.typeclass) &&
        _.isUndefined(input.getExample) &&
        _.isUndefined(input.validate)
      ) {
        _errors.push(inputKey);
      }
    });

    // Build an error message
    var e = new Error();
    e.code = 'MACHINE_INPUT_INVALID';
    e.message = e.message + '\n' + util.format(
      'Failed to instantiate machine from the specified machine definition.\n'+
      'The following `input` properties are not valid: \n%s',
    '• ' + _errors.join(',\n• '));

    if(_errors.length) {
      throw e;
    }
  }

  // Be nice and allow "catchAllExit"
  if (machineDefinition.catchAllExit) {
    machineDefinition.catchallExit = machineDefinition.catchAllExit;
    delete machineDefinition.catchAllExit;
  }

  // If the default exit is defined as a non-existent exit, throw an error
  if (machineDefinition.defaultExit && !machineDefinition.exits[machineDefinition.defaultExit]) {
    err.machine = machineDefinition.identity;
    err.code = 'MACHINE_DEFAULT_EXIT_INVALID';
    err.message = util.format(
      'Failed to instantiate machine from the specified machine definition.\n'+
      'The `defaultExit` property was set to %s, but no such exit is defined.',
    machineDefinition.defaultExit);
    throw err;
  }

  // If the catchall exit is defined as a non-existent exit, throw an error
  if (machineDefinition.catchallExit && !machineDefinition.exits[machineDefinition.catchallExit]) {
    err.machine = machineDefinition.identity;
    err.code = 'MACHINE_CATCHALL_EXIT_INVALID';
    err.message = util.format(
      'Failed to instantiate machine from the specified machine definition.\n'+
      'The `catchallExit` property was set to %s, but no such exit is defined.',
    machineDefinition.catchallExit);
    throw err;
  }

  if (machineDefinition.defaultExit && machineDefinition.defaultExit != 'success' && machineDefinition.exits.success) {
    err.machine = machineDefinition.identity;
    err.code = 'MACHINE_DEFAULT_EXIT_INVALID';
    err.message = util.format(
      'Failed to instantiate machine from the specified machine definition.\n'+
      'The `defaultExit` property was set to %s, but a `success` exit was also specified.\n'+
      'If a `success` exit is configured explicitly, it _must_ be the default exit.',
    machineDefinition.defaultExit);
    throw err;
  }

  if (machineDefinition.catchallExit && machineDefinition.catchallExit != 'error' && machineDefinition.exits.error) {
    err.machine = machineDefinition.identity;
    err.code = 'MACHINE_DEFAULT_EXIT_INVALID';
    err.message = util.format(
      'Failed to instantiate machine from the specified machine definition.\n'+
      'The `catchallExit` property was set to %s, but an `error` exit was also specified.\n'+
      'If an `error` exit is configured explicitly, it _must_ be the catchall exit.',
    machineDefinition.catchallExit);
    throw err;
  }

  // If a default exit is not set and there's no "success" exit, warn that the catchall will be used
  if (!machineDefinition.defaultExit && !machineDefinition.exits.success) {
      err.machine = machineDefinition.identity;
      // console.warn("No defaultExit set; defaulting to the catchall exit.");
  }

  // If a catchall exit is not set and there's no "error" exit, warn that this machine may throw
  if (!machineDefinition.catchallExit && !machineDefinition.exits.error) {
      err.machine = machineDefinition.identity;
      // console.warn("No catchallExit set; if an uncaught exception is thrown or `exits(err)` is called, this machine will throw!");
  }

  // Ensure that an `identity` exists.
  machineDefinition.identity = machineDefinition.identity || machineDefinition.id || machineDefinition.fn.name || 'Anonymous';

  // Ensure that an `id` exists for backwards compatibility.
  machineDefinition.id = machineDefinition.id || machineDefinition.identity;

  // Calculate the `variableName`
  // (an ECMAScript-compatible version of `identity`, replacing dashes w/ camel-case)
  machineDefinition.variableName = makeECMAScriptCompatible(machineDefinition.identity);

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

  // Next, expose the rest of the machine definition as properties on the wrapper fn.
  _callableMachineWrapper.fn = machineDefinition.fn;
  _callableMachineWrapper.inputs = machineDefinition.inputs;
  _callableMachineWrapper.exits = machineDefinition.exits;
  _callableMachineWrapper.identity = machineDefinition.identity;
  _callableMachineWrapper.variableName = machineDefinition.variableName;
  _callableMachineWrapper.defaultExit = machineDefinition.defaultExit;
  _callableMachineWrapper.catchallExit = machineDefinition.catchallExit;



  // Last but not least, inject an `.inspect` method to provide usage info
  _callableMachineWrapper.inspect = require('./build-inspect-fn')(_callableMachineWrapper);

  // Also, throw these in there for backwards compatibility:
  _callableMachineWrapper.description = machineDefinition.description;
  _callableMachineWrapper.moduleName = machineDefinition.moduleName;
  _callableMachineWrapper.id = machineDefinition.id;


  return _callableMachineWrapper;
};
