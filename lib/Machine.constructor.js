/**
 * Module dependencies
 */

var util = require('util');
var _ = require('lodash');
var switchback = require('switchback');


/**
 * Construct a configurable/usable Machine instance.
 *
 * @optional {Object} machineDefinition
 *                      • defaults to an anonymous "noop" machine definition which, when
 *                        executed, does nothing beyond calling its success exit.
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
 *
 * ----------------------------------------------------------------------------------------
 * Note that the API for this constructor is private, and it should not be called
 * directly from userland. Instead use the `Machine.build()` static method to construct
 * construct callable machines.
 * ----------------------------------------------------------------------------------------
 */

function Machine (machineDefinition) {
  if (!machineDefinition) return Machine.buildNoopMachine();

  // Ensure inputs and exits are defined
  machineDefinition.inputs = machineDefinition.inputs||{};
  machineDefinition.exits = machineDefinition.exits||{};

  // Fold in the rest of the provided `machineDefinition`
  _.extend(this, machineDefinition);

  // Initialize private state for this machine instance
  this._configuredInputs = {};
  this._configuredExits = {};
  this._configuredEnvironment = {};
  this._cacheSettings = {};
  this._runTimeTypeCheck = true;
  this._inputCoercion = true;
  this._exitCoercion = true;

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
 * @param  {Boolean} flag
 * @chainable
 */
Machine.prototype.rttc = function(flag) {
  this._runTimeTypeCheck = flag;
  return this;
};

/**
 * @param  {Boolean} flag
 * @chainable
 */
Machine.prototype.inputCoercion = function(flag) {
  this._inputCoercion = flag;
  return this;
};

/**
 * @param  {Boolean} flag
 * @chainable
 */
Machine.prototype.exitCoercion = function(flag) {
  this._exitCoercion = flag;
  return this;
};

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

  // If we have a catchall exit that's not "error", make an "error" exit
  // that references the catchall
  if (this.catchallExit && this.catchallExit != 'error') {
    configuredExits.error = configuredExits[this.catchallExit];
  }

  // If we have a default exit that's not "success", make a "success" exit
  // that references the default
  if (this.defaultExit && this.defaultExit != 'success') {
    configuredExits.success = configuredExits[this.defaultExit];
  }

  // If we don't have a default exit OR an explicit "success", forward success
  // to the catchall
  else if (!this.defaultExit && !this.exits.success) {
    configuredExits.success = configuredExits.error;
  }

  _.extend(this._configuredExits, switchback(configuredExits));
  return this;
};


/**
 * @param  {Object} configuredEnvironment
 * @chainable
 */
Machine.prototype.setEnvironment = function (configuredEnvironment) {
  _.extend(this._configuredEnvironment, configuredEnvironment);
  return this;
};


/**
 * Pretty print the current version of node-machine, with license information
 * and a link to the documentation.
 *
 * @return {String}
 */
Machine.inspect = function () {
  return util.format(
    '-----------------------------------------\n'+
    ' node-machine\n'+
    ' v%s\n'+
    ' \n'+
    ' • License  : %s\n'+
    ' • Docs     : %s\n'+
    '-----------------------------------------\n',
    require('../package.json').version,
    require('../package.json').license,
    require('../package.json').docs && require('../package.json').docs.url
  );
};


/**
 * @return {String}
 */
Machine.prototype.inspect = function () {
  var _inspect = require('./build-inspect-fn')(this);
  return _inspect();
};



/**
 * @type {Machine.constructor}
 */
module.exports = Machine;
