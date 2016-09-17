/**
 * Module dependencies
 */

var makeECMAScriptCompatible = require('convert-to-ecmascript-compatible-varname');




/**
 * `Machine.getMethodName()`
 *
 * Determine the `methodName` for a machine: an ECMAScript-compatible
 * version of its `identity`, replacing dashes w/ camel-case.
 *
 * @param  {String} identity
 * @return {String}
 */
module.exports = function getMethodName(identity){
  return makeECMAScriptCompatible(identity);
};
