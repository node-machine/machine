/**
 * Module dependencies
 */

var rttc = require('rttc');
var setTypes = require('./Machine.setTypes');


/**
 * validateConfiguredInputValues()
 *
 * Return true
 * @param  {Machine} machine  - a machine instance
 *
 * @throws {Error} If configured inputs are invalid
 */
module.exports = function validateConfiguredInputValues(machine){
  var typeDef = setTypes.call(machine, machine.inputs, machine._configuredInputs);
  rttc.rttc(typeDef, machine._configuredInputs, { coerce: machine._inputCoercion });
};
