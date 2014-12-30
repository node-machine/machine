/**
 * Module dependenices
 */

var util = require('util');



/**
 * @returns {*} return value through machine's default exit
 */
module.exports = function (){

  // If machine definition did not explicitly flag itself as synchronous,
  // prevent this usage.
  if (!this.sync) {
    throw (function (){
      var _err = new Error('Cannot use `.execSync()` with `'+this.identity+'` machine because it does not enable synchronous usage (i.e. `sync:true`)');
      _err.code = 'E_USAGE';
      return _err;
    })();
  }

  // Flag to indicate that the machine should not force a `setTimeout(0)`
  this._runningSynchronously = true;

  // Expose error and/or result from switchback via closure.
  var result;
  var err;
  this.exec(function (_err, _result){
    err = _err;
    result = _result;
  });

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
