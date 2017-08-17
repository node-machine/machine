/**
 * Module dependencies
 */

var helpBuildMachine = require('./private/help-build-machine');



/**
 * .buildWithCustomUsage()
 *
 * Return a machine function with a custom usage style.
 *
 * @property {Dictionary} def
 * @property {String?} arginStyle  ("named" or "serial")
 * @property {String?} execStyle  ("deferred" or "immediate")
 *
 * @returns {Function} a callable (aka "wet") machine function, potentially customized.
 */

module.exports = function buildWithCustomUsage(opts){
  return helpBuildMachine(opts);
};
