/**
 * Module dependencies
 */

var util = require('util');
var _ = require('lodash');
var rttc = require('rttc');




/**
 * [buildLamdaMachine description]
 * @param  {[type]} runtimeLamda     [description]
 * @param  {[type]} nameOfLamdaInput [description]
 * @param  {[type]} parentMachine     [description]
 * @return {[type]}                   [description]
 */
module.exports = function buildLamdaMachine(runtimeLamdaFn, nameOfLamdaInput, parentMachine){

  // Get access to Machine constructor in order to call `build` below.
  var Machine = parentMachine.constructor;

  // Parse the provided lamda input value
  if (!_.isFunction(runtimeLamdaFn)){
    throw new Error('invalid value provided as lamda (`->`) - must be a function.  Instead got a `'+rttc.getDisplayType(runtimeLamdaFn)+'`:\n'+util.inspect(runtimeLamdaFn));
  }

  // Look up the definition of this lamda input from the parent machine def.
  var parentLamdaInput = parentMachine.inputs[nameOfLamdaInput];

  // Now build the definition for the lamda machine using the contract.
  var lamdaMachineDef = {

    sync: !!parentLamdaInput.contract.sync,

    cacheable: !!parentLamdaInput.contract.cacheable,

    fn: runtimeLamdaFn,

    // Exits for the lamda function may be specified as either `provides` or `inputs`
    inputs: _.reduce(parentLamdaInput.contract.provides||parentLamdaInput.contract.inputs, function buildEachInputDefForLamdaMachine(memo, def, name){

      memo[name] = _.extend({}, def);

      // Parse special lamda defintion syntax to deduce the appropriate example
      if (def.like) {
        memo[name].example = parentMachine.inputs[def.like].example;
        delete memo[name].like;
      }
      else if (def.itemOf) {
        var referenced = parentMachine.inputs[def.itemOf];
        memo[name].example = (referenced.example.length === 0 ? undefined : referenced.example[0]);
        delete memo[name].itemOf;
      }

      return memo;
    }, {}),

    // Exits for the lamda function may be specified as either `expects` or `exits`
    exits: _.reduce(parentLamdaInput.contract.expects || parentLamdaInput.contract.exits, function buildEachExitDefForLamdaMachine(memo, def, name){
      memo[name] = _.extend(memo[name]||{}, def);

      // Parse special lamda defintion syntax to deduce the appropriate example
      if (def.like) {
        memo[name].example = parentMachine.inputs[def.like].example;
        delete memo[name].like;
      }
      else if (def.itemOf) {
        var referenced = parentMachine.inputs[def.itemOf];
        memo[name].example = (referenced.example.length === 0 ? undefined : referenced.example[0]);
        delete memo[name].itemOf;
      }
      return memo;
    }, {})

  };


  // Construct and return the machine instance
  return Machine.build(lamdaMachineDef);

};
