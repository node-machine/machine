/**
 * Module dependencies
 */

var util = require('util');
var path = require('path');
var _ = require('@sailshq/lodash');
var getFilepathFromStackEntry = require('./get-filepath-from-stack-entry');


/*
 * removeNonUserlandCallsFromStack()
 *
 * Build a modified clone of the specified array of stack entries, but
 * with irrelevant entries removed.
 *
 * @required {Array} stackEntries
 *           An array of stack entries.
 *           e.g. [
 *             'at Object.Machine.build.fn (repl:1:91)',
 *             'at Machine_prototype_exec [as exec] (/Users/mikermcneil/code/machine/lib/Machine.prototype.exec.js:833:17)',
 *             'at Function.Machine_build._callableMachineWrapper.exec (/Users/mikermcneil/code/machine/lib/Machine.build.js:345:33)'
 *           ]
 *
 *
 * @returns {Array}
 *          A modified clone of the specified stack entries array, with some entries removed.
 *          e.g. [
 *             'at Object.Machine.build.fn (repl:1:91)'
 *           ]
 *
 * > - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * > Specifically, this removes stack entries that originate from within this
 * > package (the machine runner).
 */

var libPrivateDir = __dirname;
var libDir = path.resolve(libPrivateDir, '..');

module.exports = function removeNonUserlandCallsFromStack(stackEntries) {

  // Assertions:
  if (!_.isArray(stackEntries) || ( stackEntries.length > 0 && !_.isString(stackEntries[0]) )) {
    throw new Error('Consistency violation: removeNonUserlandCallsFromStack() expects an array of strings as its 1st argument!  But instead got: '+util.inspect(stackEntries, {depth: null}));
  }

  try {

    // Loop through the array of stack entries, line by line.
    var prunedStackEntries = _.reduce(stackEntries, function (memo, stackEntry) {

      // Use the getFilepathFromStackEntry helper to get the path of the
      // file referenced by this line in the stack trace.
      var filePath = getFilepathFromStackEntry(stackEntry);

      // Trim whitespace from the path and use path.dirname to get its directory.
      var fileDir = path.dirname(filePath.trim());

      // If the directory is the /lib or /lib/private folder
      // from the machine runner, ignore the entry.  Otherwise
      // add it to the list.
      if (fileDir !== libPrivateDir && fileDir !== libDir) {
        memo.push(stackEntry);
      }

      return memo;
    }, []);

    // Return the pruned array of stack entries.
    return prunedStackEntries;

  } catch (e) {
    throw new Error('Consistency violation: Encountered unexpected internal error in machine runner while attempting to remove non-userland calls from an array of stack entries.  Details: '+e.stack);
  }

};
