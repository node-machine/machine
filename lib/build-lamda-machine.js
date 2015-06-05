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

    inputs: _.reduce(parentLamdaInput.contract.provides, function buildEachInputDefForLamdaMachine(lamdaInputDefs, def, name){

      lamdaInputDefs[name] = _.extend({}, def);

      // Parse special lamda defintion syntax to deduce the appropriate example
      if (def.like) {
        lamdaInputDefs[name].example = parentMachine.inputs[def.like].example;
        delete lamdaInputDefs[name].like;
      }
      else if (def.itemOf) {
        var referenced = parentMachine.inputs[def.itemOf];
        lamdaInputDefs[name].example = (referenced.example.length === 0 ? undefined : referenced.example[0]);
        delete lamdaInputDefs[name].itemOf;
      }

      return lamdaInputDefs;
    }, {}),

    exits: _.reduce(parentLamdaInput.contract.expects, function buildEachExitDefForLamdaMachine(lamdaExitDefs, def, name){
      lamdaExitDefs[name] = _.extend(lamdaExitDefs[name]||{}, def);

      // Parse special lamda defintion syntax to deduce the appropriate example
      if (def.like) {
        lamdaExitDefs[name].example = parentMachine.inputs[def.like].example;
        delete lamdaExitDefs[name].like;
      }
      else if (def.itemOf) {
        var referenced = parentMachine.inputs[def.itemOf];
        lamdaExitDefs[name].example = (referenced.example.length === 0 ? undefined : referenced.example[0]);
        delete lamdaExitDefs[name].itemOf;
      }
      return lamdaExitDefs;
    }, {})

  };


  // Construct and return the machine instance
  return Machine.build(lamdaMachineDef);

};
