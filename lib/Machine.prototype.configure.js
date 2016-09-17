/**
 * Module dependencies
 */

var util = require('util');
var _ = require('lodash');


/**
 * .configure()
 *
 * Configure a live machine instance with argins (runtime values for its inputs).
 *
 * @required  {Dictionary} argins
 *
 * @returns {LiveMachine}
 * @chainable
 */
module.exports = function Machine_prototype_configure (argins) {

  // Assertions:
  if (!_.isObject(argins) || _.isArray(argins) || _.isFunction(argins)) {
    throw new Error('Invalid usage: `.configure()` expects a dictionary as its 1st argument!  But instead got: '+util.inspect(argins, {depth: null}));
  }
  if (arguments.length > 1) {
    throw new Error('Deprecated usage:  `.configure()` now only supports one argument.  To specify callback(s), pass them into `.exec()`.  To specify habitat vars, use `.setEnv()`.');
  }

  // Fold new argins on top of any existing configured argins.
  _.extend(this._configuredInputs, argins);

  return this;
};

