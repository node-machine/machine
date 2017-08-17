/**
 * Module dependencies
 */

var helpBuildMachine = require('./private/help-build-machine');


/**
 * .build()
 *
 * > aka Machine()
 *
 * Build a callable ("wet") machine.
 *
 * - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * @param {Dictionary} nmDef
 *        A Node-Machine definition.
 * - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * @returns {Function}
 *          A callable, "wet" machine.
 * - - - - - - - - - - - - - - - - - - - - - - - - - - -
 */

module.exports = function build(nmDef){
  return helpBuildMachine({ def: nmDef });
};
