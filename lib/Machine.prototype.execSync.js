/**
 * Module dependenices
 */

var util = require('util');
var _ = require('lodash');


/**
 * @returns {*} return value through machine's default exit
 */
module.exports = function (){

  var self = this;
  var identity = this.identity;

  // If machine definition did not explicitly flag itself as synchronous,
  // prevent this usage.
  if (!this.sync) {
    throw (function (){
      var _err = new Error('Cannot use `.execSync()` with `'+identity+'` machine because it does not enable synchronous usage (i.e. `sync:true`)');
      _err.code = 'E_USAGE';
      _err.status = 400;
      return _err;
    })();
  }

  // Don't allow `.execSync()` to be used if `.cache()` was called on this machine instance.
  if (this._willCache) {
    throw (function (){
      var _err = new Error(
      'Failed to use `.execSync()` with machine ('+self.identity+').\n'+
      'Cannot use `.cache()` and `.execSync()` at the same time since writing and reading\n'+
      'from a cache is an asynchronous operation.\n'+
      'Caching of synchronous machine results can be implemented in userland with _.memoize().\n'+
      '(This is because the built-in machine cache is configurable, database-agnostic, and asynchronous.)'
      );
      _err.code = 'E_USAGE';
      _err.status = 400;
      return _err;
    })();
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
      isMachineActuallySynchronousCv = true;
      err = _err;
    }
  };
  // Apply default exit
  exitCallbacks.success = exitCallbacks.success;
  // Build exit callbacks for all other exits.
  _.each(this.exits, function (exitDef, exitName) {
    if (exitName === 'success') return;
    exitCallbacks[exitName] = function (_data){
      isMachineActuallySynchronousCv = true;

      // ensure `_data` exists and is an Error instance
      if (_.isError(_data)) {
        // TODO: if this error came from a machine internal to the implementation of THIS machine, add something to the error message+stack about that.
        err = _data;
      }
      // (if not, build it as an error object using the exit definition)
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
        // TODO: use a nice module to trim some of the crap from `machine` itself off of the stack.
        err.code = exitName;
        err.exit = exitName;
        err.output = _data;
      }
    };
  });

  this.exec(exitCallbacks);

  if (!isMachineActuallySynchronousCv) {
    throw (function (){
      var _err = new Error('Cannot use `.execSync()` with `'+identity+'` machine because, although it declares synchronous usage (i.e. `sync:true`), it is not actually synchronous.');
      // TODO: use a nice module to trim some of the crap from `machine` itself off of the stack.
      _err.code = 'E_MACHINE_INCONSISTENT';
      return _err;
    })();
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
    err = new Error(util.inspect(err, false, null));

    // TODO: use a nice module to trim some of the crap from `machine` itself off of the stack.
    throw err;
  }

  // Otherwise, if `success` was traversed, return its result value.
  return result;
};
