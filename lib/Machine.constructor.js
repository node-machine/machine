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

  // Ensure input and exit schemas are defined
  machineDefinition.inputs = machineDefinition.inputs||{};
  machineDefinition.exits = machineDefinition.exits||{};

  // Fold in the rest of the provided `machineDefinition`
  _.extend(this, machineDefinition);


  // Ensure defaultExit is set and that default and error exits exist in the machine def.
  ///////////////////////////////////////////////////////////////////////////////////////////////

  ////////////////////////////////////////////////////////////////////////////////////
  // but these cause issues:
  // if (!this.defaultExit){
  //   this.defaultExit = 'success';
  // }
  // if (!this.exits[this.defaultExit]){
  //   this.exits[this.defaultExit] = { description: 'Done.' };
  // }
  ////////////////////////////////////////////////////////////////////////////////////
  if (!this.catchallExit){
    this.catchallExit = 'error';
  }
  if (!this.exits[this.catchallExit]){
    this.exits[this.catchallExit] = { description: 'An unexpected error occurred.' };
  }


  //
  // Initialize private state for this machine instance
  //

  // the runtime input values configured so far
  this._configuredInputs = {};

  // the exit handler callbacks configured so far
  this._configuredExits = {};

  // the runtime environment variables configured so far
  this._configuredEnvironment = {};

  // TODO: detail the keys which end up in here
  this._cacheSettings = {};

  // check runtime input values and call the error exit if they don't match `example` or `typeclass`
  this._runTimeTypeCheck = true;

  // coerce runtime input values to match the expected `example`? (TODO be more specific)
  this._inputCoercion = true;

  // coerce exits' return values to match their examples? (TODO be more specific)
  this._exitCoercion = true;

  // unsafe mode completely disables input validation, and sets _runTimeTypeCheck, _inputCoercion
  // and _exitCoercion to `false` (they can be reactivated if chained after the call to `.unsafe()`)
  this._unsafeMode = false;

  this._runningSynchronously = false;

  // a flag tracking whether debug logging is enabled.
  this._isLogEnabled = (!!process.env.NODE_MACHINE_LOG) || false;

  // initially falsy, this will be set internally to the name of the exit triggered by `fn`
  // (note that this is not necessarily the exit handler callback that was triggered! e.g. if a
  //  user doesn't specify a callback for the "foobar" exit, but it is triggerd by the machine, then
  //  `_exited` is "foobar", but the callback attached to "error" is what was actually called.)
  this._exited = '';

  // This function is triggered after this machine is invoked.
  // (can be customized by globally setting `Machine.onInvoke`.
  //  Should only be used for debugging for now.)
  var self = this;
  this._onInvoke = function defaultOnInvoke (msElapsed) {
    /**
     * Default `onInvoke` handler
     * @logs {String,String,...}
     */
    (function _defaultPostInvocationHandler(msElapsed, machine){
      var elaborationPhrase = (function _determineElaborationPhrase(){
        var phrase = (machine.description||machine.friendlyName) ? '    ('+(machine.description||machine.friendlyName)+')' : '';
        if (phrase.length > 80){
          phrase = phrase.slice(0,80) + '...';
        }
        return phrase;
      })();

      var logMsg = util.format('machine: `%s` -- %dms', machine.identity, msElapsed);
      logMsg += _.reduce(_.range(50 - logMsg.length), function (memo){return memo+' ';}, '');
      machine.log(logMsg, elaborationPhrase);

    }).apply(self, [msElapsed, self]);
  };



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
Machine.prototype.execSync = require('./Machine.prototype.execSync');
Machine.prototype.configure = require('./Machine.prototype.configure');
Machine.prototype.cache = require('./Machine.prototype.cache');
Machine.prototype.warn = require('./Machine.prototype.warn');
Machine.prototype.log = require('./Machine.prototype.warn');
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
Machine.prototype.unsafe = function(flag) {
  this._unsafeMode = flag;
  if (flag === true) {
    this._runTimeTypeCheck = false;
    this._inputCoercion = false;
    this._exitCoercion = false;
  }
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
 * Set the new onInvoke handler function.
 * @param  {[type]} invokeEventHandlerFn [description]
 * @chainable
 */
Machine.prototype.onInvoke = function (invokeEventHandlerFn) {
  this._onInvoke = invokeEventHandlerFn;
  return this;
};


/**
 * @param  {Object} configuredInputs
 * @chainable
 */
Machine.prototype.setInputs = function (configuredInputs) {
  _.extend(this._configuredInputs, configuredInputs);
  // _.extend(this._configuredInputs, _.cloneDeep(configuredInputs));
  return this;
};

/**
 * @param  {Object} configuredExits
 * @chainable
 */
Machine.prototype.setExits = function (configuredExits) {
  var self = this;

  // If we have a catchall exit that's not "error", make an "error" exit
  // that references the catchall
  if (self.catchallExit && self.catchallExit != 'error') {
    // (here for backwards-compatibility)
    configuredExits.error = configuredExits[self.catchallExit];
  }

  // If we have a default exit that's not "success", make a "success" exit
  // that references the default
  if (self.defaultExit && self.defaultExit != 'success') {
    configuredExits.success = configuredExits[self.defaultExit];
  }
  // If we don't have a default exit OR an explicit "success" in our schema,
  // hook the `success` exit up so it calls whatever's configured as our `error` callback
  // (NOTE: this will not help if no `error` callback is configured!!)
  else if (!self.defaultExit && !self.exits.success) {
    configuredExits.success = configuredExits.error;
  }


  /////////////////////////////////////////////////////////////////////////////////////
  // Support traditional callback usage by setting up an "exit forwarding" dictionary
  // for use by the switchback module.
  //
  //  TODO: remove the need for this stuff
  /////////////////////////////////////////////////////////////////////////////////////
  var forwards = {};
  if (self.defaultExit && self.defaultExit !== 'success') {
    // Special case for a defaultExit which is !== "success"
    forwards[self.defaultExit] = 'success';
  }
  if (self.catchallExit && self.catchallExit !== 'error') {
    // Special case for a catchallExit which is !== "error"
    // (here for backwards-compatibility)
    forwards[self.catchallExit] = 'error';
  }

  // Now make any user-provided callbacks (with names which are known in the exit schema)
  // forward to the provided callback named "error"
  // (unless they already have handlers bound)
  // _.each(self.exits, function (exitDef, exitName){
  //   // Ignore catch-all exit and default exit
  //   if (exitName === (self.catchallExit||'error') || exitName === (self.defaultExit||'success')) {
  //     return;
  //   }
  //   if (!configuredExits[exitName]) {
  //     forwards[exitName] = (self.catchallExit||'error');
  //   }
  // });
  /////////////////////////////////////////////////////////////////////////////////////



  // Create the ***USERLAND*** switchback
  // (this takes the callback function or object of callback functions provided by the user
  //  of this machine and upgrades it to a switchback-- this could probably be done without
  //  requiring the extra switchback, but this doesn't hurt anything, and helps ensure there
  //  won't be any throwing or anything like that.)
  //
  //  TODO: remove the need for this
  var switchbackifiedExits = switchback(configuredExits, forwards, undefined, true);

  // Mix in the switchback-ified exits into the exits stored within
  // this configured machine instance.
  _.extend(self._configuredExits, switchbackifiedExits);
  return self;
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
    ' machine\n'+
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
