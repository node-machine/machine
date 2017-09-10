/**
 * Module dependencies
 */

var util = require('util');
var _ = require('@sailshq/lodash');
var flaverr = require('flaverr');
// var rttc = require('rttc');

var getIsProduction = require('./get-is-production');
var getMethodName = require('../get-method-name');
var GENERIC_HELP_SUFFIX = require('./GENERIC_HELP_SUFFIX.string');



/**
 * normalizeMachineDef()
 *
 * Verify/normalize a (dry) node-machine definition, potentially coercing it a bit.
 *
 * > Note that this modifies properties in-place, as a direct reference!
 *
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * @param  {Dictionary} nmDef      [machine definition from implementor-land]
 * @param  {Error?} omen
 *
 * @returns {Array}     [implementation problems]
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 */

module.exports = function normalizeMachineDef(nmDef, omen){

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
  nmDef.identity = nmDef.identity || (nmDef.friendlyName && _.kebabCase(nmDef.friendlyName)) || (nmDef.description && _.kebabCase(nmDef.description)).replace(/[^a-zA-Z0-9]/g, '') || undefined;
  if (!nmDef.identity) {
    throw flaverr({
      name: 'ImplementationError',
      message:
        'Could not infer an identity.  (Please provide a `friendlyName` in your definition.)\n'+
        GENERIC_HELP_SUFFIX
    }, omen);
  }//•

  // Compute the "method name" of this machine, for use in error messages below.
  var methodName = getMethodName(nmDef.identity);

  // Check `fn`.
  if (nmDef.fn===undefined) {
    throw flaverr({
      name: 'ImplementationError',
      message:
        'Could not interpret "'+methodName+'".\n'+
        'Definition is missing the `fn` property.\n'+
        GENERIC_HELP_SUFFIX
    }, omen);
  }//•
  if (!_.isFunction(nmDef.fn)) {
    throw flaverr({
      name: 'ImplementationError',
      message:
        'Could not interpret "'+methodName+'".\n'+
        'Definition has an invalid `fn` property.  (Please use a valid JavaScript function.)\n'+
        GENERIC_HELP_SUFFIX
    }, omen);
  }//•

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // FUTURE: Detect whether we're dealing with an arrow function.
  //
  // In the future, we may end up logging a warning about `this` probably not working
  // as expected.  (Thanks @elmigranto and @ljharb!  -- https://stackoverflow.com/a/38830947)
  // (See also https://github.com/ljharb/is-arrow-function/blob/df0c69e2188c7f2a7773116c370136d646fc193f/index.js)
  // ```
  // var isArrowFunction = (function(){
  //   var fnStr = nmDef.fn.toString();
  //   if (fnStr.length === 0) { return false; }
  //   var RX_IS_NOT_ARROW_FN = /^\s*function/;
  //   if (RX_IS_NOT_ARROW_FN.test(fnStr)) { return false; }
  //   var RX_IS_ARROW_FN_WITH_PARENTHESES = /^\([^)]*\) *=>/;
  //   if (!RX_IS_ARROW_FN_WITH_PARENTHESES.test(fnStr)) { return false; }
  //   var RX_IS_ARROW_FN_WITHOUT_PARENTHESES = /^[^=]*=>/;
  //   if (!RX_IS_ARROW_FN_WITHOUT_PARENTHESES.test(fnStr)) { return false; }
  //   return true;
  // })();//†
  //
  // if (isArrowFunction) {
  //   // …
  // }//ﬁ
  // ```
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


  // Check `sync`

  // Check `timeout`
  if (nmDef.timeout!==undefined){
    if (!_.isNumber(nmDef.timeout)){
      throw flaverr({
        name: 'ImplementationError',
        message:
          'Definition contains invalid `timeout` property.  (Must be a number greater than zero.)\n'+
          GENERIC_HELP_SUFFIX
      }, omen);
    }//•
  }//ﬁ

  // FUTURE: Check `sideEffects`

  // FUTURE: Check `implementationType`

  // Sanitize input definitions.
  nmDef.inputs = nmDef.inputs || {};
  _.each(nmDef.inputs, function (inputDef, inputCodeName) {// eslint-disable-line no-unused-vars

    // if (!_.isString(inputDef.type) || inputDef.type === '' && inputDef.example === undefined) {
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
