/**
 * Module dependencies
 */

var _ = require('lodash');



/**
 * Machine.toAction()
 *
 * Build a conventional controller action (i.e. route handling function)
 * from a machine definition.  This wraps the machine in a function which
 * negotiates exits to the appropriate response method (e.g. res.serverError)
 * and passes in all of the request parameters as inputs, as well as a few
 * other useful scope variables including:
 *  • req
 *  • res
 *  • sails (if it exists)
 *
 * @param  {Object} machineDef
 * @return {Function}
 */

module.exports = function Machine_toAction(machineDef) {
  var Machine = this;

  return function _wrappedAction(req, res, next) {

    // TODO: inject req, res, and sails as `contexts` instead of inputs

    // Configure and run machine.
    return Machine.build(machineDef).configure(
      (function _buildInputs() {
        var inputValues = {};

        // Only add `sails` as an input if it exists.
        if (typeof sails !== 'undefined' || req._sails) {
          inputValues.sails = typeof sails !== 'undefined' ? sails : req._sails;
          inputValues.app = inputValues.sails;
        }
        // Only mix in parameters as inputs if `req.allParams()` exists.
        if (req.allParams) {
          inputValues = _.merge(inputValues, req.allParams());
        }
        // Always add `req` and `res` as inputs.
        inputValues.req = req;
        inputValues.res = res;

        return inputValues;
      })()
    ).exec({
      success: function(data) {
        // Sails
        if (res.ok) {
          return res.ok(data);
        }
        // Express
        else if (res.json) {
          res.statusCode = 200;
          return res.json(data);
        }
        // Node
        else {
          res.statusCode = 200;
          return res.end(data);
        }
      },
      error: function(err) {
        // Sails
        if (res.negotiate) {
          return res.negotiate(err);
        }
        // Connect/Express
        else if (next) {
          return next(err);
        }
        // Node
        else {
          res.statusCode = 500;
          return res.end(err);
        }
      }
    });
  };
};
