/**
 * Module dependencies
 */

var path = require('path');
var _ = require('lodash');

/*
 * getCombinedErrorStack()
 *
 * Given "thisStack" (i.e. the error you get from doing new Error() at the top
 * of Machine.prototype.exec) and the error stack currently living in the machine's
 * environment (i.e. _configuredEnvironment), get a new stack that consists of the
 * current error stack plus the error stack from the environment, and return it.
 *
 */

module.exports = function getCombinedErrorStack(thisStack, envErrorStacks) {

  // Reverse the stacks in the array, since we want the newest ones first.
  envErrorStacks = _.clone(envErrorStacks).reverse();

  // Var to hold our combined error stack.
  var newErrorStack = '';

  // If there are any stacks in the environment, combine them.
  if (envErrorStacks.length) {
    var stackToAdd = envErrorStacks.join('\n');
    // Add the first line of the current stack (the most recent caller)
    // to the rolled-up stack trace from the environment.
    newErrorStack = thisStack[0].replace(/\n$/,'') + '\n' + stackToAdd;
  }

  // If there are no stacks in the environment, just use the current stack trace.
  else {
    newErrorStack = thisStack.join('\n');
  }

  // Return the new stack.
  return newErrorStack;

};
