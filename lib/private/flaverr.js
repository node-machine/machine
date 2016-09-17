/**
 * Module dependencies
 */

var _ = require('lodash');


/**
 * flaverr()
 *
 * Flavor an Error instance with the specified error code string or dictionary of customizations.
 *
 * Specifically, this modifies the provided Error instance either:
 * (A) by attaching a `code` property and setting it to the specified value (e.g. "E_USAGE"), or
 * (B) merging the specified dictionary of stuff into the Error
 *
 *
 * @required {String|Dictionary} codeOrCustomizations
 *           e.g. `"E_USAGE"`
 *                    -OR-
 *                `{ code: 'E_MACHINE_RUNTIME_VALIDATION', machineInstance: foo, errors: [] }`
 *
 * @required {Error} err
 *           e.g. `new Error('Invalid usage: That is not where the quarter is supposed to go.')`
 *
 * @returns {Error}
 *    @property {String} code
 */

module.exports = function flaverr (codeOrCustomizations, err){
  if (_.isString(codeOrCustomizations)) {
    err.code = codeOrCustomizations;
  }
  else if (_.isObject(codeOrCustomizations) && !_.isArray(codeOrCustomizations) && !_.isFunction(codeOrCustomizations)) {
    _.extend(err, codeOrCustomizations);
  }
  else {
    throw new Error('Consistency violation: Unexpected usage of `flaverr()`.  Expected 1st argument to be either a string error code or a dictionary of customizations.');
  }

  return err;
};
