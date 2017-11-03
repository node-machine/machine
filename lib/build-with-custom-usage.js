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
 * > See `help-build-machine.js` in this package for details about the various `opts`.
 *
 * @param {Dictionary} opts
 *   @property {Dictionary} def
 *   @property {String?} arginStyle  (see `help-build-machine.js` in this package for details)
 *   @property {String?} execStyle
 *   @property {String?} arginValidationTactic
 *   @property {String?} resultValidationTactic
 *   @property {String?} extraArginsTactic
 *   @property {String?} extraCallbacksTactic
 *   @property {Function?} finalAfterExec
 *   @property {Dictionary?} defaultMeta
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
