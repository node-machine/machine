/**
 * Module dependencies
 */

var util = require('util');
var path = require('path');
var _ = require('@sailshq/lodash');
var flaverr = require('flaverr');

var getIsProductionWithoutDebug = require('./private/get-is-production-without-debug');
var hashCustomUsageOpts = require('./private/hash-custom-usage-opts');
var helpBuildMachine = require('./private/help-build-machine');

var getMethodName = require('./get-method-name');



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
 *          @property {String?} dir
 *              The absolute path to the location of the modules to load & pack.
 *              (If a relative path is specified, it will be resolved relative  from the `pkg`)
 *
 *          @property {Dictionary?} pkg
 *              The package dictionary (i.e. what package.json exports).
 *              Will be used for refining the directory to load modules from.
 *              If `pkg` is not specified, all `.js` files in `dir` will be loaded
 *              (with the exception of `index.js`, which is reserved.)
 *
 *          @property {Dictionary?} defs
 *              An alternative to `dir` and `pkg`.  If specified, this is a dictionary
 *              of raw definitions, keyed by identity.  (This makes auto-require irrelevant.)
 *
 *          @property {Dictionary?} customize
 *              Custom usage options to apply to every Callable that is auto-built by .pack().
 *              (This is a key part of `.pack()`'s recursive call to itself.  This isn't necessarily
 *              how these things are set from userland though-- the easiest way to do that is with
 *              the .customize() method.)
 *
 *          @property {String?} name           [an alternative to specifying `pkg.name`]
 *          @property {String?} version        [an alternative to specifying `pkg.version`]
 *          @property {String?} description    [an alternative to specifying `pkg.description`]
 *          @property {String?} license        [an alternative to specifying `pkg.license`]
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
  else if (options === undefined) {
    options = {};
  }
  else if (!_.isObject(options) || _.isFunction(options) || _.isArray(options)) {
    throw new Error('Usage error: `.pack()` expects a dictionary of options, but instead got:'+util.inspect(options, {depth:null}));
  }

  // Validate `pkg`
  // (if specified, must be a dictionary)
  if (options.pkg !== undefined) {
    if (!_.isObject(options.pkg) || _.isArray(options.pkg) || _.isFunction(options.pkg)) {
      throw new Error('Usage error: `.pack()` received an invalid `pkg`.  If specified, `pkg` must be a dictionary, but instead got:'+util.inspect(options.pkg, {depth:null}));
    }
  }

  // Build up a constant array of unconventional method names
  // (used below to show a warning if a machine identity looks too similar to native JS or Node stuff.)
  //
  // FUTURE: Merge in the rest from parley too
  var UNCONVENTIONAL_OR_RESERVED_METHOD_NAMES = [
    // In general:
    'inspect', 'toString', 'valueOf', 'toLocaleString', 'toJSON',
    'prototype', 'constructor',
    'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable',
    // To watch out for with .pack() specifically:
    'customize', 'configure'
  ];


  // Now set up the dictionary that hold our machines.
  var newPack = {};

  // Set up a place to cache customized sub-packs.
  // (See `customize()` below for more information.)
  var cachedCustomSubPacks = {};

  // Set up a home for process-wide default argins for this pack.
  // (See `configure()` below for more information.)
  var defaultArgins = {};


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

  Object.defineProperty(newPack, 'customize', {
    enumerable: false,
    configurable: false,
    writable: true,
    value: function customize(customUsageOpts){
      if (!getIsProductionWithoutDebug()) {
        if (!customUsageOpts || _.isEqual(customUsageOpts, {})) { throw new Error('Consistency violation: Cannot call `.customize()` without providing any custom usage options!  Please specify at least one option such as "arginStyle" or "execStyle".'); }
        if (!_.isObject(customUsageOpts) || _.isArray(customUsageOpts) || _.isFunction(customUsageOpts)) { throw new Error('Consistency violation: `.customize()` must be called with a dictionary of custom usage options.'); }
        if (customUsageOpts.def !== undefined) { throw new Error('Consistency violation: Cannot specify `def` when calling `.customize()` on a package!  Instead provide options like "arginStyle" or "execStyle".'); }
      }//ﬁ

      var hashed;
      try {
        // - - - - - - - - - - - - - - - - - - - - - - - -
        // FUTURE: Simplify away this try/catch block with something like:
        // ```
        // var hashCustomUsageOpts = parley.callable(require('./private/hash-custom-usage-opts'));
        // hash = hashCustomUsageOpts(customUsageOpts).tolerate('E_UNHASHABLE').now();
        // ```
        // Or potentially:  («« although this approach is slower-- plus it's more convoluted...)
        // ```
        // hash = parley.deferred(hashCustomUsageOpts, undefined, [customUsageOpts]).tolerate('E_UNHASHABLE').now();
        // ```
        // - - - - - - - - - - - - - - - - - - - - - - - -
        hashed = hashCustomUsageOpts(customUsageOpts);
      } catch (err) {
        if (flaverr.taste('E_UNHASHABLE', err)) {
          // Just do nothing else and continue
          // (but leave `hashed` falsy)
          // - - - - - - - - - - - - - - - - - - - - - - - -
          // Note, we could also log a warning like
          // ```
          // console.warn('WARNING: Could not compute hash from provided custom usage options.  (Building customization of pack without caching for now...but this will probably be slow at runtime!)');
          // ```
          // …but then again it's perfectly valid to do this,
          // and you can always cache this yourself in userland
          // if it's slow.  So that's why we didn't use this
          // warning.
          // - - - - - - - - - - - - - - - - - - - - - - - -
        } else {
          throw err;
        }
      }//>-

      // Use cached customization, if possible.
      if (hashed && cachedCustomSubPacks[hashed]) {
        return cachedCustomSubPacks[hashed];
      }//-•

      // Prepare a custom sub-pack
      // (this makes a recursive call to .pack() to ensure things get expanded
      // consistently, and that we get all of the goodies like `.inspect()`,
      // `.toString()`, etc.)
      var customSubPack = pack({
        name: (options.pkg&&options.pkg.name)||options.name,
        version: (options.pkg&&options.pkg.version)||options.version,
        description: (options.pkg&&options.pkg.description)||options.description,
        license: (options.pkg&&options.pkg.license)||options.license,
        customize: customUsageOpts,
        defs: _.reduce(this, function(defs, callable) {
          var def = callable.getDef();
          defs[def.identity] = def;
          return defs;
        }, {})
      });

      // Apply default argins (if there are any) to this custom sub-pack
      if (_.keys(defaultArgins).length > 0) {
        customSubPack.configure(defaultArgins);
      }

      // If possible, cache this customization to speed up the next time this
      // variation of `.customize()` gets called again.
      if (hashed) {
        cachedCustomSubPacks[hashed] = customSubPack;
      }

      return customSubPack;
    }//ƒ
  });//…)



  /**
   * .configure()
   *
   * Set global (process-wide) default argins for this pack.
   *
   * (Note that, if called more than once, the subsequent call shallow-extends
   * any previous default argins that were configured.  However, if the new default
   * argins have a key with an undefined value, that key will be ignored.)
   */

  Object.defineProperty(newPack, 'configure', {
    enumerable: false,
    configurable: false,
    writable: true,
    value: function configure(_newDefaultArgins){

      // Strip keys w/ `undefined` as their value, for consistency.
      _.each(_.keys(_newDefaultArgins), function(inputCodeName){
        if (_newDefaultArgins[inputCodeName] === undefined) {
          delete _newDefaultArgins[inputCodeName];
        }
      });//∞

      // Then just do a normal, shallow extend.
      _.extend(defaultArgins, _newDefaultArgins);

      // Chainable
      return newPack;
    }
  });


  /**
   * .inspect()
   *
   * (Automatically invoked in Node.js environments when this is passed into `util.inspect()` or `console.log()`)
   *
   * > This property can be overridden.
   */

  Object.defineProperty(newPack, 'inspect', {
    enumerable: false,
    configurable: false,
    writable: true,
    value: function inspect(){
      var pkg = options.pkg||{
        name: options.name,
        version: options.version,
        description: options.description,
        license: options.license
      };

      var nmIdentities = (pkg.machinepack&&pkg.machinepack.machines)||(options.defs&&(_.keys(options.defs)||[]))||[];
      nmIdentities = _.clone(nmIdentities);
      nmIdentities.sort();

      return ''+
      '-----------------------------------------\n'+
      ' '+(pkg.name || 'anonymous package')+'\n'+
      (pkg.version ? ' v'+pkg.version : '')+(pkg.license ? '   ('+pkg.license+')\n' : pkg.version?'\n':'')+
      // (pkg.name ? ' (http://npmjs.com/package/'+pkg.name+')\n' : '')+
      ' \n'+
      (pkg.description ?
        (' '+pkg.description+'\n\n') :
        ''
      )+
      ' Methods:\n'+
      (
        _.map(nmIdentities, function (nmIdentity){
          return '   · '+getMethodName(nmIdentity)+'()';
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
   * > This property can be overridden.
   */

  Object.defineProperty(newPack, 'toString', {
    enumerable: false,
    configurable: false,
    writable: true,
    value: function toString(){
      var pkg = options.pkg||{
        name: options.name,
        version: options.version,
        description: options.description,
        license: options.license
      };
      return '[Package: '+(pkg.name||'anonymous')+']';
    }//ƒ
  });


  //  ██████╗ ██╗  ██╗ ██████╗
  //  ██╔══██╗██║ ██╔╝██╔════╝
  //  ██████╔╝█████╔╝ ██║  ███╗
  //  ██╔═══╝ ██╔═██╗ ██║   ██║
  //  ██║     ██║  ██╗╚██████╔╝
  //  ╚═╝     ╚═╝  ╚═╝ ╚═════╝
  //
  //  ┬┌─┐  ╔═╗╦╔═╔═╗  ┬ ┬┌─┐┌─┐  ┌─┐┌─┐┌─┐┌─┐┬┌─┐┬┌─┐┌┬┐
  //  │├┤   ╠═╝╠╩╗║ ╦  │││├─┤└─┐  └─┐├─┘├┤ │  │├┤ │├┤  ││
  //  ┴└    ╩  ╩ ╩╚═╝  └┴┘┴ ┴└─┘  └─┘┴  └─┘└─┘┴└  ┴└─┘─┴┘ooo
  // If `pkg` was specified...
  if (options.pkg !== undefined) {

    // Validate `dir`
    if (_.isUndefined(options.dir)) {
      throw new Error('Usage error: `.pack()` should be provided a `dir` option, since `pkg` is being used.  But no `dir` option was specified.  All options received:'+util.inspect(options, {depth:null}));
    }
    if (!_.isString(options.dir)) {
      throw new Error('Usage error: `.pack()` received a `dir` path which is not a string:'+util.inspect(options.dir, {depth:null}));
    }

    var machines;
    try {
      machines = options.pkg.machinepack.machines;
    }
    catch (e) {
      throw flaverr('E_INVALID_OPTION', new Error(
        'Failed to .pack() using the provided `pkg`.\n'+
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
    newPack = _.reduce(machines, function (memo, machineID) {
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
        var machineInstance = helpBuildMachine(_.extend({}, options.customize||{}, {
          def: definition,
          defaultArgins: defaultArgins
        }));

        // Determine the method name.
        var methodName = getMethodName(definition.identity);
        if (_.contains(UNCONVENTIONAL_OR_RESERVED_METHOD_NAMES, methodName)) {
          console.warn('Warning: Machine "'+definition.identity+'" has an unconventional identity that, when converted to a method name (`'+methodName+'`), could conflict with native features of JavaScript/Node.js, or otherwise interfere with the machine runner.  Please consider changing it!');
          // ^^FUTURE: replace this with the other prettier message elsewhere in this file when it comes time to deduplicate this stuff
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
            'an array of strings which correspond to the filenames of modules in this package.\n\n'+
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
          'to the filenames of machine modules in this package.\n\n'+
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
    }, newPack);

  //  ██████╗ ███████╗███████╗███████╗
  //  ██╔══██╗██╔════╝██╔════╝██╔════╝
  //  ██║  ██║█████╗  █████╗  ███████╗
  //  ██║  ██║██╔══╝  ██╔══╝  ╚════██║
  //  ██████╔╝███████╗██║     ███████║
  //  ╚═════╝ ╚══════╝╚═╝     ╚══════╝
  //
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
  //   defs: {
  //     'do-something': {
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
  } else if (options.defs) {

    // Attach methods by building defs into callables.
    // (Along the way, set identities and auto-infer method names.)
    _.each(options.defs, function(def, identity){
      if (def.identity !== undefined && def.identity !== identity) {
        throw flaverr({
          name: 'UsageError',
          message: 'The definition under key "'+identity+'" has an inconsistent `identity` property: '+def.identity
        });
      }//•

      if (_.contains(UNCONVENTIONAL_OR_RESERVED_METHOD_NAMES, getMethodName(identity))) {
        console.warn('WARNING: `'+identity+'` is an unconventional or reserved identity.  When converted to a method name (`'+getMethodName(identity)+'`), it could conflict with native features of JavaScript/Node.js, or otherwise interfere with native features of this runner.  Please use a different identity instead.  (Proceeding anyway this time...)');
      }

      var callable = helpBuildMachine(_.extend({}, options.customize||{}, {
        def: _.extend({ identity: identity }, def),
        defaultArgins: defaultArgins
      }));

      newPack[getMethodName(identity)] = callable;
    });//∞

  } else {
    throw new Error('Invalid options:  Either `pkg` or `defs` must be provided.');
    // FUTURE: MAYBE bring this back instead of the above
    // // Otherwise, neither `pkg` nor `defs` were specified, so just load all `.js` files in `dir`.
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
    //   newPack = _.reduce(inventory, function (memo, rawNMDef, key) {

    //     // Come up with an identity for debugging purposes.
    //     rawNMDef.identity = _.kebabCase(key);

    //     // Determine the method name.
    //     var methodName = getMethodName(rawNMDef.identity);
    //     if (_.contains(UNCONVENTIONAL_OR_RESERVED_METHOD_NAMES, methodName)) {
    //       console.warn('Warning: Machine "'+rawNMDef.identity+'" has an unconventional identity that, when converted to a method name (`'+methodName+'`), could conflict with native features of JavaScript/Node.js.  Please consider changing it!');
    //     }

    //     memo[methodName] = helpBuildMachine({def: rawNMDef });
    //     return memo;
    //   }, {});

    // }//</else (no pkg option specified)>
  }//ﬁ


  return newPack;

};
