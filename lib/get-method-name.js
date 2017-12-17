/**
 * Module dependencies
 */

var util = require('util');
var flaverr = require('flaverr');
var X_VALID_ECMA51_VARNAME = require('./private/X_VALID_ECMA51_VARNAME');
var X_INVALID_CHARACTERS_IN_ECMA51_VARNAME = require('./private/X_INVALID_CHARACTERS_IN_ECMA51_VARNAME');
var X_INVALID_FIRST_CHARACTER = require('./private/X_INVALID_FIRST_CHARACTER');


/**
 * .getMethodName()
 *
 * Determine the method name for a machine: a conventional (ECMAScript-compatible)
 * method-name-looking thing, determined from its identity (dash-delimited words).
 *
 * @param  {String} identity
 * @returns {String}
 * @throws {Error} E_RESERVED
 *         If `identity` cannot be coerced into a valid machine identity (similar to a ECMAScript 5.1 variable name)
 */
module.exports = function getMethodName(identity){

  // Save original string for error messages in this file.
  var original = identity;

  if (!identity || typeof identity !== 'string') {
    throw new Error('Cannot derive a method name from that (`'+util.inspect(identity)+'`).  Please pass in the source identity as a non-empty string.');
  }

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // FUTURE: Better handling for special identities like `entry/login.js`
  // (e.g. maybe use something like `_loadedFrom` instead)
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // FUTURE: Include a general-case warning like we do currently in .pack() for any
  // identity that's technically allowed, but that might be weird (e.g. "inspect").
  // Note that if we do this, we'll need to extrapolate all revelant cases where we
  // currently warn in .pack() to avoid being annoying & logging the warning twice.
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  // Camel-case any kebab-cased things.
  var str = identity.replace(/-+([a-z])/g, function($all, $1) {
    return $1.toUpperCase();
  });

  // Remove any other naughty characters
  str = str.replace(X_INVALID_CHARACTERS_IN_ECMA51_VARNAME, '');

  // Ensure `str` doesn't start with a character which is not a letter or $.
  // (NOTE: ECMA5.1 is actually more permissive than this, i.e. you can use weird
  // unicode characters, but we're preventing that here.  Because... cm'on, really?)
  str = str.replace(X_INVALID_FIRST_CHARACTER, '');

  // One last check to make sure we ended up with a valid variable name:
  // (i.e. don't clash with special JavaScript keywords, like "delete")
  if (!str.match(X_VALID_ECMA51_VARNAME)) {
    throw flaverr('E_RESERVED', new Error('A method name cannot be derived from "'+original+'", because it collides with a JavaScript reserved word, or is otherwise probably a bad idea to use.'));
  }

  return str;

};
