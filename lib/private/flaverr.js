/**
 * Module dependencies
 */

var util = require('util');
var _ = require('@sailshq/lodash');


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
  if (!_.isError(err)) {
    throw new Error('Consistency violation: Unexpected usage of `flaverr()`.  Expected 2nd argument to be an Error instance (but instead got `'+util.inspect(err, {depth: null})+'`)');
  }

  if (_.isString(codeOrCustomizations)) {
    err.code = codeOrCustomizations;
  }
  else if (_.isObject(codeOrCustomizations) && !_.isArray(codeOrCustomizations) && !_.isFunction(codeOrCustomizations)) {
    if (codeOrCustomizations.message) { throw new Error('Consistency violation: Unexpected usage of `flaverr()`.  Customizations (dictionary provided as 1st arg) are not allowed to contain a `message` (just pass in the desired message to the Error constructor and pass in the resulting Error instance as the 2nd argument to flaverr!)'); }
    if (codeOrCustomizations.stack) { throw new Error('Consistency violation: Unexpected usage of `flaverr()`.  Customizations (dictionary provided as 1st arg) are not allowed to contain a `stack`.'); }
    _.extend(err, codeOrCustomizations);
  }
  else {
    throw new Error('Consistency violation: Unexpected usage of `flaverr()`.  Expected 1st argument to be either a string error code or a dictionary of customizations (but instead got `'+util.inspect(codeOrCustomizations, {depth: null})+'`)');
  }

  return err;
};
