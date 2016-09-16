/**
 * Module dependencies
 */

var util = require('util');
var _ = require('lodash');


/*
 * getCombinedErrorStack()
 *
 * Build a new raw stack string by combining an already-parsed stack trace
 * (the `stackLines` array) with an array of raw stack strings (`envErrorStacks`).
 *
 * @required {Array} stackLines
 *        An array representing an already-parsed stack trace.
 *        Each item in the array is a line of the stack trace, split on '\n'.
 *
 * @required {Array} envErrorStacks
 *        An array of raw stack strings.
 *
 * @returns {String}
 *          A new, combined raw stack string composed from `stackLines` and `envErrorStacks`.
 */

module.exports = function getCombinedErrorStack(stackLines, envErrorStacks) {

  // Ensure that `stackLines` is an array.
  // (It always should be already, but make sure anyway.)
  if (!_.isArray(stackLines)) {
    throw new Error('Consistency violation: getCombinedErrorStack() expects an array of strings as its first argument!  But instead got: '+util.inspect(stackLines, {depth: null}));
  }

  // Reverse the stacks in the array, since we want the newest ones first.
  envErrorStacks = _.clone(envErrorStacks).reverse();

  // Var to hold our combined error stack.
  var newErrorStack = '';

  // If there are any stacks in the environment, combine them.
  if (envErrorStacks.length) {
    var stackToAdd = envErrorStacks.join('\n');
    // Add the first line of the current stack (the most recent caller)
    // to the rolled-up stack trace from the environment.
    newErrorStack = stackLines[0].replace(/\n$/,'') + '\n' + stackToAdd;
  }

  // If there are no stacks in the environment, just use the current stack trace.
  else {
    newErrorStack = stackLines.join('\n');
  }

  // Return the new stack.
  return newErrorStack;

};
