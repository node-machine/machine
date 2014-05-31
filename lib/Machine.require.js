/**
 * Module dependencies
 */

var util = require('util');
var _ = require('lodash');



/**
 * Machine.require()
 *
 * A static factory method which returns an instantiated machine.
 * An alternative to using the Machine constructor directly.
 *
 * @param {String} moduleName
 *                   • the commonjs module name path, as if it was being
 *                     used IN THE PARENT MODULE
 *                     (ie. the module which required `node-machine`)
 *
 * @return {Machine}
 */

module.exports = function Machineºrequire (moduleName) {

  var Machine = this;

  // TODO:
  // find the package.json and use the actual root module path
  // from the machine module (really only comes up when developing/testing
  // since 'moduleName' might actually be a relative require path)

  // TODO: look up dependencies in the machine's package.json and merge them
  // into the `dependencies` key in the machine definition

  // TODO:
  // this doesnt actually have to be a synchronous require-
  // since the `.exec()` usage is asynchronous, we could actually
  // do an asynchronous fetch, return eagerly, then when exec is called,
  // if the machine code has not loaded yet, wait for that first, then
  // execute it, then go about our business.

  var requireCtx = Machine._requireCtx;
  var machineDefinition;
  try {
    machineDefinition = requireCtx.require(moduleName);
  }
  catch(e) {
    var err = new Error();
    err.code = 'MODULE_NOT_FOUND';
    err.message = util.format(
    'Cannot find machine: "%s"\n'+
    '(attempted from from `%s`, i.e.: "%s")'+
    '\n%s',
    moduleName, requireCtx.filename, e.stack||util.inspect(e));
    throw err;
  }

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
  _callableMachineWrapper.exec = _.bind(machine.exec, machine);
  _callableMachineWrapper.configure = _.bind(machine.configure, machine);

  _callableMachineWrapper.inputs = machine.inputs;
  _callableMachineWrapper.exits = machine.exits;
  _callableMachineWrapper.fn = machine.fn;
  _callableMachineWrapper.id = machine.id;
  _callableMachineWrapper.description = machine.description;
  _callableMachineWrapper.moduleName = machine.moduleName;

  return _callableMachineWrapper;

};
