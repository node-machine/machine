/**
 * Module dependenices
 */

var util = require('util');
var _ = require('@sailshq/lodash');
var flaverr = require('./private/flaverr');


/**
 * `Machine.prototype.execSync()`
 *
 * @returns {Ref} output from machine's success exit
 * @throws {Error} If machine triggers any other exit
 *         @property {String} exit
 *                   The code name of the exit.
 *         @property {Ref?} output
 *                   The output from the exit, if relevant.
 */
module.exports = function execSync(){

  var self = this;
  var identity = this.identity;

  // Check that the machine definition explicitly flagged itself as synchronous.
  // > If `sync` was NOT set, then this is a usage error.
  // > You can't run a machine synchronously unless it proudly declares itself as such.
  if (!this.sync) {
    throw flaverr('E_USAGE', new Error('Cannot use `.execSync()` with `'+identity+'` machine because it does not enable synchronous usage (i.e. `sync:true`)'));
  }

  // Don't allow `.execSync()` to be used if `.cache()` was called on this machine instance.
  if (this._willCache) {
    throw flaverr('E_USAGE', new Error('Failed to use `.execSync()` with machine ('+self.identity+').\nCannot use `.cache()` and `.execSync()` at the same time since writing and reading\nfrom a cache is an asynchronous operation.\nCaching of synchronous machine results can be implemented in userland with _.memoize().\n(This is because the built-in machine cache is configurable, database-agnostic, and asynchronous.)'));
  }

  // Flag to indicate that the machine should not force a `setTimeout(0)`
  this._runningSynchronously = true;

  // Expose error and/or result from switchback via closure.
  var result;
  var err;
  var isMachineActuallySynchronousCv = false;


  var exitCallbacks = {
    success: function (_result){
      isMachineActuallySynchronousCv = true;
      result = _result;
    },
    error: function (_err){
      // This is probably never used and could be deleted.
      // (but leaving for backwards compatibility for now.  Be careful when removing!)
      isMachineActuallySynchronousCv = true;
      err = _err;
    }
  };

  // Build exit callbacks for all exits other than "success".
  _.each(this.exits, function (exitDef, exitName) {
    if (exitName === 'success') { return; }
    exitCallbacks[exitName] = function (_data){
      isMachineActuallySynchronousCv = true;

      // Now we ensure `_data` exists and is an Error instance.

      // If this is the handler for our error exit, and the output being received
      // is an Error instance, then just pass it straight through.
      // (no reason to add cruft)
      if (_.isError(_data) && exitName === 'error') {
        err = _data;
      }
      // But otherwise, build a new Error using info from the exit definition.
      else {
        var exitDef = self.exits[exitName];
        var exitDescription = exitDef && exitDef.description;
        var exitHasOutput = exitDef && !_.isUndefined(exitDef.example);
        var errMsg = util.format(
          '`%s` triggered its `%s` exit.\n%s%s',
          self.identity,
          exitName,
          (exitDescription ? ('\nDescription:\n'+exitDescription+'\n') : ''),
          (exitHasOutput ? ('\nOutput:\n'+util.inspect(_data, false, null)+'\n') : '')
        );
        err = new Error(errMsg);
        // TODO: trim some of the crap from `machine` itself off of the stack.
        // TODO: if this error came from a machine internal to the implementation of THIS machine,
        // then add some kind of message to the error message+stack about that.
        // (i.e. so at debug-time in userland, we don't have to go digging into the `output` property
        // to get all the goodies)
        err.code = exitName;
        err.exit = exitName;
        err.output = _data;
      }
    };
  });

  this.exec(exitCallbacks);

  if (!isMachineActuallySynchronousCv) {
    throw flaverr('E_MACHINE_INCONSISTENT', new Error('Cannot use `.execSync()` with `'+identity+'` machine because, although it declares synchronous usage (i.e. `sync:true`), it is not actually synchronous.'));
    // TODO: use a nice module to trim some of the crap from `machine` itself off of the stack.
  }

  //
  // At this point in the control flow, we should always have access to the
  // `_err` and `_result` exposed above, since the machine author guaranteed
  // that the `fn` is synchronous by setting `sync: true`.
  //

  // If any exit other than `success` was traversed, throw the result from the
  // `error` exit.
  if (err) {
    if (_.isError(err)) {
      throw err;
    }
    if (_.isString(err)) {
      err = new Error(err);
    }
    else {
      err = new Error(util.inspect(err, false, null));
    }

    throw err;
  }

  // Otherwise, if `success` was traversed, return its result value.
  return result;
};
