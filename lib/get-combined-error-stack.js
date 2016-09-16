/**
 * Module dependencies
 */

var util = require('util');
var _ = require('lodash');


/*
 * getCombinedErrorStack()
 *
 * Build a new raw stack string by combining an already-parsed stack trace
 * (the `stackLines` array) with an array of raw stack strings (`envStackStrs`).
 *
 * @required {Array} stackLines
 *        An array representing an already-parsed stack trace.
 *        Each item in the array is a line of the stack trace, split on '\n'.
 *
 * @required {Array} envStackStrs
 *        An array of raw stack strings.
 *        TODO: document exactly what this actually means
 *        (^^it looks as though the data type may vary throughout the
 *         implementation-- need to verify that though. -m sep16,2016)
 *
 * @returns {String}
 *          A new stack trace composed from `stackLines` and `envStackStrs`.
 */

module.exports = function getCombinedErrorStack(stackLines, envStackStrs) {

  // Assertions:
  if (!_.isArray(stackLines) || ( stackLines.length > 0 && !_.isString(stackLines[0]) )) {
    throw new Error('Consistency violation: getCombinedErrorStack() expects an array of strings as its 1st argument!  But instead got: '+util.inspect(stackLines, {depth: null}));
  }
  if (!_.isArray(envStackStrs) || ( envStackStrs.length > 0 && !_.isString(envStackStrs[0]) )) {
    throw new Error('Consistency violation: getCombinedErrorStack() expects an array of strings as its 2nd argument!  But instead got: '+util.inspect(envStackStrs, {depth: null}));
  }


  // Declare a local variable (`newRawStackStr`) which will hold the combined stack string.
  // (This is what we return below.)
  var newRawStackStr;

  // If there are any stacks in the environment, combine them.
  if (envStackStrs.length > 0) {

    // Grab the first line of the current stack (`stackLines`), and trim any trailing whitespace.
    // (this represents the most recent caller)
    var firstLineOfStackLines = stackLines[0].replace(/\n$/,'');

    // Now roll up our `envStackStrs` array into a single stack trace string.
    // To do that, we'll join together each item with newlines, but in reverse order
    // (since we want the newest ones first)
    var rolledUpStackTraceFromEnv = _.clone(envStackStrs).reverse().join('\n');

    // Finally, combine the two pieces together.
    // to the rolled-up stack trace from `envStackStrs`.
    newRawStackStr = firstLineOfStackLines + '\n' + rolledUpStackTraceFromEnv;

  }
  //‡
  // If no env stack strings were provided, just join together `stackLines` into a stack trace.
  else {
    newRawStackStr = stackLines.join('\n');
  }


  // Return the new stack trace.
  // (remember: this is a string)
  return newRawStackStr;

};
