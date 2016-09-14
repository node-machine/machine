/*
 * extendErrorStack
 *
 * Given a "clean error" (i.e. the error you get from doing new Error() at the top
 * of Machine.prototype.exec) and the error stack currently living in the machine's
 * environment (i.e. _configuredEnvironment), add the existing error stack to the
 * stack of the clean error and return it.
 *
 */

module.exports = function extendErrorStack(cleanError, envErrorStack) {
  if (envErrorStack) {
    return cleanError.stack + '\n' + envErrorStack;
  }
  return cleanError.stack;
};
