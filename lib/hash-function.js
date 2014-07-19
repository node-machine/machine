/**
 * Module dependencies
 */

var hashskillet = require('object-hash');


/**
 * [exports description]
 * @param  {[type]}   configuredInputs [description]
 * @param  {Function} done             [description]
 * @return {[type]}                    [description]
 */
module.exports = function hashFn(configuredInputs, done) {


  var hash;

  try {
    // console.log('CALCULATED HASH ON:',configuredInputs);

    // see https://github.com/puleos/object-hash
    // TODO: optimize this, or at least allow for setImmediate (i.e. nextTick)
    hash = hashskillet(configuredInputs);

    // console.log('AND I GOT: ',hash);
  }
  catch (e) {
    // console.log('HASH CALCULATION ERR:',e);
    return done(e);
  }

  return done(null, hash);
};
