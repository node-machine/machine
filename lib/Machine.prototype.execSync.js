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
  exitCallbacks[this.defaultExit||'success'] = exitCallbacks.success;
  // Built exit callbacks for all other exits.
  _.each(this.exits, function (exitDef, exitName) {
    if (exitName === this.defaultExit || exitName === 'success') return;
    exitCallbacks[exitName] = function (_data){
      isMachineActuallySynchronousCv = true;

      // ensure `_data` exists
      // (if not, build it using the exit definition)
      if (!_data) {
        _data = new Error(util.format('`%s` triggered its `%s` exit', self.identity, exitName) + ((self.exits[exitName] && self.exits[exitName].description)?': '+self.exits[exitName].description:'') + '');
        _data.code = exitName;
        _data.exit = exitName;
        _data.output = _data;
      }
      err = _data;
    };
  });

  this.exec(exitCallbacks);

  if (!isMachineActuallySynchronousCv) {
    throw (function (){
      var _err = new Error('Cannot use `.execSync()` with `'+identity+'` machine because, although it declares synchronous usage (i.e. `sync:true`), it is not actually synchronous.');
      _err.code = 'E_MACHINE_INCONSISTENT';
      return _err;
    })();
  }

  //
  // At this point in the control flow, we should always have access to the
  // `_err` and `_result` exposed above, since the machine author guaranteed
  // that the `fn` is synchronous by setting `sync: true`.
  //

  // If any exit other than the `defaultExit` was traversed, throw the result from the catch-all
  // error exit.
  if (err) {
    if (typeof err === 'object' && err instanceof Error) throw err;
    if (typeof err === 'string') throw new Error(err);
    throw new Error(util.inspect(err, false, null));
  }

  // Otherwise, if the `defaultExit` was traversed, return its result value.
  return result;
};
