/**
 * Given a string of dash-delimited words, return a conventional
 * (and ECMAScript-compatible) camel-cased variable-name-looking thing.
 *
 * @param {String} id
 * @return {String}
 */

module.exports = function makeECMAScriptCompatible (id) {
  return id.replace(/-([a-z])/g, function ($all, $1) {
    return $1.toUpperCase();
  });
};
