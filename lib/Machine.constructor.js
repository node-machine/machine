/**
 * Module dependencies
 */

var util = require('util');
var _ = require('lodash');
var switchback = require('switchback');


/**
 * Construct a configurable/usable Machine instance.
 *
 * ----------------------------------------------------------------------------------------
 * Note that the API for this constructor is private, and it should not be called
 * directly from userland. Instead use the `Machine.build()` static method to construct
 * machine instances.
 * ----------------------------------------------------------------------------------------
 *
 * @private
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
 */

function Machine (machineDefinition) {

  // Fold in the rest of the provided `machineDefinition`
  _.extend(this, machineDefinition);

  var self = this;

  //
  // Initialize private state for this machine instance
  //

  // the runtime input values configured so far
  this._configuredInputs = {};

  // the exit handler callbacks configured so far
  this._configuredExits = {};

  // the runtime environment variables configured so far
  // (always provide `self` (the current machine) and `Machine` the runner)
  this._configuredEnvironment = {
    thisMachine: function (){
      return (self.constructor.build(self)).apply(self, Array.prototype.slice.call(arguments));
    },
    build: this.constructor.build
  };

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
Machine.buildNoopMachine = require('./Machine.buildNoopMachine');
Machine.buildHaltMachine = require('./Machine.buildHaltMachine');

// Aliases
Machine.load = Machine.build;
Machine.require = Machine.build;
Machine.machine = Machine.build;


// Prototypal methods
Machine.prototype.exec = require('./Machine.prototype.exec');
Machine.prototype.execSync = require('./Machine.prototype.execSync');
Machine.prototype.demuxSync = require('./Machine.prototype.demuxSync');
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
  return this;
};

/**
 * @param  {Object} callbacks
 * @chainable
 */
Machine.prototype.setExits = function (callbacks) {


  // Handle callback function
  if (_.isFunction(callbacks)) {
    this._configuredExits.success = function (result){
      return callbacks(null, result);
    };
    this._configuredExits.error = function (err){
      return callbacks(err);
    };
  }
  else if (!_.isObject(callbacks)) {
    throw new Error('Machine must be configured with a single callback or an object of exit callbacks- not:'+configuredExits);
  }
  // Handle exits obj
  else {
    _.extend(this._configuredExits, callbacks);
  }

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
