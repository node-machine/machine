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
 * Build a Pack, either from the specified Node-Machine definitions or by loading modules
 * from the specified directory.
 *
 * > This method is used by default in the index.js file of generated machinepacks.
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * @required {String|Dictionary?} options
 *       Either the absolute path to the location of the modules to load & pack (see `dir` below)
 *       -OR- a dictionary of options:
 *                     * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *          @property {Dictionary?} defs
 *              An alternative to `dir` and `pkg`.  If specified, this is a dictionary
 *              of raw definitions, keyed by identity.  (This makes auto-require irrelevant.)
 *                     * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *          @property {String?} name
 *              If unspecified, `pkg.name` will be used.
 *
 *          @property {String?} version
 *              If unspecified, `pkg.version` will be used.
 *
 *          @property {String?} description
 *              If unspecified, `pkg.description` will be used.
 *
 *          @property {String?} license
 *              If unspecified, `pkg.license` will be used.
 *                     * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *          @property {String?} dir
 *              The absolute path to the location of the modules to load & pack.
 *              (If a relative path is specified, it will be resolved relative  from the `pkg`)
 *
 *          @property {Dictionary?} pkg
 *              The package dictionary (i.e. what package.json exports).
 *              Will be used for refining the directory to load modules from.
 *                     * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *          @property {Dictionary?} customize
 *              ** THIS IS EFFECTIVELY PRIVATE, AND NOT DESIGNED FOR EXTERNAL USE! **
 *              Custom usage options to apply to every Callable that is auto-built by .pack().
 *              (This is a key part of `.pack()`'s recursive call to itself.  This isn't necessarily
 *              how these things are set from userland though-- the best way to do that is with
 *              the .customize() method.)
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * @returns {Pack}
 *          A Pack instance- basically a dictionary of Callables ("wet machines") with
 *          camelCased keys ("method names").  Plus a few extra methods.
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Example usage:
 * ```
 * foo = machine.pack({
 *   name: 'Foo',
 *   defs: {
 *     'do-something': {
 *       implementationType: 'classical'
 *       inputs: {
 *         favoriteColor: { type: 'string', required: true },
 *       },
 *       fn: async function(){
 *         console.log('did it');
 *       }
 *     }
 *   }
 * })
 * .customize({
 *   arginStyle: 'serial',
 *   execStyle: 'immediate'
 * });
 *
 * await foo.doSomething('quickly');
 * ```
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 */

module.exports = function pack(optionsOrDir){

  // Normalize usage to determine actual options.
  // > e.g. if specified as a string, understand as `options.dir`, etc.
  var options;
  if (_.isString(optionsOrDir)) {
    options = { dir: optionsOrDir };
  } else if (optionsOrDir === undefined) {
    options = {};
  } else if (!_.isObject(optionsOrDir) || _.isFunction(optionsOrDir) || _.isArray(optionsOrDir)) {
    throw new Error('Usage error: `.pack()` expects a dictionary of options, but instead got:'+util.inspect(optionsOrDir, {depth:null}));
  } else {
    options = optionsOrDir;
  }

  // Usage sanity checks:
  if (options.pkg !== undefined) {
    if (!_.isObject(options.pkg) || _.isArray(options.pkg) || _.isFunction(options.pkg)) {
      throw new Error('Usage error: `.pack()` received an invalid `pkg`.  If specified, `pkg` must be a dictionary, but instead got:'+util.inspect(options.pkg, {depth:null}));
    }
  }//ﬁ
  if (options.dir !== undefined) {
    if (!_.isString(options.dir)) {
      throw new Error('Usage error: `.pack()` received a `dir` path which is not a string:'+util.inspect(options.dir, {depth:null}));
    }
  }//ﬁ

  // Local variables to provide convenient access below.
  // Uses either direct key (`options.*`) or nested under pkg (`options.pkg.*`).
  var name = options.name !== undefined ? options.name : (options.pkg&&options.pkg.name);
  var version = options.version !== undefined ? options.version : (options.pkg&&options.pkg.version);
  var description = options.description !== undefined ? options.description : (options.pkg&&options.pkg.description);
  var license = options.license !== undefined ? options.license : (options.pkg&&options.pkg.license);


  // Use defs if any were provided.
  var defs = options.defs;

  //   █████╗ ██╗   ██╗████████╗ ██████╗       ██████╗ ███████╗ ██████╗ ██╗   ██╗██╗██████╗ ███████╗
  //  ██╔══██╗██║   ██║╚══██╔══╝██╔═══██╗      ██╔══██╗██╔════╝██╔═══██╗██║   ██║██║██╔══██╗██╔════╝
  //  ███████║██║   ██║   ██║   ██║   ██║█████╗██████╔╝█████╗  ██║   ██║██║   ██║██║██████╔╝█████╗
  //  ██╔══██║██║   ██║   ██║   ██║   ██║╚════╝██╔══██╗██╔══╝  ██║▄▄ ██║██║   ██║██║██╔══██╗██╔══╝
  //  ██║  ██║╚██████╔╝   ██║   ╚██████╔╝      ██║  ██║███████╗╚██████╔╝╚██████╔╝██║██║  ██║███████╗
  //  ╚═╝  ╚═╝ ╚═════╝    ╚═╝    ╚═════╝       ╚═╝  ╚═╝╚══════╝ ╚══▀▀═╝  ╚═════╝ ╚═╝╚═╝  ╚═╝╚══════╝
  //
  // If no defs were explicitly provided, then auto-require modules.
  if (defs === undefined) {

    // Make sure `dir` was specified.
    if (!options.dir) {
      throw flaverr({
        name: 'UsageError',
        message:
        'Failed to .pack().  Since no `defs` were provided, tried to auto-load modules, but cannot.\n'+
        'Please specify a `dir` (usually: `dir: __dirname`)'
      });
    }//•

    var explicitIdentitiesToLoad;
    if (options.pkg) {
      if (options.pkg&&options.pkg.machinepack&&options.pkg.machinepack.machines&&_.isArray(options.pkg.machinepack.machines)){
        explicitIdentitiesToLoad = options.pkg.machinepack.machines;
      } else {
        throw flaverr({
          name: 'ImplementationError', // formerly: {code: 'E_INVALID_OPTION'}
          message:
          'Failed to .pack().  Provided `pkg.machinepack.machines` is invalid.  '+
          '(Should be an array of strings.)'
        });
      }
    }//ﬁ

    // If no explicit identities were provided, just try to load all `.js` files in `dir`.
    // (with the exception of `index.js`, which is reserved.)
    if (!explicitIdentitiesToLoad) {
      throw new Error('Invalid options:  If `defs` is not provided, then both `dir` AND `pkg` must be set.');
      // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
      // FUTURE: MAYBE bring the following naive "load everything" approach back
      // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
      //   //   // Ensure we have an absolute path.
      //   //   options.dir = path.resolve(options.dir);
      //   //   // Load modules (as dry machine definitions)
      //   //   var inventory = includeAll({
      //   //     dirname: options.dir,
      //   //     filter: /(.+)\.js/,
      //   //     exclude: [
      //   //       /^index.js$/
      //   //     ],
      //   //     flatten: true
      //   //   });
      //   //   defs = _.reduce(inventory, function (memo, rawNMDef, key) {
      //   //     rawNMDef.identity = _.kebabCase(key);
      //   //     memo[rawNMDef.identity] = rawNMDef;
      //   //     return memo;
      //   //   }, {});
      //   // </naive "load all">
      //   // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
      //   // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
      //   // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
      //   // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    } else {

      // Resolve source directory path from `machineDir` option.
      // > Note that we tolerate mispellings and absence of the option, for backwards compat.
      var srcDir = options.pkg.machinepack.machineDir || options.pkg.machinepack.machinedir || '';
      if (!_.isString(srcDir)) {
        throw flaverr({
          name: 'ImplementationError',
          message:
          'Provided `pkg.machinepack.machineDir` is invalid.\n'+
          'If specified, should be a string-- the relative path to the directory\n'+
          'where module definitions will be loaded from (e.g. "./lib" or "./machines").'
        });
      }//•

      // Load defs.
      defs = _.reduce(explicitIdentitiesToLoad, function (defs, identityToLoad) {
        var pathToRequire = path.resolve(options.dir, srcDir, identityToLoad);
        var def;
        try {
          def = require(pathToRequire);
        } catch (err) {
          if (flaverr.taste('MODULE_NOT_FOUND', err)) {
            throw flaverr({
              name: 'ImplementationError',
              code: 'MODULE_NOT_FOUND',// formerly: 'E_MACHINE_NOT_FOUND'
              raw: err,
              message:
              'Could not find `'+identityToLoad+'`, one of the modules in `pkg.machinepack.machines`.\n'+
              'Maybe it was deleted or mistyped?',
            });
          } else {
            throw flaverr({
              name: 'ImplementationError',
              code: 'E_INVALID_DEF',// formerly: 'E_INVALID_MACHINE'
              raw: err,
              message: 'Error loading `'+identityToLoad+'`, one of the modules in `pkg.machinepack.machines`.'
            });
          }
        }//>-

        defs[identityToLoad] = def;
        return defs;
      }, {});//∞
    }//ﬁ  (loaded using explicit identities)
  }//ﬁ   (had to auto-require)



  //  ██╗███╗   ██╗███████╗████████╗ █████╗ ███╗   ██╗████████╗██╗ █████╗ ████████╗███████╗
  //  ██║████╗  ██║██╔════╝╚══██╔══╝██╔══██╗████╗  ██║╚══██╔══╝██║██╔══██╗╚══██╔══╝██╔════╝
  //  ██║██╔██╗ ██║███████╗   ██║   ███████║██╔██╗ ██║   ██║   ██║███████║   ██║   █████╗
  //  ██║██║╚██╗██║╚════██║   ██║   ██╔══██║██║╚██╗██║   ██║   ██║██╔══██║   ██║   ██╔══╝
  //  ██║██║ ╚████║███████║   ██║   ██║  ██║██║ ╚████║   ██║   ██║██║  ██║   ██║   ███████╗
  //  ╚═╝╚═╝  ╚═══╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═══╝   ╚═╝   ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝
  //
  //  ██████╗  █████╗  ██████╗██╗  ██╗
  //  ██╔══██╗██╔══██╗██╔════╝██║ ██╔╝
  //  ██████╔╝███████║██║     █████╔╝
  //  ██╔═══╝ ██╔══██║██║     ██╔═██╗
  //  ██║     ██║  ██║╚██████╗██║  ██╗
  //  ╚═╝     ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝
  //


  // Now set up the dictionary that hold our machines.
  var newPack = {};

  // Set up a place to cache customized sub-packs.
  // (See `customize()` below for more information.)
  var cachedCustomSubPacks = {};

  // Set up a home for default argins for this pack.
  // (See `configure()` below for more information.)
  //
  // Remember: These are NOT PROCESS-WIDE!
  // (Just pack-instance-wide)
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
      var thisPack = this;
      var customSubPack = pack({
        name: name,
        version: version,
        description: description,
        license: license,
        customize: customUsageOpts,
        defs: _.reduce(_.keys(defs), function(_shallowCopyOfDryDefs, identity) {
          var callable = thisPack[getMethodName(identity)];
          var def = callable.getDef();
          _shallowCopyOfDryDefs[def.identity] = def;
          return _shallowCopyOfDryDefs;
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
   * Set default argins for this pack.
   *
   * Note that these are NOT PROCESS-WIDE!
   * (Just pack-instance-wide)
   *
   * (Also note that, if called more than once, the subsequent call shallow-extends
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

      return ''+
      '-----------------------------------------\n'+
      ' '+(name || 'anonymous package')+'\n'+
      (version ? ' v'+version : '')+(license ? '   ('+license+')\n' : version?'\n':'')+
      // (name ? ' (http://npmjs.com/package/'+name+')\n' : '')+
      ' \n'+
      (description ?
        (' '+description+'\n\n') :
        ''
      )+
      ' Methods:\n'+
      (
        _.map(_.keys(defs).sort(), function (nmIdentity){
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
      return '[Package: '+(name||'anonymous')+']';
    }//ƒ
  });


  /**
   * .toJSON()
   *
   * Get a dry, JSON-compatible representation of this pack.
   *
   * Note that, if this "dry" pack representation is ACTUALLY JSON-stringified afterwards,
   * the stringification process will be lossy.  Functions like `fn` or `custom` validators
   * are not actually JSON serializable.  (To overcome this, use an additional layer of
   * serialization and deserialization such as rttc.dehydrate() and rttc.hydrate().)
   *
   * (Automatically invoked before JSON stringification when this is passed
   * into `JSON.stringify()`)
   */

  Object.defineProperty(newPack, 'toJSON', {
    enumerable: false,
    configurable: false,
    writable: true,
    value: function toJSON(){
      var thisPack = this;
      return {
        name: name||'anonymous',
        version: version||'',
        description: description||'',
        license: license||'',
        customize: options.customize||undefined,
        defs: _.reduce(_.keys(defs), function(_shallowCopyOfDryDefs, identity) {
          var callable = thisPack[getMethodName(identity)];
          var def = callable.getDef();
          _shallowCopyOfDryDefs[def.identity] = def;
          return _shallowCopyOfDryDefs;
        }, {})
      };
    }//ƒ
  });



  /**
   * .registerDefs()
   *
   * Attach a dictionary of new methods, keyed by identity.
   * Any existing properties with the same names will be overridden.
   *
   * > Note that this method must be used in order for new methods
   * > to work properly!  Anything NOT attached this way but added
   * > as a property WILL be allowed (e.g. sub-packs), but it will
   * > be ignored as far as methods are concerned.
   *
   * @param {Dictionary} newMethodsByIdentity
   */

  Object.defineProperty(newPack, 'registerDefs', {
    enumerable: false,
    configurable: false,
    writable: true,
    value: function registerDefs(newMethodsByIdentity){

      // Attach new methods to `defs`.
      _.extend(defs, newMethodsByIdentity);

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
        'customize', 'configure', 'registerDefs'
      ];

      // Attach methods by building defs into callables.
      // (Along the way, set identities and auto-infer method names.)
      _.each(defs, function(def, identity){
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
    }//ƒ
  });//…)

  //  ██████╗ ██╗   ██╗██╗██╗     ██████╗
  //  ██╔══██╗██║   ██║██║██║     ██╔══██╗
  //  ██████╔╝██║   ██║██║██║     ██║  ██║
  //  ██╔══██╗██║   ██║██║██║     ██║  ██║
  //  ██████╔╝╚██████╔╝██║███████╗██████╔╝
  //  ╚═════╝  ╚═════╝ ╚═╝╚══════╝╚═════╝
  //
  //  ██╗███╗   ███╗██████╗ ██╗     ███████╗███╗   ███╗███████╗███╗   ██╗████████╗███████╗██████╗
  //  ██║████╗ ████║██╔══██╗██║     ██╔════╝████╗ ████║██╔════╝████╗  ██║╚══██╔══╝██╔════╝██╔══██╗
  //  ██║██╔████╔██║██████╔╝██║     █████╗  ██╔████╔██║█████╗  ██╔██╗ ██║   ██║   █████╗  ██║  ██║
  //  ██║██║╚██╔╝██║██╔═══╝ ██║     ██╔══╝  ██║╚██╔╝██║██╔══╝  ██║╚██╗██║   ██║   ██╔══╝  ██║  ██║
  //  ██║██║ ╚═╝ ██║██║     ███████╗███████╗██║ ╚═╝ ██║███████╗██║ ╚████║   ██║   ███████╗██████╔╝
  //  ╚═╝╚═╝     ╚═╝╚═╝     ╚══════╝╚══════╝╚═╝     ╚═╝╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚══════╝╚═════╝
  //
  //  ███╗   ███╗███████╗████████╗██╗  ██╗ ██████╗ ██████╗ ███████╗
  //  ████╗ ████║██╔════╝╚══██╔══╝██║  ██║██╔═══██╗██╔══██╗██╔════╝
  //  ██╔████╔██║█████╗     ██║   ███████║██║   ██║██║  ██║███████╗
  //  ██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██║   ██║██║  ██║╚════██║
  //  ██║ ╚═╝ ██║███████╗   ██║   ██║  ██║╚██████╔╝██████╔╝███████║
  //  ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝
  //
  newPack.registerDefs(defs);


  return newPack;

};
