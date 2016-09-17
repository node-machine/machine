/**
 * Module dependencies
 */

var util = require('util');
var _ = require('lodash');


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
 * @optional {Dictionary} machineDefinition
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
 *
 * @private Machine.prototype.warn()
 * @private Machine.prototype.log()
 * @private Machine.prototype.setInputs()
 * @private Machine.prototype.setExits()
 */

function Machine (machineDefinition) {

  // Fold in the rest of the provided `machineDefinition`
  _.extend(this, machineDefinition);

  var self = this;


  //
  // Initialize private state for this machine instance
  //

  // recursive depth starts at 0
  self._recursiveDepth = 0;

  // the runtime input values configured so far
  this._configuredInputs = {};

  // the exit handler callbacks configured so far
  this._configuredExits = {};

  // the runtime environment variables configured so far
  this._configuredEnvironment = {

    // Always provides:

    //  •  `thisMachine` (a new copy of the current machine instance)
    //     Note that this enforces the prevention of infinite recursion.
    thisMachine: function (){
      var recursiveMachineInstance = (self.constructor.build(self)).apply(self, Array.prototype.slice.call(arguments));
      recursiveMachineInstance._recursiveDepth = (self._recursiveDepth)+1;
      // If maxRecursion is exceeded, sub-out the real machine instance with a fake one that
      // always fails. Default max recursive call depth to 250
      if (recursiveMachineInstance._recursiveDepth > (machineDefinition.maxRecursion||250)) {
        recursiveMachineInstance = self.constructor.build(function (inputs, exits){
          var err = new Error( util.format(
            'This machine called itself too many times--exceeding the maximum recursive depth (%d).  '+
            'There is probably an issue in the machine\'s implementation (might be missing a base case, etc.)  '+
            'If you are the implementor of this machine, and you\'re sure there are no problems, you can configure '+
            'the maximum number of recursive calls for this machine using `maxRecursion` (a top-level property in '+
              'your machine definition).  The default is 250.',
            (machineDefinition.maxRecursion||250)
          ) );
          err.code = 'E_MAX_RECURSION';
          return exits.error( err );
        });
      }
      return recursiveMachineInstance;
    },

    //  • and `build` (the runner's `.build()` method)
    build: _.bind(self.constructor.build, self.constructor)
  };

  // `_cacheSettings` contain the configured cache settings for a machine instance
  this._cacheSettings = {

    // `model` is a Sails.js/Waterline model
    // (or an object which acts like one and has the methods below)
    //
    // This default `model` is just a quick hack to store stuff in-memory
    // on a per-server basis.  If you care about NOT doing the cacheable thing
    // at least once per every server in your cloud, you should override the
    // `model` option with a Waterline model hooked which is hooked up to a real
    // database.
    //
    // TODO: finish this- or set up an alternative. Would be easy if we used
    // waterline+sails-memory, or even just waterline-criteria, but I'd rather
    // not add more dependencies, since `machine` gets required so many times...
    //
    // model: (function _buildFakeModel() {
    //   var records = [];

    //   return {
    //     create: function (values){
    //       var err;
    //       var result;

    //       return {
    //         exec: function (cb){
    //           if (err) {
    //             return cb(err);
    //           }
    //           return cb(null, result);
    //         }
    //       };
    //     },
    //     find: function (criteria){
    //       var err;
    //       var result;
    //       return {
    //         exec: function (cb){
    //           if (err) {
    //             return cb(err);
    //           }
    //           return cb(null, result);
    //         }
    //       };
    //     },
    //     count: function (criteria){
    //       var err;
    //       var result;
    //       return {
    //         exec: function (cb){
    //           if (err) {
    //             return cb(err);
    //           }
    //           return cb(null, result);
    //         }
    //       };
    //     },
    //     destroy: function (criteria){
    //       var err;
    //       var result;
    //       return {
    //         exec: function (cb){
    //           if (err) {
    //             return cb(err);
    //           }
    //           return cb(null, result);
    //         }
    //       };
    //     }
    //   };
    // })()

    // Default TTL (i.e. "max age") is 3 hours
    // ttl: 3 * 60 * 60 * 1000,

    // The maximum # of old cache entries to keep for each
    // unique combination of input values for a particular
    // machine type.
    // When this # is exceeded, a query will be performed to
    // wipe them out.  Increasing this value increases memory
    // usage but reduces the # of extra gc queries.  Reducing
    // this value minimizes memory usage but increases the # of
    // gc queries.
    //
    // When set to 0, performs an extra destroy() query every time
    // a cache entry expires (and this is actually fine in most cases,
    // since that might happen only a few times per day)
    // maxOldEntriesBuffer: 0,

    // // By default, the default (or "success") exit is cached
    // exit: 'success'
  };

  // initialize _stackDepth at 0
  // (this is used when building lamda machines)
  this._stackDepth = 0;

  // check runtime input values and call the error exit if they don't match `example` or `typeclass`
  this._runTimeTypeCheck = true;

  // coerce runtime input values to match the expected `example`? (TODO be more specific)
  this._inputCoercion = true;

  // coerce exits' return values to match their examples? (TODO be more specific)
  this._exitCoercion = true;

  // unsafe mode completely disables validation and coercion of both inputs and exits
  // by setting `_runTimeTypeCheck`, `_inputCoercion` ,and `_exitCoercion` to `false`.
  // (they can be reactivated if chained after the call to the `.unsafe()` helper method)
  this._unsafeMode = false;

  // if `typesafe` is enabled, then the machine will have validation and coercion
  // completely disabled by default-- so immediately call `.unsafe(true)`
  if (this.typesafe) {
    console.log(' * * * * * * * * * * * * * * * * ~••~ * * * * * * * * * * * * * * * * * * *');
    console.log(' * NOTE: `typesafe` is experimental and not ready for production use!     *');
    console.log(' * It is generally not a good idea to use this, and there is a high       *');
    console.log(' * likelihood the feature will be removed altogether; or that its API     *');
    console.log(' * will change significantly and without notice in an upcoming release.   *');
    console.log(' * * * * * * * * * * * * * * * * ~••~ * * * * * * * * * * * * * * * * * * *');
    this.unsafe(true);
  }

  // a flag tracking whether or not the machine is running synchronously
  this._runningSynchronously = false;

  // a flag tracking whether debug logging is enabled.
  this._isLogEnabled = (!!process.env.NODE_MACHINE_LOG) || false;

  // a flag tracking whether execution duration is being tracked
  this._doTrackDuration = true;

  // initially falsy, this will be set internally to the name of the exit triggered by `fn`
  // (note that this is not necessarily the exit handler callback that was triggered! e.g. if a
  //  user doesn't specify a callback for the "foobar" exit, but it is triggerd by the machine, then
  //  `_exited` is "foobar", but the callback attached to "error" is what was actually called.)
  this._exited = '';

  // This function is triggered after this machine is invoked.
  // (can be customized by globally setting `Machine.onInvoke`.
  //  Should only be used for debugging for now.)
  this._onInvoke = function _defaultAfterInvokeHandler (machine){

    var elaborationPhrase = (function _determineElaborationPhrase(){
      var phrase = (machine.description||machine.friendlyName) ? '    ('+(machine.description||machine.friendlyName)+')' : '';
      if (phrase.length > 80){
        phrase = phrase.slice(0,80) + '...';
      }
      return phrase;
    })();

    var logMsg = util.format('machine: `%s` -- %dms', machine.identity, machine._msElapsed);
    logMsg += _.reduce(_.range(50 - logMsg.length), function (memo){return memo+' ';}, '');
    machine.log(logMsg, elaborationPhrase);
  };

}


// Static methods
Machine.build = require('./Machine.build');
Machine.pack = require('./Machine.pack');

/**
 * Expose `getMethodName()`
 *
 * @return {String}
 */
Machine.getMethodName = require('./get-method-name');

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




// Prototypal methods
Machine.prototype.exec = require('./Machine.prototype.exec');
Machine.prototype.execSync = require('./Machine.prototype.execSync');
Machine.prototype.demuxSync = require('./Machine.prototype.demuxSync');
Machine.prototype.configure = require('./Machine.prototype.configure');
Machine.prototype.cache = require('./Machine.prototype.cache');


/**
 * Machine.prototype.warn()
 *
 * Trigger a warning on this machine.
 * > Use configured `onWarn` function, or by default, use `console.error`.
 *
 * @chainable
 */

Machine.prototype.warn = function Machine_prototype_warn () {

  (this.onWarn||function _defaultWarnHandler(/*...*/){
    console.error.apply(console, Array.prototype.slice.call(arguments));
  }).apply(this, Array.prototype.slice.call(arguments));

  return this;
};


/**
 * Machine.prototype.log()
 *
 * Trigger a log on this machine.
 * > Use configured `onLog` function, or by default, use `console.log()`.
 *
 * @chainable
 */
Machine.prototype.log = function Machine_prototype_log () {

  (this.onLog||function _defaultLogHandler(/*...*/){
    console.log.apply(console, Array.prototype.slice.call(arguments));
  }).apply(this, Array.prototype.slice.call(arguments));

  return this;
};



/**
 * setEnv()
 *
 * Set `env` (third argument to machine fn)
 *
 * @param  {Dictionary} configuredEnv
 * @chainable
 */
Machine.prototype.setEnv = function (configuredEnv) {
  _.extend(this._configuredEnvironment, configuredEnv);
  return this;
};



/**
 * @return {String}
 */
Machine.prototype.inspect = function () {
  var _inspect = require('./build-inspect-fn')(this);
  return _inspect();
};



// ========================================================================================
// ========================================================================================
// ========================================================================================

/**
 * @deprecated <<TODO: remove this>>
 * @param  {Boolean} flag
 * @chainable
 */
Machine.prototype.rttc = function(flag) {
  this._runTimeTypeCheck = flag;
  return this;
};

/**
 * @deprecated <<TODO: remove this>>
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
 * @deprecated <<TODO: remove this>>
 * @param  {Boolean} flag
 * @chainable
 */
Machine.prototype.inputCoercion = function(flag) {
  this._inputCoercion = flag;
  return this;
};

/**
 * @deprecated <<TODO: remove this>>
 * @param  {Boolean} flag
 * @chainable
 */
Machine.prototype.exitCoercion = function(flag) {
  this._exitCoercion = flag;
  return this;
};


/**
 * @deprecated <<TODO: remove this>>
 * Set the new onInvoke handler function.
 * @param  {[type]} invokeEventHandlerFn [description]
 * @chainable
 */
Machine.prototype.onInvoke = function (invokeEventHandlerFn) {
  this._onInvoke = invokeEventHandlerFn;
  return this;
};


/**
 * @deprecated <<TODO: remove this-- use .configure() instead!>>
 * Configure runtime input values.
 *
 * @param  {Dictionary} configuredInputVals
 * @chainable
 */
Machine.prototype.setInputs = function (configuredInputVals) {
  _.extend(this._configuredInputs, configuredInputVals);
  return this;
};

/**
 * @param  {Dictionary} callbacks
 * @chainable
 *
 * TODO: remove this if possible
 */
Machine.prototype.setExits = function (callbacks) {


  // Handle callback function
  if (_.isFunction(callbacks)) {
    this._configuredExits.success = function (result){
      return callbacks(undefined, result);
    };
    this._configuredExits.error = function (err){
      return callbacks(err);
    };
  }
  else if (!_.isObject(callbacks)) {
    throw new Error('Machine must be configured with either (A) a single, traditional Node.js-style callback function, or (B) a dictionary of exit callbacks.  But instead, got:\n'+util.inspect(callbacks,{depth: null}));
  }
  // Handle exits dictionary
  else {
    // Make sure only declared exits are configured.
    var undeclaredExits = _.difference(_.keys(callbacks), _.keys(this.exits));
    if (undeclaredExits.length > 0) {
      throw new Error('One or more callbacks were configured for exits that are not recognized by this machine: `' + undeclaredExits.join(', ') + '`.');
    }
    _.extend(this._configuredExits, callbacks);
  }

  return this;

};

// Alias `setEnvironment()` => `setEnv()`
// @deprecated <<TODO: remove this>>
Machine.prototype.setEnvironment = Machine.prototype.setEnv;

// ========================================================================================
// ========================================================================================
// ========================================================================================



/**
 * @type {Machine.constructor}
 */
module.exports = Machine;
