/**
 * Module dependencies
 */

var flaverr = require('flaverr');
var helpBuildMachine = require('./private/help-build-machine');



/**
 * .buildWithCustomUsage()
 *
 * Return a machine function with a custom usage style.
 *
 * @param {Dictionary} opts
 *   @property {Dictionary} def
 *   @property {String?} arginStyle  ("named" or "serial")
 *   @property {String?} execStyle  ("deferred" or "immediate")
 *   @property {String?} arginValidationTactic    ("coerceAndCloneOrError" or "error" or "doNotCheck")
 *   @property {String?} resultValidationTactic   ("forceCoerceAndClone" or "coerceAndCloneOrError" or "error" or "doNotCheck")
 *   @property {String?} extraArginsTactic        ("warn" or "error" or "doNotCheck")
 *   @property {String?} extraCallbacksTactic     ("warn" or "error" or "doNotCheck")
 *   @property {Function?} finalAfterExec         (final after exec lifecycle callback handler function, as defined by parley)
 *
 * @param {Error?} omen
 *      A custom build-time omen.
 *      (For a more complete explanation of what an "omen" is,
 *      see the relevant comments in `build.js`.)
 *
 * @returns {Function} a callable (aka "wet") machine function, potentially customized.
 */

module.exports = function buildWithCustomUsage(opts, omen){
  omen = omen || flaverr.omen(buildWithCustomUsage);
  return helpBuildMachine(opts, omen);
};
