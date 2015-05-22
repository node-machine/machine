/**
 * Module dependencies
 */

var _ = require('lodash');




/**
 * [buildLamdaMachine description]
 * @param  {[type]} runtimeLamda     [description]
 * @param  {[type]} nameOfLamdaInput [description]
 * @param  {[type]} parentMachine     [description]
 * @return {[type]}                   [description]
 */
module.exports = function buildLamdaMachine(runtimeLamda, nameOfLamdaInput, parentMachine){

  // Get access to Machine constructor in order to call `build` below.
  var Machine = parentMachine.constructor;

  // Parse the provided lamda input value
  var fn;
  if (_.isFunction(runtimeLamda)){
    fn = runtimeLamda;
  }
  else if (_.isString(runtimeLamda)){
    try {
      eval('fn=function(inputs, exits, env){'+runtimeLamda+'}');
    }
    catch (e){
      return exits.error('Could not parse usable lamda function from provided string. Details:\n'+e.stack);
    }
  }
  else {
    return exits.error(new Error('invalid lamda (`->`) provided - must be a function'));
  }

  // Look up the definition of this lamda input from the parent machine def.
  var parentLamdaInput = parentMachine.inputs[nameOfLamdaInput];

  // Now build the definition for the lamda machine using the contract.
  var lamdaMachineDef = {

    fn: fn,

    inputs: _.reduce(parentLamdaInput.contract.provides, function buildEachInputDefForLamdaMachine(lamdaInputDefs, def, name){

      lamdaInputDefs[name] = _.extend({}, def);

      // Parse special lamda defintion syntax to deduce the appropriate example
      if (def.like) {
        lamdaInputDefs[name].example = parentMachine.inputs[def.like].example;
        delete lamdaInputDefs[name].like;
      }
      else if (def.itemOf) {
        var referenced = parentMachine.inputs[def.itemOf];
        lamdaInputDefs[name].example = (referenced.example.length === 0 ? '*' : referenced.example[0]);
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
        lamdaExitDefs[name].example = (referenced.example.length === 0 ? '*' : referenced.example[0]);
        delete lamdaExitDefs[name].itemOf;
      }
      return lamdaExitDefs;
    }, {})

  };


  // Construct and return the machine instance
  return Machine.build(lamdaMachineDef);

}
