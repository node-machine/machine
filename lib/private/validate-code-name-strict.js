/**
 * Module dependencies
 */

var X_INVALID_CHARACTERS_IN_ECMA51_VARNAME = require('./X_INVALID_CHARACTERS_IN_ECMA51_VARNAME');
var X_INVALID_FIRST_CHARACTER = require('./X_INVALID_FIRST_CHARACTER');


/**
 * Strictly validate a string as the "code name" for an input or exit.
 *
 * @param  {String} codeName
 *         The source string to check.
 *
 * @returns {String?} [reason]
 *         If `codeName` is not a valid input or exit code name, then this returns a reason string.
 *         Otherwise, it returns `undefined`.
 *
 *         Note: The "reason string" returned will always be in a format such that it can
 *         be concatenated onto the end of something like "Hey that's not ok, because it {{…}}."
 *         It will not have ending punctuation.
 */
module.exports = function validateCodeNameStrict(codeName){

  // Verify that `codeName` is a non-empty string.
  if (!codeName || typeof codeName !== 'string') {
    return 'must be a non-empty string';
  }//•

  // Verify that `codeName` doesn't have any invalid characters.
  if (codeName.match(X_INVALID_CHARACTERS_IN_ECMA51_VARNAME)){
    return 'contains invalid characters';
  }//•

  // Verify `codeName` doesn't start with a character which is not a letter, "_", or "$".
  // (NOTE: ECMA5.1 is actually more permissive than this, i.e. you can use weird
  // unicode characters, but we're preventing that here.  Because... cm'on, really?)
  if (codeName.match(X_INVALID_FIRST_CHARACTER)){
    return 'starts with an invalid character';
  }//•

  // Check to make sure this isn't anything particularly nasty.
  if (
    // • Deferred methods:
    codeName === 'exec' ||
    codeName === 'then' ||
    codeName === 'catch' ||
    codeName === 'toPromise' ||

    // • the standard JavaScript object flora:
    codeName === '__defineGetter__' ||
    codeName === '__defineSetter__' ||
    codeName === '__lookupGetter__' ||
    codeName === '__lookupSetter__' ||
    codeName === '__proto__' ||
    codeName === 'constructor' ||
    codeName === 'hasOwnProperty' ||
    codeName === 'isPrototypeOf' ||
    codeName === 'propertyIsEnumerable' ||
    codeName === 'toLocaleString' ||
    codeName === 'toString' ||
    codeName === 'valueOf' ||

    // • and things that are just going to end up being a really bad idea:
    //   (or at the very least, which shouldn't be defined this way)
    codeName === 'prototype' ||
    codeName === 'toJSON' ||
    codeName === 'inspect'

  ) {
    return 'potentially collides with a reserved name in JavaScript (or this package)';
  }//•

  if (codeName === 'inputs' || codeName === 'exits') {
    return 'is potentially very confusing';
  }//•

  // Finally, one last check that's bitten several folks on GitHub in the past:
  if (codeName === 'length') {
    return 'could potentially cause your code to encounter hard-to-catch bugs related to array ducktyping';
  }//•

  // Otherwise, all's well.

};
