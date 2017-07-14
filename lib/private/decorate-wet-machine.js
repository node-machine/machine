/**
 * Module dependencies
 */

var util = require('util');
var _ = require('@sailshq/lodash');
var rttc = require('rttc');

var getMethodName = require('../get-method-name');


/**
 * decorateWetMachine()
 *
 * Attach additional properties to the provided "wet" (i.e. callable) machine.
 * (This includes building a dynamic `inspect()` property.)
 *
 * @param  {Function} wetMachine    [the callable, "wet" machine function]
 * @param  {Dictionary} nmDef       [the original, "dry" machine definition]
 */

module.exports = function decorateWetMachine(wetMachine, nmDef){

  /**
   * .getDef()
   *
   * Get the original, "dry" machine definition that was used to construct this "wet" machine.
   * (Be careful: The returned definition should never be modified!)
   *
   * @returns {Ref}  [the "dry" node machine definition]
   */

  Object.defineProperty(wetMachine, 'getDef', {
    enumerable: true,
    configurable: false,
    writable: false,
    value: function getDef(){
      return nmDef;
    }//ƒ
  });


  /**
   * .toJSON()
   *
   * (Automatically invoked before JSON stringification when this is passed
   * into `JSON.stringify()`)
   */

  Object.defineProperty(wetMachine, 'toJSON', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: function toJSON(){
      // Note that, if this "dry" machine definition is actually JSON-stringified afterwards,
      // the stringification process will be lossy.  Things like `fn` are not actually JSON serializable.
      // (To overcome this, use something like rttc.dehydrate() in userland code.)
      return wetMachine.getDef();
    }//ƒ
  });


  /**
   * .toString()
   *
   * (Automatically invoked before casting, string concatenation, etc.)
   *
   * This can be overridden.
   */

  Object.defineProperty(wetMachine, 'toString', {
    enumerable: false,
    configurable: false,
    writable: true,
    value: function toString(){
      return '[Machine: '+nmDef.identity+']';
    }//ƒ
  });


  /**
   * .inspect()
   *
   * (Automatically invoked in Node.js environments when this is passed into `util.inspect()` or `console.log()`)
   *
   * This can be overridden.
   */

  Object.defineProperty(wetMachine, 'inspect', {
    enumerable: false,
    configurable: false,
    writable: true,
    value: function inspect(){

      return ''+
      '-----------------------------------------\n'+
      // NEW WAY:
      ' .'+getMethodName(nmDef.identity)+'()\n'+
      '\n'+
      // OLD WAY:
      // ' ['+nmDef.identity+']\n'+
      (
        nmDef.description ? (' '+nmDef.description+'\n') : ''
      )+
      ' \n'+
      ' Inputs:'+
      (
        _.reduce(nmDef.inputs, function (memo, inputDef, inputCodeName){
          memo += '\n '+(inputDef.required?' -*-':'  - ')+' '+inputCodeName;

          if (!_.isUndefined(inputDef.example)) {
            var displayType = rttc.inferDisplayType(inputDef.example);
            if (displayType === 'string' || displayType === 'number') {
              memo += '     (e.g. '+util.inspect(inputDef.example, {depth: 5})+')';
            }
            else {
              memo += '     (type: '+displayType+')';
            }
          }
          else if (inputDef.type) {
            memo += '      (type: '+inputDef.type+')';
          }
          return memo;

        }, '')||
        ' (n/a)'
      )+
      '\n'+
      '-----------------------------------------\n';

    }//ƒ
  });//…)

};
