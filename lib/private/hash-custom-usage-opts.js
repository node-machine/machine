/**
 * Module dependencies
 */

var _ = require('@sailshq/lodash');
var flaverr = require('flaverr');


/**
 * hashCustomUsageOpts()
 *
 * @param  {Dictionary} customUsageOpts
 * @return {String}
 * @throws {Error}
 *         @property {E_UNHASHABLE} If something in opts could not be hashed
 */
module.exports = function hashCustomUsageOpts(customUsageOpts){

  return _.reduce(_.keys(customUsageOpts).sort(), function(hashSoFar, optKey){
    var optValue = customUsageOpts[optKey];

    // If custom usage opts contain a non-string, then don't try to cache.
    if (!_.isString(optValue)) {
      throw flaverr('E_UNHASHABLE');
    }

    hashSoFar += optKey+':'+JSON.stringify(optValue)+'|';
    return hashSoFar;
  }, '');

};
