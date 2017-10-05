/**
 * Module dependencies
 */

var flaverr = require('flaverr');
var getIsProductionWithoutDebug = require('./private/get-is-production-without-debug');
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
 *
 * @param {Error?} omen
 *      A custom build-time omen.
 *      (For a more complete explanation of what an "omen" is,
 *      see the relevant comments in `build.js`.)
 *
 * @returns {Function} a callable (aka "wet") machine function, potentially customized.
 */

module.exports = function buildWithCustomUsage(opts, omen){
  if (!omen && !getIsProductionWithoutDebug()) {
    omen = flaverr({ name: 'Omen' }, new Error('.buildWithCustomUsage()'), buildWithCustomUsage);
  }//ﬁ
  return helpBuildMachine(opts, omen);
};
