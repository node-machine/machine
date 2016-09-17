/**
 * Module dependencies
 */

var helpConfigureMachineInstance = require('./help-configure-machine-instance');


/**
 * .configure()
 *
 * Configure a live machine instance with argins, callbacks, and/or habitat variables.
 * (This just uses the private `helpConfigureMachineInstance()` under the covers.)
 *
 * @required  {Dictionary?} argins
 * @required  {Dictionary?|Function?} cbs
 * @required  {Dictionary?} envToSet
 *
 * @returns {LiveMachine}
 * @chainable
 */
module.exports = function Machine_prototype_configure (argins, cbs, envToSet) {

  // Call helper
  helpConfigureMachineInstance(this, argins, cbs, envToSet);

  // Return self (to make this chainable).
  return this;

};

