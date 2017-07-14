/**
 * Module dependencies
 */

var util = require('util');
var _ = require('@sailshq/lodash');
var flaverr = require('flaverr');

var build = require('./lib/build');
var getMethodName = require('./lib/get-method-name');
var pack = require('./lib/pack');
var getIsProduction = require('./lib/private/get-is-production');

var RELEASE_LICENSE = require('./package.json').license;
var RELEASE_SERIES = 'gen2';
var RELEASE_VERSION = require('./package.json').version;


/**
 * Machine()
 *
 * @type {Function}
 * @properties
 *   .build()
 *   .buildWithCustomUsage()
 *   .pack()
 *   .getMethodName()
 */

module.exports = build;



//  ███████╗████████╗ █████╗ ████████╗██╗ ██████╗    ███╗   ███╗███████╗████████╗██╗  ██╗ ██████╗ ██████╗ ███████╗
//  ██╔════╝╚══██╔══╝██╔══██╗╚══██╔══╝██║██╔════╝    ████╗ ████║██╔════╝╚══██╔══╝██║  ██║██╔═══██╗██╔══██╗██╔════╝
//  ███████╗   ██║   ███████║   ██║   ██║██║         ██╔████╔██║█████╗     ██║   ███████║██║   ██║██║  ██║███████╗
//  ╚════██║   ██║   ██╔══██║   ██║   ██║██║         ██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██║   ██║██║  ██║╚════██║
//  ███████║   ██║   ██║  ██║   ██║   ██║╚██████╗    ██║ ╚═╝ ██║███████╗   ██║   ██║  ██║╚██████╔╝██████╔╝███████║
//  ╚══════╝   ╚═╝   ╚═╝  ╚═╝   ╚═╝   ╚═╝ ╚═════╝    ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝
//


/**
 * .getMethodName()
 *
 * See lib/get-method-name.js
 */
module.exports.getMethodName = getMethodName;



/**
 * .pack()
 *
 * See lib/pack.js
 */
module.exports.pack = pack;





/**
 * .VERSION
 * .version
 *
 * @type {String}
 */
module.exports.VERSION = RELEASE_VERSION;
module.exports.version = RELEASE_VERSION;



/**
 * .inspect()
 *
 * When the Machine constructor is inspected (e.g. `util.inspect()` / `console.log()`),
 * pretty print the current version of node-machine, with license information and a link
 * to the documentation.
 *
 * @returns {String}
 */
module.exports.inspect = function () {
  return ''+
  '---------------------------------------------------\n'+
  ' machine'+/*'   (runtime environment)'+*/'\n'+
  ' v'+RELEASE_VERSION+' ('+RELEASE_SERIES+')\n'+
  ' \n'+
  ' • License   : '+RELEASE_LICENSE+'\n'+
  ' • Package   : http://npmjs.com/package/machine\n'+
  ' • Questions : https://sailsjs.com/support\n'+
  '---------------------------------------------------\n';
};


/**
 * .build()
 *
 * Build a wet (callable) machine.
 *
 * @returns {Function}
 */
module.exports.build = function(){
  // console.warn('WARNING: As of v15, machine should be called directly instead of using `.build()`.  (Adjusting for you this time...)');
  return this.apply(undefined, arguments);
};

/**
 * .buildWithCustomUsage()
 *
 * Return a machine function with a custom usage style.
 *
 * @property {Dictionary} def
 * @property {String?} arginStyle  ("named" or "serial")
 * @property {String?} execStyle  ("deferred" or "immediate")
 */
module.exports.buildWithCustomUsage = function (opts) {

  // Assert valid usage of this method.
  // > (in production, we skip this stuff to save cycles.  We can get away w/ that
  // > because we only include this here to provide better error msgs in development
  // > anyway)
  if (!getIsProduction()) {
    if (!_.isObject(opts.def) || _.isArray(opts.def) || _.isFunction(opts.def)) {
      throw new Error('Consistency violation: `def` must be a dictionary.  But instead got: '+util.inspect(opts.def, {depth: 5}));
    }
    if (opts.arginStyle !== undefined && !_.contains(['named','serial'], opts.arginStyle)) {
      throw new Error('Consistency violation: If specified, `arginStyle` must be either "named" or "serial".  But instead got: '+util.inspect(opts.arginStyle, {depth: 5}));
    }
    if (opts.execStyle !== undefined && !_.contains(['deferred','immediate'], opts.execStyle)) {
      throw new Error('Consistency violation: If specified, `execStyle` must be either "deferred" or "immediate".  But instead got: '+util.inspect(opts.execStyle, {depth: 5}));
    }
    var VALID_OPTIONS = ['def', 'arginStyle', 'execStyle'];
    var extraneousOpts = _.difference(_.keys(opts), VALID_OPTIONS);
    if (extraneousOpts.length > 0) {
      throw new Error('Consistency violation: Unrecognized option(s): '+util.inspect(extraneousOpts, {depth: 5}));
    }
  }//ﬁ


  // Verify correctness of node-machine definition.
  var nmDef = opts.def;// TODO

  var arginStyle = opts.arginStyle || 'named';
  var execStyle = opts.execStyle || 'deferred';

  return function (){

    var argins = {};
    switch (arginStyle) {

      case 'named':
        argins = arguments[0];
        break;

      case 'serial':
        _.each(arguments, function(argin, i){
          var supposedInputName = nmDef.args[i];
          argins[supposedInputName] = argin;
        });
        // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
        // FUTURE: Consider more full-featured support for serial args by using smarter arg-reading logic
        // and supporting a richer symbol language in the `args` prop on machine defs.
        //
        // > Note: This is the same idea as "invocation style" or "invocation type" -- i.e. as envisioned
        // > for performance improvements when ideating with jdalton earlier in 2017 (see node-machine/spec
        // > repo for details/memory-jogging)
        //
        // For example, instead of:
        //
        // ```
        // var add = Machine.build(nmDef);
        // // ...
        // var result = add({a:1,b:1}).execSync();
        // ```
        //
        // You could do:
        // ```
        // var add = Machine.buildWithCustomUsage({
        //   arginStyle: 'serial',
        //   def: _.extend({ args: ['a','b'] }, nmDef)
        // });
        // // ...
        // var result = add(1,2).execSync();
        // ```
        //
        // Or even:
        // ```
        // var add = Machine.buildWithCustomUsage({
        //   arginStyle: 'serial',   // vs. "named"
        //   execStyle: 'immediate', // vs. "deferred"
        //   def: _.extend({ args: ['a','b'] }, nmDef)
        // });
        // // ...
        // var result = add(1,2);
        // ```
        //
        // Same idea for asynchronous logic:
        // (using the `immediate` exec style, a promise is returned, instead of the actual result)
        // ```
        // var fetchTweets = Machine.buildWithCustomUsage({
        //   arginStyle: 'serial',   // vs. "named"
        //   execStyle: 'immediate', // vs. "deferred"
        //   def: _.extend({
        //     args: [
        //       [ 'tweetSearchQuery','done()' ],
        //       [ 'tweetSearchQuery','{...}', 'done()' ]
        //     ]
        //   }, nmDef)
        // });
        // // ...
        // var result = await fetchTweets('twinkle', {lat: 37.2332, long: -92.323852});
        // ```
        //
        // One more example:
        // ```
        // var fetchTweets = Machine.buildWithCustomUsage({
        //   arginStyle: 'named',   // vs. "serial"
        //   execStyle: 'immediate', // vs. "deferred"
        //   def: _.extend({
        //     args: [
        //       [ 'tweetSearchQuery','done()' ],
        //       [ 'tweetSearchQuery','{...}', 'done()' ]
        //     ]
        //   }, nmDef)
        // });
        // // ...
        // var result = await fetchTweets({
        //   tweetSearchQuery: 'twinkle',
        //   lat: 37.2332,
        //   long: -92.323852
        // });
        // ```
        //
        // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
        break;

      default:
        throw flaverr({name:'UsageError'}, new Error('Unrecognized arginStyle: "'+arginStyle+'"'));
    }

    var basicRunner = module.exports.build(nmDef);
    var deferredObj = basicRunner(argins);

    switch (execStyle) {

      case 'deferred':
        return deferredObj;

      case 'immediate':
        if (nmDef.sync) {
          return deferredObj.execSync();
        }
        else {
          return deferredObj.toPromise();
        }

      default:
        throw flaverr({name:'UsageError'}, new Error('Unrecognized execStyle: "'+execStyle+'"'));

    }

  };

};
