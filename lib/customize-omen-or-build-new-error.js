/**
 * Module dependencies
 */

// n/a


/**
 * customizeOmenOrBuildNewError()
 *
 * Return a new error instance, with "hindsight".
 *
 * If an omen is provided, it will be customized (REMEMBER: CAN ONLY DO IT ONCE!!)
 * Otherwise, a new Error instance will be built and returned.
 *
 * @param  {String} name
 * @param  {String} message
 * @param  {Error?} omen
 * @return {Error}
 */

module.exports = function customizeOmenOrBuildNewError(name, message, omen){

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // FUTURE: Explore a fancier strategy like this:
  // ```
  // if (omen && omen._traceReference && Error.captureStackTrace) {
  //   var omen2 = new Error(message);
  //   Error.captureStackTrace(omen2, omen._traceReference);
  //   omen2.name = name;
  //   return omen;
  // }
  // ```
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  if (omen) {
    var numCharsToShift = omen.name.length + 2 + omen.message.length;
    omen.stack = name + ': '+ omen.message + omen.stack.slice(numCharsToShift);
    omen.message = message;
    omen.name = name;
    return omen;
  }
  else {
    var err = new Error(message);
    err.name = name;
    return err;
  }

};
