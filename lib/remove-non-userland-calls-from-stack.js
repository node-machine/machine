/**
 * Module dependencies
 */

var path = require('path');
var _ = require('lodash');
var getFilepathFromStackEntry = require('./get-filepath-from-stack-entry');

/*
 * removeNonUserlandCallsFromStack()
 *
 * Given a stack (as an array of strings), remove all entries that
 * originate from within this package (the machine runner), determined
 * by comparing the file path with __dirname.  Also remove entries
 * referring to files in Node core.
 *
 */

module.exports = function removeNonUserlandCallsFromStack(stack) {

  // Loop through the stack line by line.
  return _.reduce(stack, function(memo, line) {
    // Use the getFilepathFromStackEntry helper to get the path of the
    // file referenced by this line in the stack trace.
    var filePath = getFilepathFromStackEntry(line);
    // Trim the path and use path.dirname to get its directory.
    var fileDir = path.dirname(filePath.trim());
    // If the directory is the same as this script's directory
    // (i.e. the "lib" folder of the machine runner) or if it's
    // just '.' (indicating an internal Node script), skip it.
    // Otherwise keep it.
    if (fileDir !== '.' && fileDir !== __dirname) {
      memo.push(line);
    }
    return memo;
  }, []);

};
