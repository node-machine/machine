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
 * by comparing the file path with __dirname.
 *
 */

module.exports = function removeNonUserlandCallsFromStack(stack) {

  return _.reduce(stack, function(memo, line) {
    var filePath = getFilepathFromStackEntry(line);
    var fileDir = path.dirname(filePath.trim());
    if (fileDir !== '.' && fileDir !== __dirname) {
      memo.push(line);
    }
    return memo;
  }, []);

};
