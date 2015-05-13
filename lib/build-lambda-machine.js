/**
 * Module dependencies
 */

var _ = require('lodash');




/**
 * [buildLambdaMachine description]
 * @param  {[type]} runtimeLambda     [description]
 * @param  {[type]} nameOfLambdaInput [description]
 * @param  {[type]} parentMachine     [description]
 * @return {[type]}                   [description]
 */
module.exports = function buildLambdaMachine(runtimeLambda, nameOfLambdaInput, parentMachine){

  // Get access to Machine constructor in order to call `build` below.
  var Machine = parentMachine.constructor;

  // Parse the provided lambda input value
  var fn;
  if (_.isFunction(runtimeLambda)){
    fn = runtimeLambda;
  }
  else if (_.isString(runtimeLambda)){
    try {
      eval('fn='+runtimeLambda);
    }
    catch (e){
      return exits.error('Could not parse usable function from provided `iteratee` string. Details:\n'+e.stack);
    }
  }
  else {
    return exits.error(new Error('invalid lambda provided (`->`) - must be a function'));
  }

  // Look up the definition of this lambda input from the parent machine def.
  var parentLambdaInput = parentMachine.inputs[nameOfLambdaInput];

  // Now build the definition for the lambda machine using the contract.
  var lambdaMachineDef = {

    fn: fn,

    inputs: _.reduce(parentLambdaInput.contract.provides, function buildEachInputDefForLambdaMachine(lambdaInputDefs, def, name){

      lambdaInputDefs[name] = _.extend({}, def);

      // Parse special lambda defintion syntax to deduce the appropriate example
      if (def.like) {
        lambdaInputDefs[name].example = parentMachine.inputs[def.like].example;
        delete lambdaInputDefs[name].like;
      }
      else if (def.itemOf) {
        var referenced = parentMachine.inputs[def.itemOf];
        lambdaInputDefs[name].example = (referenced.example.length === 0 ? '*' : referenced.example[0]);
        delete lambdaInputDefs[name].itemOf;
      }

      return lambdaInputDefs;
    }, {}),

    exits: _.reduce(parentLambdaInput.contract.expects, function buildEachExitDefForLambdaMachine(lambdaExitDefs, def, name){
      lambdaExitDefs[name] = _.extend(lambdaExitDefs[name]||{}, def);

      // Parse special lambda defintion syntax to deduce the appropriate example
      if (def.like) {
        lambdaExitDefs[name].example = parentMachine.inputs[def.like].example;
        delete lambdaExitDefs[name].like;
      }
      else if (def.itemOf) {
        var referenced = parentMachine.inputs[def.itemOf];
        lambdaExitDefs[name].example = (referenced.example.length === 0 ? '*' : referenced.example[0]);
        delete lambdaExitDefs[name].itemOf;
      }
      return lambdaExitDefs;
    }, {})

  };


  // Construct and return the machine instance
  return Machine.build(lambdaMachineDef);

}
