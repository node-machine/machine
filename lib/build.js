/**
 * Module dependencies
 */

var flaverr = require('flaverr');
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
 *
 * @param {Error?} omen
 *        A custom build-time omen.
 *        (For a more complete explanation of what an "omen" is,
 *        see the relevant comments in `build.js`.)
 * - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * @returns {Function}
 *          A callable, "wet" machine.
 * - - - - - - - - - - - - - - - - - - - - - - - - - - -
 */

module.exports = function build(nmDef, omen){

  // Potentially build an "omen": an Error instance defined ahead of time in order to grab
  // a nice, clean, appropriate stack trace originating from the line of code that actually
  // invoked this code in userland (i.e. wherever .build() got called from)
  //
  // More generally, omens are used for providing a better experience when viewing the
  // stack trace of errors that come from one or more asynchronous ticks down the line;
  // e.g. uniqueness errors.  But really, they're useful for prettying up any stack trace--
  // whether it's asynchronous or not.
  //
  // Remember that an omen should only be used in an Error ONCE!
  //
  // > Inspired by the implementation originally devised for Waterline:
  // > https://github.com/balderdashy/waterline/blob/6b1f65e77697c36561a0edd06dff537307986cb7/lib/waterline/utils/query/build-omen.js
  //
  // See npmjs.com/package/flaverr for more info.
  omen = omen || flaverr.omen(build);


  // Then call our private utility to finish building the machine.
  return helpBuildMachine({ def: nmDef }, omen);

};
