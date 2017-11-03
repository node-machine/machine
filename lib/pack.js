/**
 * Module dependencies
 */

var util = require('util');
var path = require('path');
var _ = require('@sailshq/lodash');
var flaverr = require('flaverr');
var getIsProductionWithoutDebug = require('./private/get-is-production-without-debug');


/**
 * .pack()
 *
 * Load modules in the specified directory and expose them as
 * a dictionary of set machine instances.
 *
 * > This method is used by default in the index.js file of generated machinepacks.
 *
 * - - - - - - - - - - - - - - - - - - - - - - - - -
 * @required {Dictionary?|String} options
 *       Either the absolute path to the location of the modules to load & pack (see `dir` below)
 *       -OR- a dictionary of options:
 *
 *          @property {String} dir
 *              The absolute path to the location of the modules to load & pack.
 *              (If a relative path is specified, it will be resolved relative  from the `pkg`)
 *
 *          @property {Dictionary} pkg
 *              The package dictionary (i.e. what package.json exports).
 *              Will be used for refining the directory to load modules from.
 *              If `pkg` is not specified, all `.js` files in `dir` will be loaded
 *              (with the exception of `index.js`, which is reserved.)
 *
 *
 * @returns {Dictionary}
 *          A dictionary of packed modules with camel-cased keys ("method names"), and functions ("wet machines") as values.
 */

module.exports = function pack(options){

  // If specified as a string, understand as `options.dir`.
  if (_.isString(options)) {
    options = { dir: options };
  }
  else if (_.isUndefined(options)) {
    options = {};
  }
  else if (!_.isObject(options) || _.isFunction(options) || _.isArray(options)) {
    throw new Error('Usage error: `.pack()` expects a dictionary of options, but instead got:'+util.inspect(options, {depth:null}));
  }

  // Validate `dir`
  if (_.isUndefined(options.dir)) {
    throw new Error('Usage error: `.pack()` should be provided a `dir` option, but it was not provided.  Received options:'+util.inspect(options, {depth:null}));
  }
  if (!_.isString(options.dir)) {
    throw new Error('Usage error: `.pack()` received a `dir` path which is not a string:'+util.inspect(options.dir, {depth:null}));
  }

  // Validate `pkg`
  // (if specified, must be a dictionary)
  if (!_.isUndefined(options.pkg)) {
    if (!_.isObject(options.pkg) || _.isArray(options.pkg) || _.isFunction(options.pkg)) {
      throw new Error('Usage error: `.pack()` received an invalid `pkg`.  If specified, `pkg` must be a dictionary, but instead got:'+util.inspect(options.pkg, {depth:null}));
    }
  }


  // Build up a constant array of unconventional method names
  // (used below to show a warning if a machine identity looks too similar to native JS or Node stuff.)
  var UNCONVENTIONAL_METHOD_NAMES = [
    'inspect', 'toString', 'valueOf', 'toLocaleString', 'toJSON',
    'prototype', 'constructor',
    'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable',
    'customize'
  ];


  // Sanity
  if (!_.isObject(this) || !_.isFunction(this.build)) { throw new Error('Consistency violation: Context (`this`) is wrong in Machine.pack()!'); }

  // Get the `Machine` constructor
  var Machine = this;

  // Now set up the dictionary that hold our machines.
  var Machinepack = {};


  // Set up a home for cached pack customizations.
  // (See `customize()` below for more information.)
  var cachedCustomPacks = {};


  /**
   * .customize()
   *
   * Build a customized version of this pack, with machines re-built to work
   * using the specified custom usage options.
   * > If this exact customization has been used before for this pack,
   * > the customized pack will be _cloned and cached_.  This works much
   * > like Node's core require() cache, and is designed to improve performance
   * > by avoiding unnecessarily duplicating work on a per-call basis.
   *
   * @param {Dictionary} customUsageOpts
   *   @property {String?} arginStyle  ("named" or "serial")
   *   @property {String?} execStyle  ("deferred" or "immediate")
   *   … (For full reference of opts, see `buildWithCustomUsage()`)
   *
   * @returns {Ref}  [a custom, spin-off duplicate of this pack w/ custom usage]
   */

  Object.defineProperty(Machinepack, 'customize', {
    enumerable: false,
    configurable: false,
    writable: true,
    value: function customize(customUsageOpts){
      if (!getIsProductionWithoutDebug()) {
        if (!customUsageOpts || _.isEqual(customUsageOpts, {})) { throw new Error('Consistency violation: Cannot call `.customize()` without providing any custom usage options!  Please specify at least one option such as "arginStyle" or "execStyle".'); }
        if (!_.isObject(customUsageOpts) || _.isArray(customUsageOpts) || _.isFunction(customUsageOpts)) { throw new Error('Consistency violation: `.customize()` must be called with a dictionary of custom usage options.'); }
        if (customUsageOpts.def !== undefined) { throw new Error('Consistency violation: Cannot specify `def` when calling `.customize()` on a package!  Instead provide options like "arginStyle" or "execStyle".'); }
      }//ﬁ

      var hashOfCustomUsageOpts = _.reduce(customUsageOpts, function(hashSoFar, optValue, optKey){
        hashSoFar += optKey+':'+JSON.stringify(optValue)+'|';
        return hashSoFar;
      }, '');

      // Use cached customization, if possible.
      if (cachedCustomPacks[hashOfCustomUsageOpts]) {
        return cachedCustomPacks[hashOfCustomUsageOpts];
      }//-•

      var customPack = {};// FUTURE: prepare a proper pack with all the goodies like `.inspect()`
      _.each(this, function(wetMachine, methodName){
        var customizedWetMachine = Machine.buildWithCustomUsage(_.extend({
          def: wetMachine.getDef(),
        }, customUsageOpts));
        customPack[methodName] = customizedWetMachine;
      });

      // Cache this customization in case `.customize()` gets called again.
      cachedCustomPacks[hashOfCustomUsageOpts] = customPack;

      return customPack;
    }//ƒ
  });//…)


  /**
   * .inspect()
   *
   * (Automatically invoked in Node.js environments when this is passed into `util.inspect()` or `console.log()`)
   *
   * This can be overridden.
   */

  Object.defineProperty(Machinepack, 'inspect', {
    enumerable: false,
    configurable: false,
    writable: true,
    value: function inspect(){
      var pkg = options.pkg || {};

      var nmIdentities = _.clone(pkg.machinepack&&pkg.machinepack.machines) || [];
      nmIdentities.sort();

      return ''+
      '-----------------------------------------\n'+
      ' '+(pkg.name || 'anonymous package')+'\n'+
      ' v'+(pkg.version || '?.??.??')+(pkg.license ? '   ('+pkg.license+')' : '')+'\n'+
      // (pkg.name ? ' (http://npmjs.com/package/'+pkg.name+')\n' : '')+
      ' \n'+
      (pkg.description ?
        (' '+pkg.description+'\n\n') :
        ''
      )+
      ' Methods:\n'+
      (
        _.map(nmIdentities, function (nmIdentity){
          return '   · '+Machine.getMethodName(nmIdentity)+'()';
        }).join('\n')||
        ' (n/a)'
      )+'\n'+
      '-----------------------------------------\n';

    }//ƒ
  });//…)


  /**
   * .toString()
   *
   * (Automatically invoked before casting, string concatenation, etc.)
   *
   * This can be overridden.
   */

  Object.defineProperty(Machinepack, 'toString', {
    enumerable: false,
    configurable: false,
    writable: true,
    value: function toString(){
      var pkg = options.pkg||{};
      return '[Package: '+(pkg.name||'anonymous')+']';
    }//ƒ
  });



  //  ┬┌─┐  ╔═╗╦╔═╔═╗  ┬ ┬┌─┐┌─┐  ┌─┐┌─┐┌─┐┌─┐┬┌─┐┬┌─┐┌┬┐
  //  │├┤   ╠═╝╠╩╗║ ╦  │││├─┤└─┐  └─┐├─┘├┤ │  │├┤ │├┤  ││
  //  ┴└    ╩  ╩ ╩╚═╝  └┴┘┴ ┴└─┘  └─┘┴  └─┘└─┘┴└  ┴└─┘─┴┘ooo
  // If `pkg` was specified...
  if (!_.isUndefined(options.pkg)) {

    var machines;
    try {
      machines = options.pkg.machinepack.machines;
    }
    catch (e) {
      throw flaverr('E_INVALID_OPTION', new Error(
        'Failed to instantiate hydrated machinepack using the provided `pkg`.\n'+
        '`pkg` should be a dictionary with a `machinepack` property (also a dictionary, '+
        'with its own array of strings called `machines`).\n'+
        'But the actual `pkg` option provided was:\n'+
        '------------------------------------------------------\n'+
        ''+util.inspect(options.pkg, false, null)+'\n'+
        '------------------------------------------------------\n'+
        'Raw error details:\n'+e.stack)
      );
    }

    // Build a dictionary of all the machines in this pack
    Machinepack = _.reduce(machines, function (memo, machineID) {
      // console.log('machineID:',machineID);

      try {
        // Require and hydrate each static definition into a callable machine fn
        var requirePath = path.resolve(options.dir, options.pkg.machinepack.machineDir || options.pkg.machinepack.machinedir || '', machineID);
        // console.log('requirePath:',requirePath);
        var definition = require(requirePath);
        // console.log('definition.identity:',definition.identity);
        // console.log('!!definition.identity:',!!definition.identity);

        // Attach the string identity as referenced in package.json to
        // the machine definition dictionary as its "identity"
        // (unless the machine definition already has an "identity" explicitly specified)
        definition.identity = definition.identity || machineID;

        // Build the machine.
        var machineInstance = Machine(definition);

        // Determine the method name.
        var methodName = Machine.getMethodName(definition.identity);
        if (_.contains(UNCONVENTIONAL_METHOD_NAMES, methodName)) {
          console.warn('Warning: Machine "'+definition.identity+'" has an unconventional identity that, when converted to a method name (`'+methodName+'`), could conflict with native features of JavaScript/Node.js, or otherwise interfere with the machine runner.  Please consider changing it!');
        }

        // Expose the machine as a method on our Pack dictionary.
        memo[methodName] = machineInstance;
      }
      catch (e) {

        // Check and see if this is a MODULE_ERROR-
        // if so, then it's a very different scenario and we should show a different
        // error message.
        if (e.code === 'MODULE_NOT_FOUND') {
          throw flaverr({
            name: 'ImplementationError',
            code: 'E_MACHINE_NOT_FOUND',
            raw: e
          }, new Error(
            'Failed to load `'+machineID+'`, one of the identities listed in `pkg.machinepack.machines`,\n'+
            'an array of strings which correspond to the filenames of modules in this machinepack.\n\n'+
            'Details:\n'+
            '------------------------------------------------------\n'+
            util.inspect(e, {depth: 5})+'\n'+
            '------------------------------------------------------\n'
          ));
        }

        // --•
        throw (function _buildInvalidMachineError(){
          e.originalError = e;
          e.code = 'E_INVALID_MACHINE';
          e.message = util.format(
          '\n'+
          'Failed to instantiate machine "%s" (listed in `pkg.machinepack.machines`).\n'+
          '`pkg.machinepack.machines` should be an array of strings which correspond \n'+
          'to the filenames of machine modules in this machinepack.\n\n'+
          'The actual `pkg` option provided was:\n'+
          '------------------------------------------------------\n'+
          '%s\n'+
          '------------------------------------------------------\n\n'+
          'Error details:\n',
          machineID,
          util.inspect(options.pkg, false, null),
          e.originalError);
          return e;
        })();//</throw>
      }
      return memo;
    }, Machinepack);
  //  ┌─┐┬  ┌─┐┌─┐  ┌─┐┬┌─┌─┐  ┬ ┬┌─┐┌─┐  ╔╗╔╔═╗╔╦╗  ┌─┐┌─┐┌─┐┌─┐┬┌─┐┬┌─┐┌┬┐
  //  ├┤ │  └─┐├┤   ├─┘├┴┐│ ┬  │││├─┤└─┐  ║║║║ ║ ║   └─┐├─┘├┤ │  │├┤ │├┤  ││
  //  └─┘┴─┘└─┘└─┘  ┴  ┴ ┴└─┘  └┴┘┴ ┴└─┘  ╝╚╝╚═╝ ╩   └─┘┴  └─┘└─┘┴└  ┴└─┘─┴┘
  //
  // e.g.
  // ```
  // foo = machine.pack({
  //   name: 'Foo',
  //   customize: {
  //     arginStyle: 'serial',
  //     execStyle: 'immediate'
  //   },
  //   methods: {
  //     doSomething: {
  //       implementationType: 'classical'
  //       inputs: {
  //         howToDoIt: { type: 'string', required: true },
  //       },
  //       fn: async function(){
  //         console.log('did it');
  //       }
  //     }
  //   }
  // });
  //
  // await foo.doSomething('quickly');
  // ```
  } else if (options.methods) {
    // TODO: attach inspect and toString, using name and version to enhance log output if they were provided
    // TODO: auto-infer identities from key name, if appropriate
    // TODO: build methods
    throw new Error('TODO');
  } else {
    throw new Error('pkg option is mandatory again, for the time being.');
    // FUTURE: MAYBE bring this back instead of the above
    // // Otherwise, neither `pkg` nor `methods` were specified, so just load all `.js` files in `dir`.
    // else {

    //   // Ensure we have an absolute path.
    //   options.dir = path.resolve(options.dir);

    //   // Load modules (as dry machine definitions)
    //   var inventory = includeAll({
    //     dirname: options.dir,
    //     filter: /(.+)\.js/,
    //     exclude: [
    //       /^index.js$/
    //     ],
    //     flatten: true
    //   });

    //   // Now pack the modules, building each individual machine instance.
    //   Machinepack = _.reduce(inventory, function (memo, rawNMDef, key) {

    //     // Come up with an identity for debugging purposes.
    //     rawNMDef.identity = _.kebabCase(key);

    //     // Determine the method name.
    //     var methodName = getMethodName(rawNMDef.identity);
    //     if (_.contains(UNCONVENTIONAL_METHOD_NAMES, methodName)) {
    //       console.warn('Warning: Machine "'+rawNMDef.identity+'" has an unconventional identity that, when converted to a method name (`'+methodName+'`), could conflict with native features of JavaScript/Node.js.  Please consider changing it!');
    //     }

    //     memo[methodName] = Machine.build(rawNMDef);
    //     return memo;
    //   }, {});

    // }//</else (no pkg option specified)>
  }//ﬁ


  return Machinepack;

};
