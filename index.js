/**
 * Module dependencies
 */

var build = require('./lib/build');
var getMethodName = require('./lib/get-method-name');
var pack = require('./lib/pack');
var buildWithCustomUsage = require('./lib/build-with-custom-usage');

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
module.exports.version = RELEASE_VERSION;//« for backwards compatibility



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
module.exports.build = build;


/**
 * .buildWithCustomUsage()
 *
 * Return a machine function with a custom usage style.
 *
 * @property {Dictionary} def
 * @property {String?} arginStyle  ("named" or "serial")
 * @property {String?} execStyle  ("deferred" or "immediate")
 */
module.exports.buildWithCustomUsage = buildWithCustomUsage;
