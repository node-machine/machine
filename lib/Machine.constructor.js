/**
 * Module dependencies
 */

var util = require('util');
var path = require('path');
var _ = require('lodash');
var switchback = require('node-switchback');


/**
 * Construct a Machine instance.
 *
 * @optional {Object} machineDefinition
 *                      • defaults to an anonymous "noop" machine definition which, when
 *                        executed, does nothing beyond calling its success exit.
 *
 * @constructor {Machine}
 *
 * @static Machine.build()
 * @static Machine.pack()
 *
 * @public Machine.prototype.configure()
 * @public Machine.prototype.cache()
 * @public Machine.prototype.exec()
 * @public Machine.prototype.error()
 * @public Machine.prototype.warn()
 */

function Machine(machineDefinition) {
  if (!machineDefinition) return Machine.noop();

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

    this.error(err);
    return;
  }

  // Ensure inputs and exits are defined
  machineDefinition.inputs = machineDefinition.inputs||{};
  machineDefinition.exits = machineDefinition.exits||{};

  // Fold in the rest of the provided `machineDefinition`
  _.extend(this, machineDefinition);

  // Initialize private state for this machine instance
  this._configuredInputs = {};
  this._configuredExits = {};
  this._configuredContexts = {};
  this._cacheSettings = {};

}


// Static methods
Machine.build = require('./Machine.build');
Machine.pack = require('./Machine.pack');
Machine.toAction = require('./Machine.toAction');
Machine.buildNoopMachine = require('./Machine.buildNoopMachine');
Machine.buildHaltMachine = require('./Machine.buildHaltMachine');

// Aliases
Machine.load = Machine.build;
Machine.require = Machine.build;
Machine.machine = Machine.build;


// Prototypal methods
Machine.prototype.exec = require('./Machine.prototype.exec');
Machine.prototype.configure = require('./Machine.prototype.configure');
Machine.prototype.cache = require('./Machine.prototype.cache');
Machine.prototype.warn = require('./Machine.prototype.warn');
Machine.prototype.error = require('./Machine.prototype.error');

/**
 * @param  {Object} configuredInputs
 * @chainable
 */
Machine.prototype.setInputs = function (configuredInputs) {
  _.extend(this._configuredInputs, _.cloneDeep(configuredInputs));
  return this;
};

/**
 * @param  {Object} configuredExits
 * @chainable
 */
Machine.prototype.setExits = function (configuredExits) {
  _.extend(this._configuredExits, switchback(configuredExits));
  return this;
};


/**
 * @param  {Object} configuredContexts
 * @chainable
 */
Machine.prototype.setContexts = function (configuredContexts) {
  _.extend(this._configuredContexts, configuredContexts);
  return this;
};




/**
 * @type {Machine.constructor}
 */
module.exports = Machine;
