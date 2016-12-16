/**
 * Module dependencies
 */

var util = require('util');
var _ = require('@sailshq/lodash');


/*
 * getCombinedErrorStack()
 *
 * Build a new stack trace string by combining an array of stack entries (the `stackEntries` array)
 * with an array of raw stack strings (`envStackStrs`).
 * > (see getFilepathFromStackEntry for more information about stack entries vs. traces, etc.)
 *
 * @required {Array} stackEntries
 *        An array representing an already-parsed stack trace.
 *        Each item in the array is a line of the stack trace, split on '\n'.
 *
 * @required {Array} envStackStrs
 *        An array of ... stack strings?
 *        TODO: document exactly what this actually means
 *        (^^it looks as though the data type may vary throughout the
 *         implementation-- need to verify that though. -m sep16,2016)
 *
 *
 * @returns {String}
 *          A new stack trace composed from `stackEntries` and `envStackStrs`.
 */

module.exports = function getCombinedErrorStack(stackEntries, envStackStrs) {

  // Assertions:
  if (!_.isArray(stackEntries) || ( stackEntries.length > 0 && !_.isString(stackEntries[0]) )) {
    throw new Error('Consistency violation: getCombinedErrorStack() expects an array of strings as its 1st argument!  But instead got: '+util.inspect(stackEntries, {depth: null}));
  }
  if (!_.isArray(envStackStrs) || ( envStackStrs.length > 0 && !_.isString(envStackStrs[0]) )) {
    throw new Error('Consistency violation: getCombinedErrorStack() expects an array of strings as its 2nd argument!  But instead got: '+util.inspect(envStackStrs, {depth: null}));
  }


  try {
    // Declare a local variable (`newRawStackStr`) which will hold the combined stack string.
    // (This is what we return below.)
    var newRawStackStr;

    // If there are any stacks in the environment, combine them.
    if (envStackStrs.length > 0) {

      // Grab the first line of the current stack (`stackEntries`), and trim any trailing whitespace.
      // (this represents the most recent caller)
      var firstLineOfstackEntries = stackEntries[0].replace(/\n$/,'');

      // Now roll up our `envStackStrs` array into a single stack trace string.
      // To do that, we'll join together each item with newlines ('\n'), but in
      // reverse order (since we want the newest ones first.)
      var rolledUpStackTraceFromEnv = _.clone(envStackStrs).reverse().join('\n');

      // Finally, combine the two pieces together.
      // to the rolled-up stack trace from `envStackStrs`.
      newRawStackStr = firstLineOfstackEntries + '\n' + rolledUpStackTraceFromEnv;

    }
    //‡
    // If no env stack strings were provided, just join together `stackEntries` into a stack trace.
    else {
      newRawStackStr = stackEntries.join('\n');
    }


    // Return the new stack trace.
    // (remember: this is a string)
    return newRawStackStr;

  } catch (e) {
    throw new Error('Consistency violation: Encountered unexpected internal error in machine runner while attempting to build a combined stack trace string.  Details: '+e.stack);
  }

};
