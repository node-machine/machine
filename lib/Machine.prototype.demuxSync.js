/**
 * Module dependenices
 */

var util = require('util');
var _ = require('lodash');


/**
 * Warning: this function is experimental and its usage may change!
 *
 * @param {String} exitName -- optional, defaults to success. The name of the exit traversed for which this function will return `true` (otherwise it returns false)
 * @returns {Boolean} `true` if machine triggers the desired exit, `false` otherwise.
 * @throws {E_USAGE} If `demuxSync()` cannot be used
 */
module.exports = function demuxSync(exitName){

  try {
    this.execSync();
  }
  catch (e) {
    if (e.code === 'E_USAGE') {
      throw e;
    }
  }

  // Desired exit defaults to `success`.
  if (_.isUndefined(exitName)) {
    exitName = 'success';
  }
  else {
    if (!_.isString(exitName)) {
      throw new Error('Invalid usage of `.demuxSync()`: if an argument is provided, it must be a string (the name of an exit)');
    }
    if ( ! _.contains(_.keys(this.exits), exitName) ){
      throw new Error('Invalid usage of `.demuxSync()`: provided exit name must match a known exit of this machine');
    }
  }
  return (this._exited === exitName);

};
