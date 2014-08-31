/**
 * Module dependencies
 */

var util = require('util');
var _ = require('lodash');




/**
 * TODO:
 * This could just be moved into the constructor?
 * (i.e. have constructor return a wrapper fn with the same properties
 * as the underlying instance- rather than being forced to call Machine.build)
 *
 * @param  {Object} machineDefinition
 * @return {Function}
 */

module.exports = function Machineºbuild (machineDefinition) {

  // Get the `Machine` constructor
  var Machine = this;

  // Understand functions and wrap them automatically
  if (_.isFunction(machineDefinition)) {
    machineDefinition = { fn: machineDefinition };
  }

  // Ensure `machineDefinition` is valid
  if (!_.isObject(machineDefinition) || !machineDefinition.fn) {
    var err = new Error();
    err.code = 'MACHINE_DEFINITION_INVALID';
    err.message = util.format(
    'Failed to instantiate machine from the specified machine definition.\n'+
    'A machine definition should be an object with the following properties:\n'+
    ' • id\n • inputs\n • exits\n • fn\n\n'+
    'But the actual machine definition was:\n'+
    '------------------------------------------------------\n'+
    '%s\n'+
    '------------------------------------------------------\n',
    machineDefinition);
    throw err;
  }

  // Ensure that an `id` exists.
  machineDefinition.id = machineDefinition.id || machineDefinition.fn.name || 'Anonymous';

  // Define a callable machine function
  //
  // Any time this function or one of its proxy methods is called,
  // a new machine instance is returned.
  var _callableMachineWrapper = function _callableMachineWrapper (){
    var machineInstance = new Machine(machineDefinition);
    machineInstance.configure.apply(machineInstance, Array.prototype.slice.call(arguments));
    return machineInstance.exec();
  };
  _callableMachineWrapper.exec = function (){
    var machineInstance = new Machine(machineDefinition);
    return machineInstance.exec.apply(machineInstance, Array.prototype.slice.call(arguments));
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
  _callableMachineWrapper.id = machineDefinition.id;
  _callableMachineWrapper.description = machineDefinition.description;
  _callableMachineWrapper.moduleName = machineDefinition.moduleName;

  // Last but not least, inject an `.inspect` method to provide usage info
  _callableMachineWrapper.inspect = require('./build-inspect-fn')(_callableMachineWrapper);

  return _callableMachineWrapper;
};
