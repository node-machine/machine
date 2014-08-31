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

  // Instantiate new machine
  var machineInstance = new Machine(machineDefinition);

  // Finally, wrap things up so that the return value is not actually
  // the machine instance itself, but rather a function which allows
  // a machine's user to configure the inputs and/or exits.  This
  // configuration function returns the underlying machine instance.
  var _callableMachineWrapper = function _callableMachineWrapper (){
    return machineInstance.configure.apply(machineInstance, arguments);
  };
  // But first, also merge the most important of the machine instance's
  // properties/methods into the callable wrapper so that they can be
  // accessed as if the wrapper function was the real thing.
  _callableMachineWrapper.exec = _(machineInstance.exec).bind(machineInstance).valueOf();
  _callableMachineWrapper.configure = _(machineInstance.configure).bind(machineInstance).valueOf();
  _callableMachineWrapper.cache = _(machineInstance.cache).bind(machineInstance).valueOf();

  _callableMachineWrapper.fn = machineInstance.fn;
  _callableMachineWrapper.inputs = machineInstance.inputs;
  _callableMachineWrapper.exits = machineInstance.exits;
  _callableMachineWrapper.id = machineInstance.id;
  _callableMachineWrapper.description = machineInstance.description;
  _callableMachineWrapper.moduleName = machineInstance.moduleName;

  return _callableMachineWrapper;
};
