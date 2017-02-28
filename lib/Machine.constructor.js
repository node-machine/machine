/**
 * Module dependencies
 */

var util = require('util');
var _ = require('@sailshq/lodash');
var flaverr = require('./private/flaverr');
var helpConfigureMachineInstance = require('./private/help-configure-machine-instance');
var buildInspectFn = require('./private/build-inspect-fn');


/**
 * `Machine`
 *
 * Construct a configurable/usable live machine (`Machine`) instance.
 * > This is what you get when you `require('machine')`.
 *
 * ----------------------------------------------------------------------------------------
 * Note that the API for this constructor is private, and it should not be called
 * directly from userland. Instead use the `Machine.build()` static method to construct
 * machine instances.
 * ----------------------------------------------------------------------------------------
 *
 * @optional {Dictionary?} machineDefinition
 *                      • defaults to an anonymous "noop" machine definition which, when
 *                        executed, does nothing beyond calling its success exit.
 *
 * @constructs {LiveMachine}
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
      // always fails. Default max recursive call depth to `DEFAULT_MAX_RECURSION`.
      var DEFAULT_MAX_RECURSION = 250;
      if (recursiveMachineInstance._recursiveDepth > (machineDefinition.maxRecursion||DEFAULT_MAX_RECURSION)) {
        recursiveMachineInstance = self.constructor.build(function (inputs, exits){

          return exits.error(
            flaverr('E_MAX_RECURSION', new Error(
              'This code called itself too many times--exceeding the maximum recursive depth ('+(machineDefinition.maxRecursion||DEFAULT_MAX_RECURSION)+').  '+
              'There is probably an issue in the function\'s implementation (might be missing a base case, etc.)  '+
              'If you are the implementor of this machine/action/helper/etc., and you\'re sure there are no problems, '+
              'you can configure the maximum number of recursive calls for this machine using `maxRecursion` (a top-level '+
              'property in your definition).  The default is '+DEFAULT_MAX_RECURSION+'.'
            ))
          );

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

  // a flag tracking whether or not the machine's fn has "yielded" yet
  this._hasFnYieldedYet = false;

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

    // TODO: probably deprecate this
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

}//</top-lvl module / Machine constructor>




// // ========================================================================================
// // ========================================================================================
// // ========================================================================================
//
// For future reference, the experimental userland type-safety-customization flags:
//
//     this._runTimeTypeCheck = false;
//     this._inputCoercion = false;
//     this._exitCoercion = false;
//     this._unsafeMode = true;
//
// // ========================================================================================
// // ========================================================================================
// // ========================================================================================





//  ███████╗████████╗ █████╗ ████████╗██╗ ██████╗
//  ██╔════╝╚══██╔══╝██╔══██╗╚══██╔══╝██║██╔════╝
//  ███████╗   ██║   ███████║   ██║   ██║██║
//  ╚════██║   ██║   ██╔══██║   ██║   ██║██║
//  ███████║   ██║   ██║  ██║   ██║   ██║╚██████╗
//  ╚══════╝   ╚═╝   ╚═╝  ╚═╝   ╚═╝   ╚═╝ ╚═════╝
//
//  ███╗   ███╗███████╗████████╗██╗  ██╗ ██████╗ ██████╗ ███████╗
//  ████╗ ████║██╔════╝╚══██╔══╝██║  ██║██╔═══██╗██╔══██╗██╔════╝██╗
//  ██╔████╔██║█████╗     ██║   ███████║██║   ██║██║  ██║███████╗╚═╝
//  ██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██║   ██║██║  ██║╚════██║██╗
//  ██║ ╚═╝ ██║███████╗   ██║   ██║  ██║╚██████╔╝██████╔╝███████║╚═╝
//  ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝
//

//  ╔═╗╦ ╦╔╗ ╦  ╦╔═╗  ╔╦╗╔═╗╔╦╗╦ ╦╔═╗╔╦╗╔═╗
//  ╠═╝║ ║╠╩╗║  ║║    ║║║║╣  ║ ╠═╣║ ║ ║║╚═╗
//  ╩  ╚═╝╚═╝╩═╝╩╚═╝  ╩ ╩╚═╝ ╩ ╩ ╩╚═╝═╩╝╚═╝
//  ┌─    ┌─┐┌┐┌  ┌┬┐┬ ┬┌─┐  ┌┬┐┌─┐┌─┐┬ ┬┬┌┐┌┌─┐  ┌─┐┌─┐┌┐┌┌─┐┌┬┐┬─┐┬ ┬┌─┐┌┬┐┌─┐┬─┐    ─┐
//  │───  │ ││││   │ ├─┤├┤   │││├─┤│  ├─┤││││├┤   │  │ ││││└─┐ │ ├┬┘│ ││   │ │ │├┬┘  ───│
//  └─    └─┘┘└┘   ┴ ┴ ┴└─┘  ┴ ┴┴ ┴└─┘┴ ┴┴┘└┘└─┘  └─┘└─┘┘└┘└─┘ ┴ ┴└─└─┘└─┘ ┴ └─┘┴└─    ─┘
// Public (static) methods available on the Machine constructor:
Machine.build = require('./Machine.build');
Machine.pack = require('./Machine.pack');
Machine.getMethodName = require('./Machine.getMethodName');



//  ╔═╗╦═╗╔═╗╔╦╗╔═╗╔═╗╔╦╗╔═╗╔╦╗  ╔╦╗╔═╗╔╦╗╦ ╦╔═╗╔╦╗╔═╗
//  ╠═╝╠╦╝║ ║ ║ ║╣ ║   ║ ║╣  ║║  ║║║║╣  ║ ╠═╣║ ║ ║║╚═╗
//  ╩  ╩╚═╚═╝ ╩ ╚═╝╚═╝ ╩ ╚═╝═╩╝  ╩ ╩╚═╝ ╩ ╩ ╩╚═╝═╩╝╚═╝
//  ┌─    ┌─┐┌┐┌  ┌┬┐┬ ┬┌─┐  ┌┬┐┌─┐┌─┐┬ ┬┬┌┐┌┌─┐  ┌─┐┌─┐┌┐┌┌─┐┌┬┐┬─┐┬ ┬┌─┐┌┬┐┌─┐┬─┐    ─┐
//  │───  │ ││││   │ ├─┤├┤   │││├─┤│  ├─┤││││├┤   │  │ ││││└─┐ │ ├┬┘│ ││   │ │ │├┬┘  ───│
//  └─    └─┘┘└┘   ┴ ┴ ┴└─┘  ┴ ┴┴ ┴└─┘┴ ┴┴┘└┘└─┘  └─┘└─┘┘└┘└─┘ ┴ ┴└─└─┘└─┘ ┴ └─┘┴└─    ─┘
// Protected (static) methods available on the Machine constructor:

/**
 * .inspect()
 *
 * When the Machine constructor is inspected (e.g. `util.inspect()` / `console.log()`),
 * pretty print the current version of node-machine, with license information and a link
 * to the documentation.
 *
 * @return {String}
 * @protected
 */
Machine.inspect = function () {
  return util.format(
    '---------------------------------------------------\n'+
    ' machine   (runtime environment)\n'+
    ' v%s\n'+
    ' \n'+
    ' • License   : %s\n'+
    ' • Package   : http://npmjs.com/package/machine\n'+
    ' • Docs      : %s\n'+
    ' • Questions : http://sailsjs.com/support\n'+
    '---------------------------------------------------\n',
    require('../package.json').version,
    require('../package.json').license,
    require('../package.json').docs && require('../package.json').docs.url
  );
};




//  ██╗███╗   ██╗███████╗████████╗ █████╗ ███╗   ██╗ ██████╗███████╗
//  ██║████╗  ██║██╔════╝╚══██╔══╝██╔══██╗████╗  ██║██╔════╝██╔════╝
//  ██║██╔██╗ ██║███████╗   ██║   ███████║██╔██╗ ██║██║     █████╗
//  ██║██║╚██╗██║╚════██║   ██║   ██╔══██║██║╚██╗██║██║     ██╔══╝
//  ██║██║ ╚████║███████║   ██║   ██║  ██║██║ ╚████║╚██████╗███████╗
//  ╚═╝╚═╝  ╚═══╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝╚══════╝
//
//  ███╗   ███╗███████╗████████╗██╗  ██╗ ██████╗ ██████╗ ███████╗
//  ████╗ ████║██╔════╝╚══██╔══╝██║  ██║██╔═══██╗██╔══██╗██╔════╝██╗
//  ██╔████╔██║█████╗     ██║   ███████║██║   ██║██║  ██║███████╗╚═╝
//  ██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██║   ██║██║  ██║╚════██║██╗
//  ██║ ╚═╝ ██║███████╗   ██║   ██║  ██║╚██████╔╝██████╔╝███████║╚═╝
//  ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝
//

//  ╔═╗╦ ╦╔╗ ╦  ╦╔═╗  ╔╦╗╔═╗╔╦╗╦ ╦╔═╗╔╦╗╔═╗
//  ╠═╝║ ║╠╩╗║  ║║    ║║║║╣  ║ ╠═╣║ ║ ║║╚═╗
//  ╩  ╚═╝╚═╝╩═╝╩╚═╝  ╩ ╩╚═╝ ╩ ╩ ╩╚═╝═╩╝╚═╝
//  ┌─    ┌─┐┌┐┌  ┬  ┬┬  ┬┌─┐  ┌┬┐┌─┐┌─┐┬ ┬┬┌┐┌┌─┐  ┬┌┐┌┌─┐┌┬┐┌─┐┌┐┌┌─┐┌─┐┌─┐    ─┐
//  │───  │ ││││  │  │└┐┌┘├┤   │││├─┤│  ├─┤││││├┤   ││││└─┐ │ ├─┤││││  ├┤ └─┐  ───│
//  └─    └─┘┘└┘  ┴─┘┴ └┘ └─┘  ┴ ┴┴ ┴└─┘┴ ┴┴┘└┘└─┘  ┴┘└┘└─┘ ┴ ┴ ┴┘└┘└─┘└─┘└─┘    ─┘
// Public methods on live machine instances:
Machine.prototype.exec = require('./Machine.prototype.exec');
Machine.prototype.execSync = require('./Machine.prototype.execSync');
Machine.prototype.demuxSync = require('./Machine.prototype.demuxSync');
Machine.prototype.cache = require('./Machine.prototype.cache');


/**
 * setEnv()
 *
 * Fold the specified habitat variables into the `env` that will
 * be passed in as the third argument to the machine `fn`.
 *
 * @required  {Dictionary} envToSet
 * @chainable
 */
Machine.prototype.setEnv = function (envToSet) {
  if (!_.isObject(envToSet) || _.isArray(envToSet) || _.isFunction(envToSet)) {
    throw flaverr('E_USAGE', new Error('Invalid usage: `.setEnv()` expects a dictionary of habitat variables.  But instead got: '+util.inspect(envToSet, {depth: null})));
  }

  // Call helper.
  helpConfigureMachineInstance(this, undefined, undefined, envToSet);

  return this;
};



/**
 * .configure()
 *
 * Configure a live machine instance with argins, callbacks, and/or habitat variables.
 * (This just uses the private `helpConfigureMachineInstance()` under the covers.)
 *
 * @required  {Dictionary?} argins
 * @required  {Dictionary?|Function?} cbs
 * @required  {Dictionary?} envToSet
 *
 * @returns {LiveMachine}
 * @chainable
 */
Machine.prototype.configure = function (argins, cbs, envToSet) {

  // Call helper
  helpConfigureMachineInstance(this, argins, cbs, envToSet);

  // Return self (to make this chainable).
  return this;

};





//  ╔═╗╦═╗╔═╗╔╦╗╔═╗╔═╗╔╦╗╔═╗╔╦╗  ╔╦╗╔═╗╔╦╗╦ ╦╔═╗╔╦╗╔═╗
//  ╠═╝╠╦╝║ ║ ║ ║╣ ║   ║ ║╣  ║║  ║║║║╣  ║ ╠═╣║ ║ ║║╚═╗
//  ╩  ╩╚═╚═╝ ╩ ╚═╝╚═╝ ╩ ╚═╝═╩╝  ╩ ╩╚═╝ ╩ ╩ ╩╚═╝═╩╝╚═╝
//  ┌─    ┌─┐┌┐┌  ┬  ┬┬  ┬┌─┐  ┌┬┐┌─┐┌─┐┬ ┬┬┌┐┌┌─┐  ┬┌┐┌┌─┐┌┬┐┌─┐┌┐┌┌─┐┌─┐┌─┐    ─┐
//  │───  │ ││││  │  │└┐┌┘├┤   │││├─┤│  ├─┤││││├┤   ││││└─┐ │ ├─┤││││  ├┤ └─┐  ───│
//  └─    └─┘┘└┘  ┴─┘┴ └┘ └─┘  ┴ ┴┴ ┴└─┘┴ ┴┴┘└┘└─┘  ┴┘└┘└─┘ ┴ ┴ ┴┘└┘└─┘└─┘└─┘    ─┘
// Protected methods on live machine instances:
//
// > These should not be called in userland code!


/**
 * Machine.prototype._warn()
 *
 * Trigger a warning on this machine.
 * > Use configured `onWarn` function, or by default, use `console.error`.
 *
 * @chainable
 * @private
 *
 * TODO: change this to `_warn()` to make it less tempting to mess w/ in userland
 */
Machine.prototype.warn = function Machine_prototype_warn () {// eslint-disable-line camelcase

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
 * @private
 *
 * TODO: change this to `_log()` to make it less tempting to mess w/ in userland
 */
Machine.prototype.log = function Machine_prototype_log () {// eslint-disable-line camelcase

  (this.onLog||function _defaultLogHandler(/*...*/){
    console.log.apply(console, Array.prototype.slice.call(arguments));
  }).apply(this, Array.prototype.slice.call(arguments));

  return this;
};


/**
 * .inspect()
 *
 * When a live machine instance is inspected (e.g. `util.inspect()` / `console.log()`),
 * pretty print some basic info about the machine's usage.
 *
 * @return {String}
 */
Machine.prototype.inspect = function () {
  var _inspect = buildInspectFn(this);
  return _inspect();
};




//  ███████╗██╗  ██╗██████╗  ██████╗ ███████╗███████╗     ██████╗ ███╗   ██╗
//  ██╔════╝╚██╗██╔╝██╔══██╗██╔═══██╗██╔════╝██╔════╝    ██╔═══██╗████╗  ██║
//  █████╗   ╚███╔╝ ██████╔╝██║   ██║███████╗█████╗      ██║   ██║██╔██╗ ██║
//  ██╔══╝   ██╔██╗ ██╔═══╝ ██║   ██║╚════██║██╔══╝      ██║   ██║██║╚██╗██║
//  ███████╗██╔╝ ██╗██║     ╚██████╔╝███████║███████╗    ╚██████╔╝██║ ╚████║
//  ╚══════╝╚═╝  ╚═╝╚═╝      ╚═════╝ ╚══════╝╚══════╝     ╚═════╝ ╚═╝  ╚═══╝
//
//  ███╗   ███╗ ██████╗ ██████╗ ██╗   ██╗██╗     ███████╗   ███████╗██╗  ██╗██████╗  ██████╗ ██████╗ ████████╗███████╗
//  ████╗ ████║██╔═══██╗██╔══██╗██║   ██║██║     ██╔════╝   ██╔════╝╚██╗██╔╝██╔══██╗██╔═══██╗██╔══██╗╚══██╔══╝██╔════╝
//  ██╔████╔██║██║   ██║██║  ██║██║   ██║██║     █████╗     █████╗   ╚███╔╝ ██████╔╝██║   ██║██████╔╝   ██║   ███████╗
//  ██║╚██╔╝██║██║   ██║██║  ██║██║   ██║██║     ██╔══╝     ██╔══╝   ██╔██╗ ██╔═══╝ ██║   ██║██╔══██╗   ██║   ╚════██║
//  ██║ ╚═╝ ██║╚██████╔╝██████╔╝╚██████╔╝███████╗███████╗██╗███████╗██╔╝ ██╗██║     ╚██████╔╝██║  ██║   ██║   ███████║
//  ╚═╝     ╚═╝ ╚═════╝ ╚═════╝  ╚═════╝ ╚══════╝╚══════╝╚═╝╚══════╝╚═╝  ╚═╝╚═╝      ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝
//

// Expose the Machine constructor.
module.exports = Machine;
