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
 * @param  {[type]} rootMachine     [description]
 * @return {[type]}                   [description]
 */
module.exports = function buildLamdaMachine(runtimeLamdaFn, nameOfLamdaInput, parentMachine, rootMachine){

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

    identity: runtimeLamdaFn.name || [parentMachine.identity,nameOfLamdaInput].join('.'),

    sync: !!parentLamdaInput.contract.sync,

    cacheable: !!parentLamdaInput.contract.cacheable,

    fn: runtimeLamdaFn,

    // Exits for the lamda function may be specified as either `provides` or `inputs`
    inputs: _.reduce(parentLamdaInput.contract.provides||parentLamdaInput.contract.inputs, function buildEachInputDefForLamdaMachine(memo, def, name){

      memo[name] = _.extend({}, def);

      // Parse special lamda defintion syntax to deduce the appropriate example
      if (_.isString(def.like)) {
        if (!rootMachine.inputs[def.like]) {
          throw new Error(util.format('Could not find input `%s` in root machine (%s)', def.like, rootMachine.identity));
        }
        memo[name].example = rootMachine.inputs[def.like].example;
        delete memo[name].like;
      }
      else if (_.isString(def.itemOf)) {
        if (rootMachine.inputs[def.itemOf].example.length > 0) {
          memo[name].example = rootMachine.inputs[def.itemOf].example[0];
        }
        else {
          memo[name].example = undefined;
        }
        delete memo[name].itemOf;
      }

      return memo;
    }, {}),

    // Exits for the lamda function may be specified as either `expects` or `exits`
    exits: _.reduce(parentLamdaInput.contract.expects || parentLamdaInput.contract.exits, function buildEachExitDefForLamdaMachine(memo, def, name){
      memo[name] = _.extend(memo[name]||{}, def);

      // Parse special lamda defintion syntax to deduce the appropriate example
      if (_.isString(def.like)) {
        memo[name].example = rootMachine.inputs[def.like].example;
        delete memo[name].like;
      }
      else if (_.isString(def.itemOf)) {
        if (rootMachine.inputs[def.itemOf].example.length > 0) {
          memo[name].example = rootMachine.inputs[def.itemOf].example[0];
        }
        else {
          memo[name].example = undefined;
        }
        delete memo[name].itemOf;
      }
      return memo;
    }, {})

  };

  // Track the root machine on the new machine definition.
  // (i.e. a contract inside a contract inside a contract
  // still maintains a reference to the top-level machine instance)
  lamdaMachineDef._rootMachine = rootMachine;
  // console.log('lamdaMachineDef._rootMachine:',lamdaMachineDef._rootMachine);

  // Construct and return the machine instance
  var instance = Machine.build(lamdaMachineDef);
  // console.log('INSTANCE._rootMachine:',instance._rootMachine);

  // Track some stack info so we know that this is an ad-hoc
  // lamda machine that was built automatically from a contract,
  // and we can understand more about the context of where it came
  // from.
  //
  // All ad-hoc lamda machines originate from a top-level "origin"
  // machine.  We don't keep a reference to that machine here (to
  // avoid any risk of causing memory leaks) but we do track the depth.
  //
  // If `depth` is odd, then it is intended that this machine
  // be _provided_ by the user of the top-level "origin" machine
  // and _executed_ by the implementor of the origin machine.
  // If depth is even, it means the opposite.
  //
  // For example, a `depth` of 1 means this lamda machine was automatically
  // built from a function provided by the _user_ of the origin machine.
  // And therefore it will be called by the _implementation_ of the origin
  // machine (i.e. its `fn`).
  //
  // Now contrast that with a `depth` of 2, which indicates the opposite-- that
  // this lamda machine should be called by the _user_ of the origin machine,
  // and that it should be built from a function provided from within the origin
  // machine's implementation.
  instance._stackDepth = parentMachine._stackDepth+1;

  return instance;

};
