/**
 * Module dependencies
 */

var util = require('util');
var _ = require('@sailshq/lodash');



/**
 * buildInspectFn()
 *
 * Build and return the `inspect` function used for both:
 * (A) callable ("wet") machine wrappers, and
 * (B) live machine instances
 *
 * @param  {Function|LiveMachine} wetOrLiveMachine
 * @return {Function}
 */
module.exports = function buildInspectFn (wetOrLiveMachine){

  return function (){

    return util.format(
      '-----------------------------------------\n'+
      // ' [Machine: '+wetOrLiveMachine.identity+']\n'+
      ' ['+wetOrLiveMachine.identity+']\n'+
      (wetOrLiveMachine.description ? ' '+wetOrLiveMachine.description + '\n' : '')+
      ' \n'+
      ' Inputs:'+
      (_.reduce(wetOrLiveMachine.inputs, function (memo, inputDef, inputName){
        //(* required)
        memo += util.format('\n %s %s',inputDef.required?' -*-':'  - ', inputName);

        // This would be handy, but it looks terrible.
        // So instead, we just display (type: object)
        // else if (typeof inputDef.example === 'object') {
        // exampleStr = '\n'+util.inspect(inputDef.example, false, null);
        // }

        // Coerce types into simpler, more terminal-readable things
        inputDef = _.cloneDeep(inputDef);
        if (typeof inputDef.example === 'object' || typeof inputDef.type === 'object') {
          inputDef.type = 'object';
          delete inputDef.example;
        }

        if (inputDef.example) {
          var exampleStr = inputDef.example;
          if (typeof inputDef.example === 'string') {
            exampleStr = '"'+inputDef.example+'"';
          }
          memo += util.format('     (e.g. %s)', exampleStr);
        }
        else if (inputDef.type) {
          memo += util.format('      (type: %s)', inputDef.type);
        }
        else {
          memo += '\n';
        }
        return memo;
      }, '')||' (n/a)')+'\n'+
      '-----------------------------------------\n'
    );

  };//</custom inspect() fn>

};
