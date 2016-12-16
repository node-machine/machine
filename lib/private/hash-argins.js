/**
 * Module dependencies
 */

var util = require('util');
var crypto = require('crypto');
var _ = require('@sailshq/lodash');
var rttc = require('rttc');


/**
 * hashArgins()
 *
 * Compute a hash string from the configured argins in the provided live machine instance.
 *
 * > Note:
 * > + Argins which _might not be JSON serializable_ are not included when computing the hash.
 * > + Key order does not matter (no matter how deep).
 * > + This logic assumes argins have _already been validated and potentially coerced._
 * > + It also assumes that default values have already been folded in, where appropriate.
 *
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * @param  {LiveMachine} liveMachine
 * @returns {String}
 *          The hash computed from the configured argins.
 */

module.exports = function hashArgins (liveMachine) {

  if (_.isUndefined(liveMachine)) {
    throw new Error('Consistency violation: Expecting `liveMachine` to be provided as argument to hashArgins().  (But it was not.)');
  }
  if (!_.isObject(liveMachine) || !_.isObject(liveMachine._configuredInputs)) {
    throw new Error('Consistency violation: Expecting `liveMachine` to be provided as argument to hashArgins().  Should have a property called `_configuredInputs`, which is a dictionary of all configured argins.  But instead, I got this lousy thing:\n'+util.inspect(liveMachine, {depth:null}));
  }

  try {

    // Build a modified copy of all argins that will be hashed, and sort their keys (recursively).
    var keySortifiedArginsToHash = _.reduce(liveMachine._configuredInputs, function (memo, argin, inputCodeName){

      // Figure out if the input's example indicates that this argin MIGHT NOT be JSON-serializable.
      //
      // > Note: We're just using `rebuild()` here (^^) because it's a good, safe iterator.
      var mightNotBeJSONSerializable;
      var inputDef = liveMachine.inputs[inputCodeName];
      rttc.rebuild(inputDef.example, function (exemplarPiece){
        if (exemplarPiece === '->' || exemplarPiece === '===') {
          mightNotBeJSONSerializable = true;
        }
      });//</rttc.rebuild()>

      // If we don't know for sure this argin is JSON-serializable, then just skip it
      // and move on to the next.  (It won't be included in the hash.)
      if (mightNotBeJSONSerializable) {
        return memo;
      }

      // --•
      // At this point, since we're assuming the argin has already been validated, we can safely trust
      // that it is JSON-serializable.

      // Build a modified ("deep-ish") clone of this argin with all of its keys sorted-- recursively deep.
      var sortifiedArgin = (function _sortKeysRecursive(val){
        // --• misc
        if (!_.isObject(val)) { return val; }

        // --• array
        if (_.isArray(val)) {
          return _.map(val, function (item){
            return _sortKeysRecursive(item);
          });//</_.map()>
        }

        // --• dictionary
        var sortedSubKeys = _.keys(val).sort();
        return _.reduce(sortedSubKeys, function (memo, subKey) {
          memo[subKey] = _sortKeysRecursive(val[subKey]);
          return memo;
        }, {});//</_.reduce()>
      })(argin);

      // Track this sortified argin on our dictionary of stuff that will get hashed.
      memo[inputCodeName] = sortifiedArgin;

      // And continue.
      return memo;

    }, {});//</_.reduce() :: argins to hash>



    // Now encode that as a JSON string.
    var stringifiedStuffToHash = JSON.stringify(keySortifiedArginsToHash);



    // Finally, compute & return an MD5 hash.
    var computedHash = crypto.createHash('md5').update(stringifiedStuffToHash).digest('hex');

    return computedHash;

  } catch (e) { throw new Error('Consistency violation: Attempted to hash provided argins (runtime input values) for caching purposes, but could not calculate hash.  Details:\n'+e.stack); }

};
