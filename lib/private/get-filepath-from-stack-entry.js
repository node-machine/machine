/**
 * Module dependencies
 */

var util = require('util');
var _ = require('@sailshq/lodash');


/*
 * getFilepathFromStackEntry()
 *
 * Parse the file path from a stack entry, if it has one.
 * (Otherwise, this returns empty string.)
 *
 * @required {String} stackEntry
 *           e.g. "at afterwards (/Users/mikermcneil/code/machine/lib/Machine.prototype.exec.js:833:17)"
 *
 *
 * @returns {String}
 *          The file path (an absolute path) parsed from the stack entry; or empty string
 *          if a path could not be parsed.
 *
 * > - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * > A **raw trace** (aka "raw stack trace string", "raw stack trace", or even just "stack trace") is what
 * > you get from an Error instance if you grab its `.stack` property.  Stack traces contain error messages
 * > at the top, usually-- and those messages can contain _any characters_!  BUT, if you carefully trim the
 * > message out ahead of time, you end up with what we call a **safe trace** (or a "safe stack trace").
 * > THEN, if you split a _safe trace_ on newlines (`\n`), you end up with an array of _stack entries_.
 * > A **stack entry**, also a string, is a single line from a safe stack trace.
 * >
 * > This function takes an individual stack entry like:
 * > ```
 * > "at afterwards (/Users/mikermcneil/code/machine/lib/Machine.prototype.exec.js:833:17)"
 * > ```
 * >
 * > And parses the file path out of it, e.g.
 * > ```
 * > "/Users/mikermcneil/code/machine/lib/Machine.prototype.exec.js:833:17"
 * > ```
 * >
 * > If the stack entry has no file path (e.g. "at repl:1:116"), then this returns
 * > empty string ("").
 */

module.exports = function getFilepathFromStackEntry (stackEntry) {

  // Assertions:
  if (!_.isString(stackEntry)) {
    throw new Error('Consistency violation: getFilepathFromStackEntry() expects a string as its 1st argument!  But instead got: '+util.inspect(stackEntry, {depth: null}));
  }


  try {

    // Build RegExp for use below.
    // Note that, for efficiency, we only construct it one time.
    // (per installed version of the machine runner, per process)
    //
    // > This regex is the one from felixge's `stack-trace` package (https://www.npmjs.com/package/stack-trace),
    // > modified by sgress454 to account for (A) spaces in directory names, and (B) the possible existence of
    // > substrings like "`[as eval]`" in the entries. Tested with Node 0.10, 0.12, 4, 5 and 6.  Didn't test
    // > directly on Windows, but faked it by transforming paths in a test trace into Windows-style and using
    // > path.win32 methods. (Sep 16, 2016)
    // >
    // > Relevant commit:
    // > https://github.com/node-machine/machine/commit/b2f8d29cc36fa5daaa53fc4cccf3143687303bf1#commitcomment-19039035
    //
    if (!module.exports._X_MACHINE_STACK_ENTRY) {
      module.exports._X_MACHINE_STACK_ENTRY = /at (?:(\S+)\s+(?:\[as [^\]]+\]\s+)?)?\(?(?:(.+?):(\d+):(\d+)|([^)]+))\)?/;
    }


    // Now, using our RegExp, attempt to locate a file path in the stack entry.
    //
    // > `found` is either an array if a file path was found, or `null` otherwise.
    // > If a file path was found, then it is in `found[2]`.
    var found = stackEntry.match(module.exports._X_MACHINE_STACK_ENTRY);

    // If we found a matching file path in this stack entry, then use that.
    if (found && found[2]) {
      return found[2];
    }
    // Otherwise, return empty string ("").
    else {
      return '';
    }

  } catch (e) {
    throw new Error('Consistency violation: Encountered unexpected internal error in machine runner while attempting to parse file path from stack entry.  Details: '+e.stack);
  }

};
