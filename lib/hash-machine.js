/**
 * Module dependencies
 */

var hashObject = require('object-hash');


/**
 * hashMachine()
 *
 * @param  {[type]}   machine [description]
 * @param  {Function} done             [description]
 * @return {String}
 */
module.exports = function hashMachine(machine, done) {

  var uniquelyIdentifyingDictionary = {
    id: machine.identity || machine.fn.toString(),
    data: machine._configuredInputs
  };

  var hash;
  try {

    // see https://github.com/puleos/object-hash
    hash = hashObject(uniquelyIdentifyingDictionary);
    // Note: we could optimize this, or at least allow for setImmediate (i.e. nextTick)-- BUT ONLY WHEN `machine.runningSynchronously` IS FALSE!!

    // console.log('AND I GOT: ',hash);
  } catch (e) { return done(new Error('Consistency violation: Attempted to use machine caching, but could not calculate hash.  Details:\n'+e.stack)); }

  // --•
  return done(null, hash);

};
