/**
 * Module dependenices
 */

var util = require('util');
var _ = require('lodash');


/**
 * @returns {Boolean} `true` if machine triggers its `success` exit, `false` otherwise.
 * @throws {E_USAGE} If `demuxSync()` cannot be used
 */
module.exports = function demuxSync(){

  try {
    this.execSync();
    return true;
  }
  catch (e) {
    if (e.code === 'E_USAGE') {
      throw e;
    }
    return false;
  }

};
