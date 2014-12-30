/**
 * Module dependencies
 */

var hashObject = require('object-hash');


/**
 * [exports description]
 * @param  {[type]}   machine [description]
 * @param  {Function} done             [description]
 * @return {[type]}                    [description]
 */
module.exports = function hash_machine (machine, done) {

  var hash;

  try {

    // console.log('CALCULATED HASH ON:',getUniquelyIdentifyingObj(machine));

    // see https://github.com/puleos/object-hash
    // TODO: optimize this, or at least allow for setImmediate (i.e. nextTick)
    //  ( BUT ONLY WHEN `machine.runnincSynchronously` IS FALSE!! )
    hash = hashObject(getUniquelyIdentifyingObj(machine));

    // console.log('AND I GOT: ',hash);
  }
  catch (e) {
    // console.log('HASH CALCULATION ERR:',e);
    return done(e);
  }

  return done(null, hash);
};


function getUniquelyIdentifyingObj(machine) {
  return {
    id: machine.identity || machine.fn.toString(),
    data: machine._configuredInputs
  };
}
