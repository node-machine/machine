/**
 * Module dependencies
 */

var util = require('util');
var _ = require('@sailshq/lodash');
var flaverr = require('./private/flaverr');
var helpExecMachineInstance = require('./private/help-exec-machine-instance');
var helpConfigureMachineInstance = require('./private/help-configure-machine-instance');


/**
 * `Machine.prototype.exec()`
 *
 * Run this machine's `fn` and trigger the appropriate exit callback.
 *
 *
 * NOTE:
 * If the machine is synchronous, then an artificial `setImmediate()` may be introduced
 * to ensure that the relevant exit callback is called AFTER any other synchronous logic
 * which might have existed outside of the callback(s).
 * > Originally, this ALSO served to ensure that callbacks were triggered in a subsequent
 * > tick of the event loop.  But the introduction of the `_hasFnYieldedYet` optimization
 * > removed this additional consistency guarantee, trading it for better performance instead.
 *
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 *
 * @optional {Dictionary?|Function?} done
 *         An optional callback function or dictionary of exit-handling callback functions.
 *         If provided, this callback (or set of callbacks) will be folded onto any existing
 *         exit-handling callbacks which were already attached with `.configure()`.
 *
 * @optional {Dictionary?} envToSet
 *         An optional dictionary of additional habitat variables to merge in on top of
 *         whatever else is there before invoking the machine.  (Will be passed in to the
 *         machine's `fn` as the `env` argument.)
 *
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 */
module.exports = function exec(done, envToSet) {

  var self = this;

  // Assert that our `_started` spinlock has not already been set.
  // (better to terminate the process than trigger a callback twice)
  if (self._started) {
    throw flaverr('E_USAGE', new Error('Invalid usage: Cannot call `.exec()` twice on the same live machine (this live instance of machine `'+self.identity+'` has already started running).  To run a machine multiple times, configure it each time to obtain a new live machine instance.'));
  }

  // Set the _started spinlock so that this live machine cannot be `exec()`d again.
  self._started = true;


  // If `envToSet` was provided, validate it, then merge it in.
  if (!_.isUndefined(envToSet)) {
    if (!_.isObject(envToSet) || _.isArray(envToSet) || _.isFunction(envToSet)) {
      throw flaverr('E_USAGE', new Error('Invalid usage: If a second argument is provided to `.exec()`, it is expected to be a dictionary of habitat variables.  But instead got: '+util.inspect(envToSet, {depth: null})));
    }

    helpConfigureMachineInstance(self, undefined, undefined, envToSet);
  }


  // If `done` was provided...
  if (done !== undefined) {

    // Do a quick sanity check to make sure it _at least looks like_ a callback function
    // or dictionary of callback functions.
    if (_.isArray(done) || (!_.isFunction(done) && !_.isObject(done))) {
      throw flaverr('E_USAGE', new Error('Invalid usage: `.exec()` must be called with either:\n'+
                              '  (1) a standard Node callback function, or\n'+
                              '  (2) a dictionary of per-exit callback functions\n'+
                              '\n'+
                              'But instead, got:\n'+
                              util.inspect({depth: null})+
                              ''));
    }

    // --•
    // Configure provided callbacks.
    helpConfigureMachineInstance(self, undefined, done, undefined);

  }//</if :: `done` was provided>


  // >-
  // At this point, if a(ny) callback(s) were provided, we've folded them in.
  //
  // So before continuing, validate that we have an `error` callback of some sort.
  // If it is not, then get crazy and **throw** BEFORE calling the machine's `fn`.
  //
  // (Better to potentially terminate the process than open up the possibility of silently swallowing errors later.)
  if (_.isUndefined(self._configuredExits.error)) {
    throw flaverr('E_NO_ERROR_CALLBACK_CONFIGURED', new Error('Invalid usage: Cannot execute machine (`'+self.identity+'`) without providing any catchall error handling (e.g. an `error` callback).'));
  }
  // Also, as a sanity check, make sure it's a valid callback function and not something else crazy.
  if (!_.isFunction(self._configuredExits.error)) {
    throw new Error('Consistency violation: Cannot execute machine (`'+self.identity+'`) because its configured `error` callback is invalid.  It should be a function, but instead, it\'s:\n'+util.inspect(self._configuredExits.error, {depth: null}));
  }


  // Now finish things off by calling the `helpExecMachineInstance()` helper.
  // This takes care of intercepting callbacks and forwarding exits, plus supporting
  // timeouts, caching, coercion, and more.
  helpExecMachineInstance(self);


  // This method is NOT chainable.
  return;

};

