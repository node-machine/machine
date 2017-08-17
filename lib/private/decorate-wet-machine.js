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


  /**
   * .customize()
   *
   * Re-build a customized version of this machine on the fly, using the specified
   * custom usage options.
   * > If this exact customization has been used before for this machine,
   * > the customized machine will be _cloned and cached_.  This works much
   * > like Node's core require() cache, and is designed to improve performance
   * > by avoiding unnecessarily duplicating work on a per-call basis.
   *
   * @param {Dictionary} customUsageOpts
   *   @property {String?} arginStyle  ("named" or "serial")
   *   @property {String?} execStyle  ("deferred" or "immediate")
   *   … (For full reference of opts, see `buildWithCustomUsage()`)
   *
   * @returns {Ref}  [a custom, spin-off duplicate of this set machine w/ custom usage]
   */
  var cachedCustomizations;
  Object.defineProperty(wetMachine, 'customize', {
    enumerable: false,
    configurable: false,
    writable: true,
    value: function customize(customUsageOpts){
      if (!customUsageOpts || _.isEqual(customUsageOpts, {})) { throw new Error('Consistency violation: Cannot call `.customize()` without providing any custom usage options!  Please specify at least one option such as "arginStyle" or "execStyle".'); }
      if (!_.isObject(customUsageOpts) || _.isArray(customUsageOpts) || _.isFunction(customUsageOpts)) { throw new Error('Consistency violation: `.customize()` must be called with a dictionary of custom usage options.'); }
      if (customUsageOpts.def !== undefined) { throw new Error('Consistency violation: Cannot specify `def` when calling `.customize()` on a package!'); }

      var hashOfCustomUsageOpts = _.reduce(hashOfCustomUsageOpts, function(hashSoFar, optValue, optKey){
        hashSoFar += optKey+':'+JSON.stringify(optValue)+'|';
        return hashSoFar;
      }, '');

      // Use cached customization, if possible.
      if (cachedCustomizations[hashOfCustomUsageOpts]) {
        return cachedCustomizations[hashOfCustomUsageOpts];
      }//-•

      var customizedWetMachine = Machine.buildWithCustomUsage(_.extend({
        def: wetMachine.getDef(),
      }, customUsageOpts));

      // Cache this customization in case `.customize()` gets called again.
      cachedCustomizations[hashOfCustomUsageOpts] = customizedWetMachine;

      return customizedWetMachine;
    }//ƒ
  });//…)


};
