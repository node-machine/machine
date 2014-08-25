/**
 * Module dependencies
 */

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
  var Machine = this;

  // Instantiate new machine
  var machine = new Machine(machineDefinition);

  // Finally, wrap things up so that the return value is not actually
  // the machine instance itself, but rather a function which allows
  // a machine's user to configure the inputs and/or exits.  This
  // configuration function returns the underlying machine instance.
  var _callableMachineWrapper = function _callableMachineWrapper (){
    return machine.configure.apply(machine, arguments);
  };
  // But first, also merge the most important of the machine instance's
  // properties/methods into the callable wrapper so that they can be
  // accessed as if the wrapper function was the real thing.
  _callableMachineWrapper.exec = _(machine.exec).bind(machine).valueOf();
  _callableMachineWrapper.configure = _(machine.configure).bind(machine).valueOf();
  _callableMachineWrapper.cache = _(machine.cache).bind(machine).valueOf();

  _callableMachineWrapper.fn = machine.fn;
  _callableMachineWrapper.inputs = machine.inputs;
  _callableMachineWrapper.exits = machine.exits;
  _callableMachineWrapper.id = machine.id;
  _callableMachineWrapper.description = machine.description;
  _callableMachineWrapper.moduleName = machine.moduleName;

  return _callableMachineWrapper;
};
