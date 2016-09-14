/*
 * getCombinedErrorStack()
 *
 * Given a "clean error" (i.e. the error you get from doing new Error() at the top
 * of Machine.prototype.exec) and the error stack currently living in the machine's
 * environment (i.e. _configuredEnvironment), get a new stack that consists of the
 * clean error stack plus the error stack from the environment, and return it.
 *
 */

module.exports = function getCombinedErrorStack(cleanError, envErrorStack) {

  var newErrorStack;

  if (envErrorStack) {
    newErrorStack = cleanError.stack + '\n' + envErrorStack;
  }
  else {
    newErrorStack = cleanError.stack;
  }

  return newErrorStack;

};


// ================================================================================
// Slightly newer impl:  (not sure if we should use it yet though)
// ```
// if (envErrorStack) {
//   newErrorStack = cleanError.stack.split('\n')[0] + '\n' + envErrorStack;
// }
// ```
// ================================================================================
// TODO: ^^^^ figure that out
