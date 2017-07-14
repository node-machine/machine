/**
 * Module dependencies
 */

var util = require('util');
var _ = require('@sailshq/lodash');
var flaverr = require('flaverr');
var rttc = require('rttc');
var getIsProduction = require('./get-is-production');



/**
 * normalizeMachineDef()
 *
 * Verify/normalize a (dry) node-machine definition, potentially coercing it a bit.
 *
 * > Note that this modifies properties in-place, as a direct reference!
 *
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * @param  {Dictionary} nmDef      [machine definition from implementor-land]
 *
 * @returns {Array}     [implementation problems]
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 */

module.exports = function normalizeMachineDef(nmDef){

  // Assert valid usage of this utility.
  // > (in production, we skip this stuff to save cycles.  We can get away w/ that
  // > because we only include this here to provide better error msgs in development
  // > anyway)
  if (!getIsProduction()) {
    if (!_.isObject(nmDef) || _.isArray(nmDef) || _.isFunction(nmDef)) {
      throw new Error('Consistency violation: `nmDef` must be a dictionary.  But instead got: '+util.inspect(nmDef, {depth: 5}));
    }
  }//ﬁ


  var implProblems = [];

  // Check `identity`
  nmDef.identity = nmDef.identity || (nmDef.friendlyName && _.camelCase(nmDef.friendlyName)) || undefined;//TODO: error if theres no inferr-able identity

  // Check `fn`.
  // If it's an arrow function, then log a warning about `this` probably not working as expected.
  // (thanks @elmigranto!  -- https://stackoverflow.com/a/38830947)
  // TODO

  // TODO: Check `sync`
  // TODO: Check `timeout`
  // TODO: Check `sideEffects`
  // TODO: Check `implementationType`

  // Sanitize input definitions.
  nmDef.inputs = nmDef.inputs || {};
  _.each(nmDef.inputs, function (inputDef, inputCodeName) {

    // if (!_.isString(inputDef.type) || inputDef.type === '') {
    //   throw new Error('Consistency violation: There is no way this input (`'+inputCodeName+'`) should have been allowed to be registered with neither a `type` nor `example`!  Here is the input def: '+util.inspect(inputDef, {depth:5})+'');
    // }

    // TODO: the rest

  });//∞-


  // Sanitize exit definitions.
  nmDef.exits = nmDef.exits || {};
  nmDef.exits.success = nmDef.exits.success || {};
  nmDef.exits.error = nmDef.exits.error || {};
  // TODO



  return implProblems;

};
