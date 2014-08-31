/**
 * Module dependencies
 */

var util = require('util');
var _ = require('lodash');



/**
 * Build the `inspect` function (to determine console output)
 * for a machine definition.
 *
 * @param  {Object} machineDef
 * @return {Function}
 */
module.exports = function buildInspectFn (machineDef){
  return function (){
    return util.format(
      '-----------------------------------------\n'+
      ' [Machine: %s]\n'+
      ' %s\n'+
      ' \n'+
      ' Inputs:'+
      (_.reduce(machineDef.inputs, function (memo, inputDef, inputName){

        memo += util.format('\n  • %s',inputName);

        if (inputDef.example) {

          var exampleStr = inputDef.example;
          if (typeof inputDef.example === 'string') {
            exampleStr = '"'+inputDef.example+'"';
          }
          else if (typeof inputDef.example === 'object') {
            exampleStr = '\n'+util.inspect(inputDef.example, false, null);
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
      '-----------------------------------------\n',
      machineDef.id,
      machineDef.description
    );
  };
};
