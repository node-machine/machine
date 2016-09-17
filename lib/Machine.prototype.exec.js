/**
 * Module dependencies
 */

var util = require('util');
var Debug = require('debug');
var _ = require('lodash');
var rttc = require('rttc');
var switchback = require('switchback');
var hashArgins = require('./hash-argins');
var interceptExitCallbacks = require('./intercept-exit-callbacks');
var validateConfiguredInputValues = require('./validate-configured-input-values');
var buildLamdaMachine = require('./build-lamda-machine');
var getCombinedErrorStack = require('./get-combined-error-stack');
var removeNonUserlandCallsFromStack = require('./remove-non-userland-calls-from-stack');
var getFilepathFromStackEntry = require('./get-filepath-from-stack-entry');

/**
 * .exec()
 *
 * Run this machine's `fn` and trigger the appropriate exit callback.
 *
 *
 * NOTE:
 * If the machine is synchronous, then an artificial `setTimeout(0)` will be introduced
 * to ensure that the relevant exit callback is called in a subsequent tick of the event
 * loop.
 *
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 *
 * @param? {Dictionary|Function} done
 *         An optional callback function or dictionary of exit-handling callback functions.
 *         If provided, this callback (or set of callbacks) will be folded onto any existing
 *         exit-handling callbacks which were already attached with `.setExits()`.
 *
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 */
module.exports = function Machine_prototype_exec (done) {

  var self = this;

  // Assert that our `_started` spinlock has not already been set.
  // (better to terminate the process than trigger a callback twice)
  if (self._started) { throw new Error('Cannot call `.exec()` twice on the same live machine (machine `'+_.camelCase(self.identity)+'` already started running).  To run a machine multiple times, please configure it each time to get a new instance.'); }

  // Set the _started spinlock so that this live machine cannot be `exec()`d again.
  self._started = true;

  // Get a copy of the stack trace for this invocation of .exec().
  // This will include an error message on the first line,
  // a reference to this file (prototype.exec.js) on the second line,
  // and the module that _called_ .exec() on the third line -- that's
  // what we're after.
  var thisStack = (new Error()).stack.split('\n');

  // Remove the first line (the error message) from the stack track.
  thisStack = thisStack.slice(1);

  // Remove all non-userland calls (i.e. calls from the machine runner or internal to Node).
  thisStack = removeNonUserlandCallsFromStack(thisStack);

  // Ensure that there is a 'debug' dictionary in the environment, with at least a stacks array.
  _.defaultsDeep(self._configuredEnvironment, {debug: {stack: []}});

  // Get the last caller before the current one
  var lastCaller = self._configuredEnvironment.debug.stack.length && _.last(self._configuredEnvironment.debug.stack)[0];

  // If the stack is empty, use the entire contents of thisStack to start us off.
  // This ensures we keep the trace going back to before the first machine
  // was called  (for example the trace into Sails).
  if (self._configuredEnvironment.debug.stack.length === 0) {
    self._configuredEnvironment.debug.stack = _.clone(thisStack).reverse();
  }
  // Otherwise just push the first line of thisStack, since the rest of it
  // (if there is any) will be duplicative.
  else {
    self._configuredEnvironment.debug.stack.push(thisStack[0]);
  }

  // console.log('`' + self.identity + '`.exec stacks:');
  // console.log(self._configuredEnvironment.debug.stack);
  // console.log('-----');

  // If duration-tracking is enabled, track current timestamp
  // as a JavaScript Date instance in `_execBeginTimestamp`.
  if (self._doTrackDuration){
    self._execBeginTimestamp = new Date();
  }


  // If `done` was provided...
  if (done !== undefined) {
    // Do a quick sanity check to make sure it _at least looks like_ a callback function or dictionary of callback functions.
    if (_.isArray(done) || (!_.isFunction(done) && !_.isObject(done))) {
      throw new Error('Invalid usage: If something is passed in to `.exec()`, it must either be:\n'+
      '  (1) a standard Node callback function, or\n'+
      '  (2) a dictionary of per-exit callback functions\n'+
      '\n'+
      'But instead, got:\n'+
      util.inspect({depth: null})+
      '');
    }

    this.setExits(done);
  }//</if :: `done` was provided>


  // >-
  // At this point, if a(ny) callback(s) were provided, we've folded them in.
  //
  // So before continuing, validate that we have an `error` callback of some sort.
  // If it is not, then get crazy and **throw** BEFORE calling the machine's `fn`.
  //
  // (Better to potentially terminate the process than open up the possibility of silently swallowing errors later.)
  if (_.isUndefined(self._configuredExits.error)) {
    var err_noErrorCallbackConfigured = new Error('Invalid usage: Cannot execute machine (`'+self.identity+'`) without providing any catchall error handling (e.g. an `error` callback).');
    err_noErrorCallbackConfigured.code = 'E_NO_ERROR_CALLBACK_CONFIGURED';
    throw err_noErrorCallbackConfigured;
  }
  // Also, as a sanity check, make sure it's a valid callback function and not something else crazy.
  if (!_.isFunction(self._configuredExits.error)) {
    throw new Error('Consistency violation: Cannot execute machine (`'+self.identity+'`) because its configured `error` callback is invalid.  It should be a function, but instead, it\'s:\n'+util.inspect(self._configuredExits.error, {depth: null}));
  }


  // Log debug messages, if relevant.
  (function _writeDebugLogMsgs (){
    var DEBUG_LOG_LINE_LEN = 45;
    var identity = self.identity;
    var paddedIdentity = _.padRight(_.trunc('machine-log:'+identity, {length: DEBUG_LOG_LINE_LEN, omission: ''}), DEBUG_LOG_LINE_LEN);

    Debug('machine:'+self.identity+':exec')('');
    // Debug(paddedIdentity)(' -< '+(self.friendlyName||''));
    Debug(paddedIdentity)(' •- '+(self.friendlyName||''));

  })();//</just logged debug message>
  // --


  // This local variable (`potentiallyCoercedArgins`) is used below to hold a dictionary
  // of argins (runtime input values) that have _potentially_ been coerced to match the expectations
  // of the input definitions of this machine.
  //
  // See `rttc.validate()` for more information about this form of coercion; and about how
  // *loose validation* works in general.
  var potentiallyCoercedArgins;


  //  ██╗   ██╗ █████╗ ██╗     ██╗██████╗  █████╗ ████████╗███████╗
  //  ██║   ██║██╔══██╗██║     ██║██╔══██╗██╔══██╗╚══██╔══╝██╔════╝
  //  ██║   ██║███████║██║     ██║██║  ██║███████║   ██║   █████╗
  //  ╚██╗ ██╔╝██╔══██║██║     ██║██║  ██║██╔══██║   ██║   ██╔══╝
  //   ╚████╔╝ ██║  ██║███████╗██║██████╔╝██║  ██║   ██║   ███████╗
  //    ╚═══╝  ╚═╝  ╚═╝╚══════╝╚═╝╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝
  //
  //     ██╗        ██████╗ ██████╗ ███████╗██████╗  ██████╗███████╗
  //     ██║       ██╔════╝██╔═══██╗██╔════╝██╔══██╗██╔════╝██╔════╝
  //  ████████╗    ██║     ██║   ██║█████╗  ██████╔╝██║     █████╗
  //  ██╔═██╔═╝    ██║     ██║   ██║██╔══╝  ██╔══██╗██║     ██╔══╝
  //  ██████║      ╚██████╗╚██████╔╝███████╗██║  ██║╚██████╗███████╗
  //  ╚═════╝       ╚═════╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝ ╚═════╝╚══════╝
  //
  //   █████╗ ██████╗  ██████╗ ██╗███╗   ██╗███████╗
  //  ██╔══██╗██╔══██╗██╔════╝ ██║████╗  ██║██╔════╝
  //  ███████║██████╔╝██║  ███╗██║██╔██╗ ██║███████╗
  //  ██╔══██║██╔══██╗██║   ██║██║██║╚██╗██║╚════██║
  //  ██║  ██║██║  ██║╚██████╔╝██║██║ ╚████║███████║
  //  ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝╚═╝  ╚═══╝╚══════╝
  //
  // If `unsafeMode` is disabled...
  if (!self._unsafeMode) {

    // Perform loose validation on our argins (runtime input values).
    // This also generates potentially coerced values, which we may or may not actually use
    // (see below for more on that.)
    var looseValidationReport = validateConfiguredInputValues(self);
    potentiallyCoercedArgins = looseValidationReport.values;
    var errors = looseValidationReport.errors;

    // If there are (still) `e.errors` (meaning one or more argins were invalid), then...
    if (errors.length > 0) {

      // If runtime type checking is enabled, then...
      if(self._runTimeTypeCheck) {

        // Build an appropriate runtime validation error.
        var err_machineRuntimeValidation = (function _buildMachineRuntimeValidationErr() {

          // Start with a new Error.
          var err_machineRuntimeValidation = new Error();

          // If there's a stack trace in the environment, it means that somewhere along the way
          // some asynchronous code was run that would cause the natural stack trace to be
          // truncated, so the stack up to that point was saved so we can add it to our stack now
          // and get the full history.
          err_machineRuntimeValidation.stack = getCombinedErrorStack(thisStack, self._configuredEnvironment.debug.stack);

          // Improve the error msg, and then update the stack so it has the message up top (like it OUGHT)
          var bulletPrefixedErrors = _.map(errors, function (rttcValidationErr){ return '  • '+rttcValidationErr.message; });
          var prettyPrintedValidationErrorsStr = bulletPrefixedErrors.join('\n');
          var errMsg = 'Could not run `'+self.identity+'` due to '+errors.length+' '+
          'validation error'+(errors.length>1?'s':'')+':\n'+prettyPrintedValidationErrorsStr;
          err_machineRuntimeValidation.message = errMsg;
          err_machineRuntimeValidation.stack = 'Error: ' + errMsg + '\n' + err_machineRuntimeValidation.stack;

          // Give it that code, so we can negotiate it.  And add a reference to the machine instance,
          // so intermediate tooling like machine-as-action can tell which validation error is which.
          // And finally, provide a reference to the raw RTTC validation errors for userland analysis.
          err_machineRuntimeValidation.code = 'E_MACHINE_RUNTIME_VALIDATION';
          err_machineRuntimeValidation.machineInstance = self;
          err_machineRuntimeValidation.errors = errors;

          return err_machineRuntimeValidation;

        })();//</self-calling function :: built a E_MACHINE_RUNTIME_VALIDATON error>
        // --

        // Build a switchback from the configured exits.
        // Fourth argument (`true`) means that the switchback will be built to run **synchronously.**
        var sb = switchback(self._configuredExits, undefined, undefined, true);

        // Trigger the callback with an error.
        sb(err_machineRuntimeValidation);
        return self;

      }//</if :: self._runTimeTypeCheck>

    }//<if :: any argins (runtime input values) are invalid>

  }//</if :: NOT in "unsafe" mode>

  // --•
  // If the `_inputCoercion` flag is enabled, configure this live machine instance
  // with the newly coerced argins.
  if (self._inputCoercion) {
    self.setInputs(potentiallyCoercedArgins);
  }


  //   █████╗ ██████╗ ██████╗ ██╗  ██╗   ██╗
  //  ██╔══██╗██╔══██╗██╔══██╗██║  ╚██╗ ██╔╝
  //  ███████║██████╔╝██████╔╝██║   ╚████╔╝
  //  ██╔══██║██╔═══╝ ██╔═══╝ ██║    ╚██╔╝
  //  ██║  ██║██║     ██║     ███████╗██║
  //  ╚═╝  ╚═╝╚═╝     ╚═╝     ╚══════╝╚═╝
  //
  //  ██████╗ ███████╗███████╗ █████╗ ██╗   ██╗██╗  ████████╗███████╗████████╗ ██████╗
  //  ██╔══██╗██╔════╝██╔════╝██╔══██╗██║   ██║██║  ╚══██╔══╝██╔════╝╚══██╔══╝██╔═══██╗
  //  ██║  ██║█████╗  █████╗  ███████║██║   ██║██║     ██║   ███████╗   ██║   ██║   ██║
  //  ██║  ██║██╔══╝  ██╔══╝  ██╔══██║██║   ██║██║     ██║   ╚════██║   ██║   ██║   ██║
  //  ██████╔╝███████╗██║     ██║  ██║╚██████╔╝███████╗██║   ███████║   ██║   ╚██████╔╝
  //  ╚═════╝ ╚══════╝╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝   ╚══════╝   ╚═╝    ╚═════╝
  //
  //  ████████╗ ██████╗      █████╗ ██████╗  ██████╗ ██╗███╗   ██╗███████╗
  //  ╚══██╔══╝██╔═══██╗    ██╔══██╗██╔══██╗██╔════╝ ██║████╗  ██║██╔════╝
  //     ██║   ██║   ██║    ███████║██████╔╝██║  ███╗██║██╔██╗ ██║███████╗
  //     ██║   ██║   ██║    ██╔══██║██╔══██╗██║   ██║██║██║╚██╗██║╚════██║
  //     ██║   ╚██████╔╝    ██║  ██║██║  ██║╚██████╔╝██║██║ ╚████║███████║
  //     ╚═╝    ╚═════╝     ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝╚═╝  ╚═══╝╚══════╝
  //
  // Apply `defaultsTo` for input defs that use it.
  // TODO: consider whether `defaultsTo` values should be automatically validated/coerced too (that would need to go in Machine.build)
  _.each(self.inputs, function (inputDef, inputCodeName){

    // If there is no `defaultsTo` value, we obviously can't use it.
    if (inputDef.defaultsTo === undefined) {
      return;
    }

    // --•
    // Don't use the `defaultsTo` value if an argin was provided for this input.
    if (self._configuredInputs[inputCodeName] !== undefined) {
      return;
    }

    // --• Use the `defaultsTo` value as the runtime value (argin) for this input.
    self._configuredInputs[inputCodeName] = inputDef.defaultsTo;
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // Note that this ^^ is currently using a direct reference.
    // TODO: Consider deep cloning the default value first to help prevent userland bugs due to
    // entanglement.  Cloning would only occur the input's example does not contain any `===`s
    // or `->`s. (Easiest way to do that is with rttc.dehyrate().) Anyway, regardless of _how_
    // this is implemented, it would need to be configurable.
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    // If this is a contract input, then attempt to build a submachine out of the provided `defaultsTo` function.
    if (!_.isUndefined(inputDef.contract) && (rttc.infer(inputDef.example) === 'lamda')) {
      try {
        // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
        // Note:
        // Currently (see TODO above for "why currently") we build machines out of default lamda input values
        // that specify a contract here.
        //
        // Otherwise the default functions would never get built into machine instances, because we're not actually
        // calling rttc.validate() on `defaultsTo` values in general.
        // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

        // If lamda input def specifies a `defaultsTo`, and no input value was provided, go ahead
        // and instantiate the default function into a machine using the contract.
        self._configuredInputs[inputCodeName] = buildLamdaMachine(inputDef.defaultsTo, inputCodeName, self, self._rootMachine||self);
      } catch (e) {
        var err_couldNotBuildSubmachineForDefaultVal = new Error(
          'Could not execute machine (`'+self.identity+'`).  '+
          'This machine definition specifies a `defaultsTo` for a contract input (`'+inputCodeName+'`), '+
          'but that `defaultsTo` function could not be built into a submachine using the provided `contract`.  '+
          'Please check that the `contract` dictionary and `defaultsTo` function are valid.\n'+
          'Error details:\n'+e.stack
        );
        err_couldNotBuildSubmachineForDefaultVal.input = inputCodeName;
        throw err_couldNotBuildSubmachineForDefaultVal; // << TODO: pull this `throw` into Machine.build() so it happens as early as possible
      }
    }//</if this input has a contract and `example: '->'`>
  });//</_.each() :: input definition>




  //   █████╗ ██████╗ ███████╗ ██████╗ ██████╗ ██████╗      ██████╗ █████╗  ██████╗██╗  ██╗███████╗
  //  ██╔══██╗██╔══██╗██╔════╝██╔═══██╗██╔══██╗██╔══██╗    ██╔════╝██╔══██╗██╔════╝██║  ██║██╔════╝
  //  ███████║██████╔╝███████╗██║   ██║██████╔╝██████╔╝    ██║     ███████║██║     ███████║█████╗
  //  ██╔══██║██╔══██╗╚════██║██║   ██║██╔══██╗██╔══██╗    ██║     ██╔══██║██║     ██╔══██║██╔══╝
  //  ██║  ██║██████╔╝███████║╚██████╔╝██║  ██║██████╔╝    ╚██████╗██║  ██║╚██████╗██║  ██║███████╗
  //  ╚═╝  ╚═╝╚═════╝ ╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚═════╝      ╚═════╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚══════╝
  //
  //  ███████╗███████╗████████╗████████╗██╗███╗   ██╗ ██████╗ ███████╗
  //  ██╔════╝██╔════╝╚══██╔══╝╚══██╔══╝██║████╗  ██║██╔════╝ ██╔════╝
  //  ███████╗█████╗     ██║      ██║   ██║██╔██╗ ██║██║  ███╗███████╗
  //  ╚════██║██╔══╝     ██║      ██║   ██║██║╚██╗██║██║   ██║╚════██║
  //  ███████║███████╗   ██║      ██║   ██║██║ ╚████║╚██████╔╝███████║
  //  ╚══════╝╚══════╝   ╚═╝      ╚═╝   ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚══════╝
  //
  // For convenience, set up a couple of local variables for use below:
  //
  //  • `cacheSettings` - the configured cache settings for this machine
  var _cache = this._cacheSettings;
  //
  //  • `Cache` - the configured cache model to use (a Waterline model)
  //              (if not relevant, will be left as `undefined`)
  var Cache;


  // Validate cache settings.
  var areCacheSettingsValid =
    _.isObject(_cache) &&
    _.isObject(_cache.model) &&
    _.isFunction(_cache.model.find) &&
    _.isFunction(_cache.model.create) &&
    _.isFunction(_cache.model.destroy) &&
    _.isFunction(_cache.model.count);

  // If a cache model was supplied, but it is not valid, then emit a warning.
  if (!_.isUndefined(_cache.model) && !areCacheSettingsValid) {
    self.warn(new Error('Invalid cache settings: If `.cache()` is in use, then `model` must be provided as a Waterline model.  For example: `.cache({ model: TweetSearchResultsCache })`.  Proceeding to execute this machine, but skipping all cache reads and writes...'));
  }


  // If cache settings are NOT valid, then set `_cache`
  // to `false` & leave `Cache` undefined.
  if (!areCacheSettingsValid) {
    _cache = false;
  }
  // ‡ Otherwise cache settings ARE valid.  So we'll use them.
  else {

    // Fold in default cache settings.
    _.defaults(_cache, {

      // Default TTL (i.e. "max age") is 3 hours
      ttl: 3 * 60 * 60 * 1000,

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
      maxOldEntriesBuffer: 0,

      // By default, the default (or "success") exit is cached
      exit: 'success'

    });

    // Set local variable as a reference to the cache model for convenience.
    Cache = _cache.model;

    // Pre-calculate the expiration date so we only do it once
    // (and also so it uses a consistent timestamp since the code
    //  below is asynchronous)
    _cache.expirationDate = new Date( (new Date()) - _cache.ttl);

  }//</else :: cache settings are valid>



  //  ██╗      ██████╗  ██████╗ ██╗  ██╗    ██╗   ██╗██████╗     ██████╗ ███████╗███████╗██╗   ██╗██╗  ████████╗
  //  ██║     ██╔═══██╗██╔═══██╗██║ ██╔╝    ██║   ██║██╔══██╗    ██╔══██╗██╔════╝██╔════╝██║   ██║██║  ╚══██╔══╝
  //  ██║     ██║   ██║██║   ██║█████╔╝     ██║   ██║██████╔╝    ██████╔╝█████╗  ███████╗██║   ██║██║     ██║
  //  ██║     ██║   ██║██║   ██║██╔═██╗     ██║   ██║██╔═══╝     ██╔══██╗██╔══╝  ╚════██║██║   ██║██║     ██║
  //  ███████╗╚██████╔╝╚██████╔╝██║  ██╗    ╚██████╔╝██║         ██║  ██║███████╗███████║╚██████╔╝███████╗██║
  //  ╚══════╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═╝     ╚═════╝ ╚═╝         ╚═╝  ╚═╝╚══════╝╚══════╝ ╚═════╝ ╚══════╝╚═╝
  //
  //  ██╗███╗   ██╗     ██████╗ █████╗  ██████╗██╗  ██╗███████╗
  //  ██║████╗  ██║    ██╔════╝██╔══██╗██╔════╝██║  ██║██╔════╝
  //  ██║██╔██╗ ██║    ██║     ███████║██║     ███████║█████╗
  //  ██║██║╚██╗██║    ██║     ██╔══██║██║     ██╔══██║██╔══╝
  //  ██║██║ ╚████║    ╚██████╗██║  ██║╚██████╗██║  ██║███████╗
  //  ╚═╝╚═╝  ╚═══╝     ╚═════╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚══════╝
  //
  //   ██╗██╗███████╗    ██████╗ ███████╗██╗     ███████╗██╗   ██╗ █████╗ ███╗   ██╗████████╗██╗
  //  ██╔╝██║██╔════╝    ██╔══██╗██╔════╝██║     ██╔════╝██║   ██║██╔══██╗████╗  ██║╚══██╔══╝╚██╗
  //  ██║ ██║█████╗      ██████╔╝█████╗  ██║     █████╗  ██║   ██║███████║██╔██╗ ██║   ██║    ██║
  //  ██║ ██║██╔══╝      ██╔══██╗██╔══╝  ██║     ██╔══╝  ╚██╗ ██╔╝██╔══██║██║╚██╗██║   ██║    ██║
  //  ╚██╗██║██║         ██║  ██║███████╗███████╗███████╗ ╚████╔╝ ██║  ██║██║ ╚████║   ██║   ██╔╝
  //   ╚═╝╚═╝╚═╝         ╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝  ╚═══╝  ╚═╝  ╚═╝╚═╝  ╚═══╝   ╚═╝   ╚═╝
  //
  // Below, we'll use a hash function to create a unique hash (aka checksum) for every distinct set
  // of argins.  We'll store this in this local variable (`hash`).
  //
  // > Note that these hashes do not include the machine identity; meaning they are l-unique
  // > _per machine._  So the hash representing `{a:1,b:1}` is the same, whether you're passing
  // > those argins in to `.multiply()` or `.subtract()`.
  var hash;


  // Now attempt a cache lookup, if configured to do so, then run the machine.
  (function _doCacheLookupMaybe (cb) {
    if (!_cache) { return cb(); }

    // Run hash function to calculate appropriate `hash` for these argins.
    try {
      hash = hashArgins(self);
    } catch (e) {
      // Cache lookup encountered fatal error
      // (could not calculate unique hash for configured input values)
      return cb(e);
    }

    try {

      // Now call `.find()` on the provided Cache model in order to look up the cached return value
      // for the hash representing this particular set of argins.
      Cache.find({
        where: {
          createdAt: { '>': _cache.expirationDate },
          hash: hash
        },
        sort: 'createdAt DESC',
        limit: 1
      })
      .exec(function (err, cached) {
        if (err) { return cb(err); }

        // --• If this was a cache hit...
        if (cached.length && typeof cached[0].data !== 'undefined') {

          var newestCacheEntry = cached[0];
          // Fourth argument (`true`) tells switchback to run synchronously
          return switchback(self._configuredExits, undefined, undefined, true)(null, newestCacheEntry.data);
        }

        // --• If this was a cache miss...
        return cb();

      });//</Cache.find() :: finding records in cache model>
    } catch (e) {
      return cb(new Error('Consistency violation: Unexpected error when attempting to communicate with the cache via the provided model.  Error details: '+e.stack+'\n- - - - - - - - - - - - - - - - - - - - - - - '));
    }
  })(function afterwards(err){
    if (err) {
      // If cache lookup encounters a fatal error, emit a warning
      // but continue (i.e. we fall back to running the machine normally, without trying to mess w/ the cache.)
      self.warn(err);
    }

    // >-
    //
    //  ██╗    ██╗██╗██████╗ ███████╗    ███████╗██╗  ██╗██████╗ ██╗██████╗ ███████╗██████╗
    //  ██║    ██║██║██╔══██╗██╔════╝    ██╔════╝╚██╗██╔╝██╔══██╗██║██╔══██╗██╔════╝██╔══██╗
    //  ██║ █╗ ██║██║██████╔╝█████╗      █████╗   ╚███╔╝ ██████╔╝██║██████╔╝█████╗  ██║  ██║
    //  ██║███╗██║██║██╔═══╝ ██╔══╝      ██╔══╝   ██╔██╗ ██╔═══╝ ██║██╔══██╗██╔══╝  ██║  ██║
    //  ╚███╔███╔╝██║██║     ███████╗    ███████╗██╔╝ ██╗██║     ██║██║  ██║███████╗██████╔╝
    //   ╚══╝╚══╝ ╚═╝╚═╝     ╚══════╝    ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝╚═════╝
    //
    //  ██████╗ ███████╗ ██████╗ ██████╗ ██████╗ ██████╗ ███████╗    ███████╗██████╗  ██████╗ ███╗   ███╗
    //  ██╔══██╗██╔════╝██╔════╝██╔═══██╗██╔══██╗██╔══██╗██╔════╝    ██╔════╝██╔══██╗██╔═══██╗████╗ ████║
    //  ██████╔╝█████╗  ██║     ██║   ██║██████╔╝██║  ██║███████╗    █████╗  ██████╔╝██║   ██║██╔████╔██║
    //  ██╔══██╗██╔══╝  ██║     ██║   ██║██╔══██╗██║  ██║╚════██║    ██╔══╝  ██╔══██╗██║   ██║██║╚██╔╝██║
    //  ██║  ██║███████╗╚██████╗╚██████╔╝██║  ██║██████╔╝███████║    ██║     ██║  ██║╚██████╔╝██║ ╚═╝ ██║
    //  ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚═════╝ ╚══════╝    ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝
    //
    //   ██████╗ █████╗  ██████╗██╗  ██╗███████╗
    //  ██╔════╝██╔══██╗██╔════╝██║  ██║██╔════╝
    //  ██║     ███████║██║     ███████║█████╗
    //  ██║     ██╔══██║██║     ██╔══██║██╔══╝
    //  ╚██████╗██║  ██║╚██████╗██║  ██║███████╗
    //   ╚═════╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚══════╝
    //
    //   ██╗██╗███████╗    ██████╗ ███████╗██╗     ███████╗██╗   ██╗ █████╗ ███╗   ██╗████████╗██╗
    //  ██╔╝██║██╔════╝    ██╔══██╗██╔════╝██║     ██╔════╝██║   ██║██╔══██╗████╗  ██║╚══██╔══╝╚██╗
    //  ██║ ██║█████╗      ██████╔╝█████╗  ██║     █████╗  ██║   ██║███████║██╔██╗ ██║   ██║    ██║
    //  ██║ ██║██╔══╝      ██╔══██╗██╔══╝  ██║     ██╔══╝  ╚██╗ ██╔╝██╔══██║██║╚██╗██║   ██║    ██║
    //  ╚██╗██║██║         ██║  ██║███████╗███████╗███████╗ ╚████╔╝ ██║  ██║██║ ╚████║   ██║   ██╔╝
    //   ╚═╝╚═╝╚═╝         ╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝  ╚═══╝  ╚═╝  ╚═╝╚═╝  ╚═══╝   ╚═╝   ╚═╝
    //
    // Perform garbage collection on cache, if necessary.
    //
    // > Old cache entries are garbage collected every time a cache miss occurs.
    // >
    // > If `> maxOldEntriesBuffer` matching cache records exist, then
    // > it's time to clean up.  Go ahead and delete all the old unused
    // > cache entries except the newest one.
    // >
    // > Note that we don't need to wait for garbage collection to run the
    // > machine. That happens below.
    if (_cache) {

      try {
        Cache.count({
          where: {
            createdAt: {
              '<=': _cache.expirationDate
            },
            hash: hash
          }
        }).exec(function (err, numOldCacheEntries){
          if (err) {
            // If this garbage collection diagnostic query encounters a fatal error,
            // emit a warning and don't try to proceed with garbage collection.
            // (That's because the rest of the code isn't waiting on this!!)
            self.warn(err);
            return;
          }

          try {

            // --•
            // If there aren't enough expired cache entries for this hash to warrant a wipe, just bail.
            if (numOldCacheEntries <= _cache.maxOldEntriesBuffer) {
              return;
            }


            // --•
            // Otherwise, there are enough expired cache records for this exact set of argins
            // to warrant a wipe.  So destroy all expired cache records with this hash.
            Cache.destroy({
              where: {
                createdAt: {
                  '<=': _cache.expirationDate
                },
                hash: hash
              },
              sort: 'createdAt DESC',
              skip: _cache.maxOldEntriesBuffer
            }).exec(function (err, oldCacheEntries) {
              if (err) {
                // If garbage collection encounters a fatal error, emit a warning
                // and then don't do anything else as far as garbage collection of
                // expired cache entries (remember, the rest of the code isn't waiting
                // on this!)
                self.warn(err);
                return;
              }

              // --•
              // Sucessfully wiped all expired cache records for this exact set of argins!

            });//</.destroy() :: destroying expired cache records for this exact set of argins>
          } catch (e) { self.warn(new Error('Consistency violation: Unexpected error when attempting to communicate with the cache via the provided model.  Error details: '+e.stack+'\n- - - - - - - - - - - - - - - - - - - - - - - ')); }
        });//</.count() :: counting expired cache records for this exact set of argins (to see if it's worth it to wipe them)>
      } catch (e) { self.warn(new Error('Consistency violation: Unexpected error when attempting to communicate with the cache via the provided model.  Error details: '+e.stack+'\n- - - - - - - - - - - - - - - - - - - - - - - ')); }
    }//</if `_cache` is truthy, then we just started destroying expired cache entries>

    // _∏_




    //  ██████╗ ██╗   ██╗██╗██╗     ██████╗     ███████╗██╗    ██╗██████╗ ██╗███╗   ██╗ ██████╗
    //  ██╔══██╗██║   ██║██║██║     ██╔══██╗    ██╔════╝██║    ██║██╔══██╗██║████╗  ██║██╔════╝
    //  ██████╔╝██║   ██║██║██║     ██║  ██║    █████╗  ██║ █╗ ██║██║  ██║██║██╔██╗ ██║██║  ███╗
    //  ██╔══██╗██║   ██║██║██║     ██║  ██║    ██╔══╝  ██║███╗██║██║  ██║██║██║╚██╗██║██║   ██║
    //  ██████╔╝╚██████╔╝██║███████╗██████╔╝    ██║     ╚███╔███╔╝██████╔╝██║██║ ╚████║╚██████╔╝
    //  ╚═════╝  ╚═════╝ ╚═╝╚══════╝╚═════╝     ╚═╝      ╚══╝╚══╝ ╚═════╝ ╚═╝╚═╝  ╚═══╝ ╚═════╝
    //
    //   ██████╗ █████╗ ██╗     ██╗     ██████╗  █████╗  ██████╗██╗  ██╗███████╗    ███████╗ ██████╗ ██████╗
    //  ██╔════╝██╔══██╗██║     ██║     ██╔══██╗██╔══██╗██╔════╝██║ ██╔╝██╔════╝    ██╔════╝██╔═══██╗██╔══██╗
    //  ██║     ███████║██║     ██║     ██████╔╝███████║██║     █████╔╝ ███████╗    █████╗  ██║   ██║██████╔╝
    //  ██║     ██╔══██║██║     ██║     ██╔══██╗██╔══██║██║     ██╔═██╗ ╚════██║    ██╔══╝  ██║   ██║██╔══██╗
    //  ╚██████╗██║  ██║███████╗███████╗██████╔╝██║  ██║╚██████╗██║  ██╗███████║    ██║     ╚██████╔╝██║  ██║
    //   ╚═════╝╚═╝  ╚═╝╚══════╝╚══════╝╚═════╝ ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚══════╝    ╚═╝      ╚═════╝ ╚═╝  ╚═╝
    //
    //  ███╗   ███╗██╗███████╗ ██████╗    ███████╗██╗  ██╗██╗████████╗███████╗
    //  ████╗ ████║██║██╔════╝██╔════╝    ██╔════╝╚██╗██╔╝██║╚══██╔══╝██╔════╝
    //  ██╔████╔██║██║███████╗██║         █████╗   ╚███╔╝ ██║   ██║   ███████╗
    //  ██║╚██╔╝██║██║╚════██║██║         ██╔══╝   ██╔██╗ ██║   ██║   ╚════██║
    //  ██║ ╚═╝ ██║██║███████║╚██████╗    ███████╗██╔╝ ██╗██║   ██║   ███████║▄█╗
    //  ╚═╝     ╚═╝╚═╝╚══════╝ ╚═════╝    ╚══════╝╚═╝  ╚═╝╚═╝   ╚═╝   ╚══════╝╚═╝
    //
    //     ██╗       ██████╗ ██████╗ ██╗   ██╗███╗   ██╗███████╗
    //     ██║       ██╔══██╗██╔══██╗██║   ██║████╗  ██║██╔════╝
    //  ████████╗    ██████╔╝██████╔╝██║   ██║██╔██╗ ██║█████╗
    //  ██╔═██╔═╝    ██╔═══╝ ██╔══██╗██║   ██║██║╚██╗██║██╔══╝
    //  ██████║      ██║     ██║  ██║╚██████╔╝██║ ╚████║███████╗▄█╗
    //  ╚═════╝      ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝╚═╝
    //
    //     ██╗       ██╗███╗   ██╗████████╗███████╗██████╗  ██████╗███████╗██████╗ ████████╗
    //     ██║       ██║████╗  ██║╚══██╔══╝██╔════╝██╔══██╗██╔════╝██╔════╝██╔══██╗╚══██╔══╝
    //  ████████╗    ██║██╔██╗ ██║   ██║   █████╗  ██████╔╝██║     █████╗  ██████╔╝   ██║
    //  ██╔═██╔═╝    ██║██║╚██╗██║   ██║   ██╔══╝  ██╔══██╗██║     ██╔══╝  ██╔═══╝    ██║
    //  ██████║      ██║██║ ╚████║   ██║   ███████╗██║  ██║╚██████╗███████╗██║        ██║
    //  ╚═════╝      ╚═╝╚═╝  ╚═══╝   ╚═╝   ╚══════╝╚═╝  ╚═╝ ╚═════╝╚══════╝╚═╝        ╚═╝
    //

    // Before proceeding, ensure error exit is still configured w/ a callback.
    // If it is not, then get crazy and **throw** BEFORE calling the machine's `fn`.
    //
    // This is just yet another failsafe-- better to potentially terminate the process than
    // open up the possibility of silently swallowing errors later.
    if (!self._configuredExits.error){
      throw new Error('Consistency violation: Cannot execute machine (`'+self.identity+'`) without providing any catchall error handling (e.g. an `error` callback).');
    }

    // Then prune any configured exit callbacks that have `undefined` on the RHS.
    _.each(_.keys(self._configuredExits), function (exitCodeName) {
      if (self._configuredExits[exitCodeName] === undefined) {
        delete self._configuredExits[exitCodeName];
      }
    });//</_.each() :: each key in dictionary of configured exit callbacks>


    // Now, fill in anonymous forwarding callbacks for any unhandled exits (ignoring the default `success` and `error` exits)
    // and have them redirect to the `error` (i.e. catchall) exit
    _.each(_.keys(self.exits), function (exitCodeName) {

      // Skip default exit and error exit (they're already accounted for.)
      if (exitCodeName === 'success' || exitCodeName === 'error') {
        return;
      }

      // If this exit is handled then we're good.
      if (self._configuredExits[exitCodeName]) {
        return;
      }

      // --•
      // Otherwise, the exit is unhandled.

      // Build a callback function for this exit.
      // When/if it is run, this dynamically-generated callback will:
      //  • generate an Error instance with a useful message
      //  • trigger the callback configured for the `error` exit (and pass in its new Error as the first argument)
      self._configuredExits[exitCodeName] = function __triggeredMiscExit(_resultPassedInByMachineFn){

        // Start building the error message.
        var errMsg = '`'+_.camelCase(self.identity)+'` triggered its `'+exitCodeName+'` exit';

        // If no result was passed in to the exit, append the exit description if available.
        if (_.isUndefined(_resultPassedInByMachineFn)) {
          // Use the description, if one was provided.
          var exitDef = self.exits[exitCodeName];
          if (!_.isObject(exitDef)) { throw new Error('Consistency violation: Live machine instance ('+self.identity+') has become corrupted!  One of its exits (`'+exitCodeName+'`) has gone missing _while the machine was being run_!'); }
          if (exitDef.description) {
            errMsg += ': '+self.exits[exitCodeName].description;
          }
        }
        // If an Error was passed in to the exit, append its message
        else if (_.isError(_resultPassedInByMachineFn)) {
          errMsg += ': '+_resultPassedInByMachineFn.message;
        }
        // If a non-Error was passed in to the exit, inspect and append it
        else if (!_.isError(_resultPassedInByMachineFn)) {
          errMsg += ' with: \n\n' + util.inspect(_resultPassedInByMachineFn, {depth: null});
        }

        // Start with a new Error.
        var err_forwarding = new Error();

          // If there's a stack trace in the environment, it means that somewhere along the way
          // some asynchronous code was run that would cause the natural stack trace to be
          // truncated, so the stack up to that point was saved so we can add it to our stack now
          // and get the full history.
        err_forwarding.stack = getCombinedErrorStack(thisStack, self._configuredEnvironment.debug.stack);
        err_forwarding.stackModified = true;

        // Copy our error message
        err_forwarding.message = errMsg;
        err_forwarding.stack = 'Error: ' + errMsg + '\n' + err_forwarding.stack;
        err_forwarding.exit = exitCodeName;
        err_forwarding.code = exitCodeName;

        // If a result was passed in, stuff it in the generated Error instance
        // as the `output` property.
        if (!_.isUndefined(_resultPassedInByMachineFn)) {
          err_forwarding.output = _resultPassedInByMachineFn;
        }

        // Trigger configured error callback on `_configuredExits` - (which is already a switchback...
        // ...so this should work even if no error callback was explicitly configured...
        // ...but in case it doesn't, we already threw above if no error exit exists)
        // - using our new Error instance as the argument.
        self._configuredExits.error(err_forwarding);

      };//</built dynamic callback that forwards to `error`>

    });//</_.each() :: exit definition>


    // Intercept our configured exit callbacks in order to implement type coercion of runtime output.
    // This also takes care of some logging functionality, and if relevant, ensures at least one tick
    // has elapsed. Etcetera.
    var interceptedExitCbs = interceptExitCallbacks(self._configuredExits, _cache, hash, self);

    // Now it's almost time to run the machine fn.
    // > Use a try/catch to protect against any unexpected errors.
    try {

      //  ██████╗ ██╗   ██╗██╗██╗     ██████╗
      //  ██╔══██╗██║   ██║██║██║     ██╔══██╗
      //  ██████╔╝██║   ██║██║██║     ██║  ██║
      //  ██╔══██╗██║   ██║██║██║     ██║  ██║
      //  ██████╔╝╚██████╔╝██║███████╗██████╔╝
      //  ╚═════╝  ╚═════╝ ╚═╝╚══════╝╚═════╝
      //
      //  ██╗███╗   ███╗██████╗ ██╗     ███████╗███╗   ███╗███████╗███╗   ██╗████████╗ ██████╗ ██████╗
      //  ██║████╗ ████║██╔══██╗██║     ██╔════╝████╗ ████║██╔════╝████╗  ██║╚══██╔══╝██╔═══██╗██╔══██╗
      //  ██║██╔████╔██║██████╔╝██║     █████╗  ██╔████╔██║█████╗  ██╔██╗ ██║   ██║   ██║   ██║██████╔╝
      //  ██║██║╚██╔╝██║██╔═══╝ ██║     ██╔══╝  ██║╚██╔╝██║██╔══╝  ██║╚██╗██║   ██║   ██║   ██║██╔══██╗
      //  ██║██║ ╚═╝ ██║██║     ███████╗███████╗██║ ╚═╝ ██║███████╗██║ ╚████║   ██║   ╚██████╔╝██║  ██║
      //  ╚═╝╚═╝     ╚═╝╚═╝     ╚══════╝╚══════╝╚═╝     ╚═╝╚══════╝╚═╝  ╚═══╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝
      //
      //  ███████╗██╗    ██╗██╗████████╗ ██████╗██╗  ██╗██████╗  █████╗  ██████╗██╗  ██╗
      //  ██╔════╝██║    ██║██║╚══██╔══╝██╔════╝██║  ██║██╔══██╗██╔══██╗██╔════╝██║ ██╔╝
      //  ███████╗██║ █╗ ██║██║   ██║   ██║     ███████║██████╔╝███████║██║     █████╔╝
      //  ╚════██║██║███╗██║██║   ██║   ██║     ██╔══██║██╔══██╗██╔══██║██║     ██╔═██╗
      //  ███████║╚███╔███╔╝██║   ██║   ╚██████╗██║  ██║██████╔╝██║  ██║╚██████╗██║  ██╗
      //  ╚══════╝ ╚══╝╚══╝ ╚═╝   ╚═╝    ╚═════╝╚═╝  ╚═╝╚═════╝ ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝
      //
      // We'll create the ***implementor*** switchback.
      // (fourth argument (`true`) tells the switchback to run synchronously)
      var implementorSwitchback = switchback(interceptedExitCbs, undefined, undefined, true);


      //  ███████╗███████╗████████╗    ████████╗██╗███╗   ███╗███████╗ ██████╗ ██╗   ██╗████████╗
      //  ██╔════╝██╔════╝╚══██╔══╝    ╚══██╔══╝██║████╗ ████║██╔════╝██╔═══██╗██║   ██║╚══██╔══╝
      //  ███████╗█████╗     ██║          ██║   ██║██╔████╔██║█████╗  ██║   ██║██║   ██║   ██║
      //  ╚════██║██╔══╝     ██║          ██║   ██║██║╚██╔╝██║██╔══╝  ██║   ██║██║   ██║   ██║
      //  ███████║███████╗   ██║          ██║   ██║██║ ╚═╝ ██║███████╗╚██████╔╝╚██████╔╝   ██║
      //  ╚══════╝╚══════╝   ╚═╝          ╚═╝   ╚═╝╚═╝     ╚═╝╚══════╝ ╚═════╝  ╚═════╝    ╚═╝
      //
      //   █████╗ ██╗      █████╗ ██████╗ ███╗   ███╗
      //  ██╔══██╗██║     ██╔══██╗██╔══██╗████╗ ████║
      //  ███████║██║     ███████║██████╔╝██╔████╔██║
      //  ██╔══██║██║     ██╔══██║██╔══██╗██║╚██╔╝██║
      //  ██║  ██║███████╗██║  ██║██║  ██║██║ ╚═╝ ██║
      //  ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝
      //
      // Before calling function, set up a `setTimeout` function that will fire
      // when the runtime duration exceeds the configured `timeout` property.
      // If `timeout` is falsey or <0, then we ignore it.
      if (self._doTrackDuration && self.timeout && self.timeout > 0){

        if (self._timeoutAlarm) { throw new Error('Consistency violation: `_timeoutAlarm` should never already exist on a machine instance before it is run.  Perhaps you called `.exec()` more than once?  If so, please fix and try again.'); }

        self._timeoutAlarm = setTimeout(function __machineTimedOut(){

          // Assert that our `_exited` spinlock has not already been set.
          // (better to terminate the process than trigger a callback twice)
          if (self._exited) { throw new Error('Consistency violation: the timeout alarm was triggered when `_exited` was already set.'); }

          var err = new Error(
          'This machine took too long to execute (timeout of '+self.timeout+'ms exceeded.)  '+
          'There is probably an issue in the machine\'s implementation (might have forgotten to call `exits.success()`, etc.)  '+
          'If you are the implementor of this machine, and you\'re sure there are no problems, you can configure '+
          'the maximum expected number of miliseconds for this machine using `timeout` (a top-level property in '+
          'your machine definition).  To disable this protection, set `timeout` to 0.');
          err.code = 'E_MACHINE_TIMEOUT';

          err.stack = getCombinedErrorStack(thisStack, self._configuredEnvironment.debug.stack);
          err.stackModified = true;

          // Trigger callback
          implementorSwitchback.error(err);

          // Then immediately set the `_timedOut` flag so when/if `fn` calls its exits,
          // we won't trigger the relevant callback (since we've already triggered `error`).
          self._timedOut = true;

        }, self.timeout);//</set timeout alarm>

        // _∏_

      }//</if not tracking duration, or `timeout` is not set, or is less than zero for some reason>


      // >-
      // For sanity, do one last assertion to make sure `fn` is valid.
      if (!_.isFunction(self.fn)) {
        throw new Error(''+
          'Consistency violation: Live machine instance ('+self.identity+') has become corrupted!\n'+
          'Its `fn` property is no longer a function-- instead it\'s a '+rttc.getDisplayType(self.fn)+':\n'+
          util.inspect(self.fn, {depth: null})+
        '');
      }

      // --•


      //   █████╗  ██████╗████████╗██╗   ██╗ █████╗ ██╗     ██╗  ██╗   ██╗    ██████╗ ██╗   ██╗███╗   ██╗
      //  ██╔══██╗██╔════╝╚══██╔══╝██║   ██║██╔══██╗██║     ██║  ╚██╗ ██╔╝    ██╔══██╗██║   ██║████╗  ██║
      //  ███████║██║        ██║   ██║   ██║███████║██║     ██║   ╚████╔╝     ██████╔╝██║   ██║██╔██╗ ██║
      //  ██╔══██║██║        ██║   ██║   ██║██╔══██║██║     ██║    ╚██╔╝      ██╔══██╗██║   ██║██║╚██╗██║
      //  ██║  ██║╚██████╗   ██║   ╚██████╔╝██║  ██║███████╗███████╗██║       ██║  ██║╚██████╔╝██║ ╚████║
      //  ╚═╝  ╚═╝ ╚═════╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝╚══════╝╚══════╝╚═╝       ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝
      //
      //  ███╗   ███╗ █████╗  ██████╗██╗  ██╗██╗███╗   ██╗███████╗    ███████╗███╗   ██╗
      //  ████╗ ████║██╔══██╗██╔════╝██║  ██║██║████╗  ██║██╔════╝    ██╔════╝████╗  ██║
      //  ██╔████╔██║███████║██║     ███████║██║██╔██╗ ██║█████╗      █████╗  ██╔██╗ ██║
      //  ██║╚██╔╝██║██╔══██║██║     ██╔══██║██║██║╚██╗██║██╔══╝      ██╔══╝  ██║╚██╗██║
      //  ██║ ╚═╝ ██║██║  ██║╚██████╗██║  ██║██║██║ ╚████║███████╗    ██║     ██║ ╚████║
      //  ╚═╝     ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝╚══════╝    ╚═╝     ╚═╝  ╚═══╝
      //
      // Finally, call the machine's `fn`.
      try {
        self.fn.apply(self._configuredEnvironment, [self._configuredInputs, implementorSwitchback, self._configuredEnvironment]);
      } catch (e) {

        // Split the error we got into lines, and remove the first one (the actual error message)
        e.stack = e.stack.split('\n');
        var msg = e.stack.shift();

        // Combine the stack we got from the error with those in the environment
        e.stack = getCombinedErrorStack(removeNonUserlandCallsFromStack(e.stack), self._configuredEnvironment.debug.stack);
        e.stackModified = true;

        // Replace the message
        e.stack = msg + '\n' + e.stack;

        // If it throws an uncaught error *that we can catch* (i.e. outside of any asynchronous callbacks),
        // then catch it and trigger the configured `error` callback.
        //
        // -- <IN ORDER TO DO THAT> --
        // Re-create the ***userland*** switchback and call it with the error that occurred.
        // (fourth argument (`true`) tells switchback to run synchronously)
        //
        // > Note that this could probably be removed eventually, since at this point `interceptedExitCbs`
        // > should actually already be a switchback.
        return switchback(interceptedExitCbs, undefined, undefined, true)(e);
        // -- </IN ORDER TO DO THAT> --
      }//</catch :: uncaught error thrown by custom implementation in this machine's `fn` function>

    } catch(e) {


      // If something ELSE above threw an error *that we can catch* (i.e. outside of any asynchronous callbacks),
      // then catch it and trigger the configured `error` callback.

      // Split the error we got into lines, and remove the first one (the actual error message)
      e.stack = e.stack.split('\n');
      var msg = e.stack.shift();

      // Combine the stack we got from the error with those in the environment
      e.stack = getCombinedErrorStack(removeNonUserlandCallsFromStack(e.stack), self._configuredEnvironment.debug.stack);
      e.stackModified = true;
      // Replace the message
      e.stack = msg + '\n' + e.stack;

      return switchback(interceptedExitCbs, undefined, undefined, true)(e);
      // ====================================================================================================
      // TODO: probably replace this ^^^^ with:
      // ```
      // throw new Error('Consistently violation: Unexpected internal error in machine runner: '+e.stack);
      // ```
      // ====================================================================================================

    }//</catch>

  });//</doing cache lookup, if relevant, then continuing on to do more stuff ^^>

  // _∏_
  return this;
};

