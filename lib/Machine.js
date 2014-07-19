/**
 * Module dependencies
 */

var util = require('util');
var _ = require('lodash');
var switchback = require('node-switchback');
var _searchChildModules = require('./search-child-modules');
var _hashFn = require('./hash-function');

/**
 * @type {Machine.constructor}
 */
module.exports = Machine;


/**
 * Construct a Machine.
 *
 * @optional {Object} machineDefinition
 *                      • defaults to an anonymous "noop" machine definition which, when
 *                        executed, does nothing beyond calling its success exit.
 *
 * @optional {Module} dependenciesModuleContext
 *                      • if specified, the specified module will be used as the require context
 *                        for dependencies instead of assuming the machine module is a direct child
 *                        dependency of the parent module which required `node-machine`
 *                        TODO: in the future, allow a string path to be provided instead of a
 *                        core Module instance.
 *
 * @constructor {Machine}
 *
 * @public this.configure()
 * @public this.exec()
 * @public this.error()
 * @public this.warn()
 */
function Machine(machineDefinition, dependenciesModuleContext) {
  if (!machineDefinition) return Machine.noop();

  // TODO:
  // investigate adding support for anonymous functions
  // (probably not a good idea but worth considering)
  // if (_.isFunction(machineDefinition)) {
  //   machineDefinition = { id: '_anon',  fn: machineDefinition };
  // }

  // Ensure `machineDefinition` is valid
  if (!_.isObject(machineDefinition) || !machineDefinition.fn) {
    var err = new Error();
    err.code = 'MACHINE_DEFINITION_INVALID';
    err.message = util.format(
    'Failed to instantiate machine from the specified machine definition.\n'+
    'A machine definition should be an object with the following properties:\n'+
    ' • id\n • inputs\n • exits\n • fn\n\n'+
    'But the actual machine definition was:\n'+
    '------------------------------------------------------\n'+
    '%s\n'+
    '------------------------------------------------------\n',
    machineDefinition);

    this.error(err);
    return;
  }


  // Context for loading machine definitions
  // (we use `module.parent.parent` since this file is actually required from `../index.js`)
  Machine._requireCtx = Machine._requireCtx || (module.parent&&module.parent.parent);

  // Ensure deps, inputs, and exits are defined
  machineDefinition.dependencies = machineDefinition.dependencies||{};
  machineDefinition.inputs = machineDefinition.inputs||{};
  machineDefinition.exits = machineDefinition.exits||{};

  // Initialize private state for this machine instance
  machineDefinition._configuredInputs = {};
  machineDefinition._configuredExits = {};
  machineDefinition._dependencies = {};

  // Fold in the rest of the provided `machineDefinition`
  _.extend(this, machineDefinition);

  // Default to the machine module as the dependency context
  dependenciesModuleContext = dependenciesModuleContext || _searchChildModules(Machine._requireCtx, machineDefinition.moduleName);

  // console.log('dependenciesModuleContext:', dependenciesModuleContext);

  // Require dependencies for this machine, but do it from
  // the __dirname context of the `machineDefinition module:
  _.each(this.dependencies||{}, function (versionStr, moduleName) {


    // Special case for `node-machine`
    // (require it from the context of the machine module, or if the machine definition didn't come from another module, require it from the calling module)
    var _dependenciesModuleContext = dependenciesModuleContext;

    // handle case where _dependenciesModuleContext could not be guessed
    if (!_dependenciesModuleContext) {
      var err = new Error();
      err.code = 'MODULE_NOT_FOUND';
      err.message = util.format('Cannot resolve a context module to use for requiring dependencies of machine: "%s"',machineDefinition.moduleName);
      this.error(err);
      return false;
    }

    var machineCode;

    if (moduleName === 'node-machine') {
      machineCode = _.cloneDeep(Machine);
      machineCode._requireCtx = dependenciesModuleContext;
    }
    else {
      try {
        machineCode = _dependenciesModuleContext.require(moduleName);
      }
      catch (e) {
        var err = new Error();
        err.code = 'MODULE_NOT_FOUND';
        err.message = util.format(
        'Cannot find module: "%s", a dependency of machine: "%s"\n'+
        '(attempted from the machine module\'s context: "%s")'+
        '\n%s',
        moduleName,machineDefinition.moduleName, _dependenciesModuleContext.filename, e.stack||util.inspect(e));
        this.error(err);
        return false;
      }
    }

    this._dependencies[moduleName] = machineCode;

  }, this);

}


// Static methods
Machine.build = require('./Machine.build');
Machine.toAction = require('./Machine.toAction');
Machine.load = require('./Machine.load');
Machine.buildNoopMachine = require('./Machine.buildNoopMachine');
Machine.buildHaltMachine = require('./Machine.buildHaltMachine');

// Aliases
Machine.require = Machine.load;
Machine.machine = Machine.load;



/**
 * @param  {[type]} configuredInputs [description]
 * @chainable
 */
Machine.prototype.setInputs = function (configuredInputs) {
  _.extend(this._configuredInputs, _.cloneDeep(configuredInputs));

  return this;
};

/**
 * @param  {[type]} configuredExits [description]
 * @chainable
 */
Machine.prototype.setExits = function (configuredExits) {
  _.extend(this._configuredExits, switchback(configuredExits));

  return this;
};


/**
 * [configure description]
 * @param  {[type]} configuredInputs [description]
 * @param  {[type]} configuredExits  [description]
 * @chainable
 */
Machine.prototype.configure = function (configuredInputs, configuredExits) {
  if (configuredExits) {
    this.setExits(configuredExits);
  }
  if (configuredInputs) {
    this.setInputs(configuredInputs);
  }
  return this;
};


/**
 * [exec description]
 * @param  {[type]} configuredExits [description]
 * @chainable
 */
Machine.prototype.exec = function (configuredExits) {
  if (configuredExits) {
    this.setExits(configuredExits);
  }

  // TODO: fwd any unspecified exits to catchall
  // TODO: if a formerly unspecified exit is specified, undo the fwding and make it explicit

  // TODO: implement Deferred/promise usage



  // TODO:
  // Eventually, dont' allow `_cache` to be hard-coded as an input-
  // instead reserve it as a private thing because it's weird otherwise.
  // When this is ready to be open-sourced properly, would be a pretty
  // horrible/confusing bug if someone not in the know tried to use the
  // `_cache` input in their own machine.
  //
  // TODO:
  // Caching should only be allowed on machines which identify
  // as "referentially transparent"
  var _cache = this._configuredInputs._cache;

  // If `_cache` is not valid, null it out.
  if (
    ! (
    _.isObject(_cache) &&
    _.isObject(_cache.model) &&
    _.isFunction(_cache.model.find) &&
    _.isFunction(_cache.model.create)
    )
  ) {
    _cache = false;
  }
  // Otherwise if _cache IS valid, normalize it and apply defaults
  else {
    _.defaults(_cache, {

      // Default TTL (i.e. "max age") is 3 hours
      ttl: 3 * 60 * 60 * 1000,

      // By default, the "success" exit is cached
      exit: 'success'

    });
  }

  var self = this;



  // Cache lookup
  //
  // The cache uses a hash function to create a unique id for every distinct
  // input configuration (these hash sums are only unique per-machine-type.)
  var hash;
  //
  // Note that this means the machine cache is global not to any particular
  // machine instance, but to the machine type itself-- that is, within the
  // scope of the cache model.
  //
  // e.g.
  //  The cached result of a given set of inputs for a particular type of machine
  //  will be the same for all instances of that machine using the same cache model
  //  (which could be shared across devices/routes/processes/apps/servers/clouds/continents)


  (function _tryCacheLookup (giveUpAndRunMachineCb) {
    if (!_cache) return giveUpAndRunMachineCb();

    // Run hash function to calculate appropriate `hash` criterion
    _hashFn(self._configuredInputs, function (err, _calculatedHash){

      // Cache lookup encountered fatal error
      // (could not calculate unique hash for configured input values)
      if (err) return giveUpAndRunMachineCb(err);

      // Hashsum was calculated successfully
      hash = _calculatedHash;

      // Now hit the provided cache model
      // (remember- we know it's valid because we validated/normalized
      //  our `_cache` variable ahead of time)
      _cache.model.find({
        where: {
          createdAt: {
            '>': new Date( (new Date()) - _cache.ttl)
          },
          hash: hash
        },
        sort: 'createdAt DESC',
        limit: 1
      })
      .exec(function (err, cached) {
        // Cache lookup encountered fatal error
        if (err) return giveUpAndRunMachineCb(err);

        // Cache lookup successful
        if (cached.length && cached[0].data) {
          return switchback(self._configuredExits)(null, cached[0].data);
        }

        // Cache lookup came up empty
        return giveUpAndRunMachineCb();
      });

    });

  })(function _cacheNotAnOption_justRunMachine (err){
    if (err) {
      // If cache lookup encounters a fatal error, emit a warning
      // but continue (i.e. we fall back to running the machine)
      self.warn(err);
    }

    // Intercept the exits
    var interceptedExits = _.reduce(self._configuredExits, function (m,fn,exitName){

      // Don't mess with this exit if:
      //  • the cache is not enabled for this machine at all
      //  • this exit is not the cacheable exit
      //  • if the hash value could not be calculated before (in which case
      //    we can't safely cache this thing because we don't have a unique
      //    identifier)
      if (!_cache || !hash || exitName !== _cache.exit) {
        m[exitName] = fn;
        return m;
      }

      // If cacheable exit is traversed, cache the output
      m[exitName] = function (data) {
        _cache.model.create({
          hash: hash,
          data: data
        })
        .exec(function(err) {
          if (err) {
            // If cache write encounters an error, emit a warning but
            // continue with sending back the output
            self.warn(err);
          }

          fn(data);
        });
      };

      return m;
    }, {});

    // Run the machine
    self.fn(self._configuredInputs, switchback(interceptedExits), self._dependencies);
  });



  return this;
};


/**
 * Trigger an error on this machine.
 *
 * Uses configured `onError` function, or by default,
 * throws whatever was passed in.
 *
 * @chainable
 */
Machine.prototype.error = function () {

  /**
   * Default `onError` handler
   * @throws {Error}
   */
  (this.onError||function _defaultErrorHandler(err){
    throw err;
  }).apply(this, Array.prototype.slice.call(arguments));

  return this;
};


/**
 * Trigger a warning on this machine.
 *
 * Uses configured `onWarn` function, or by default, logs
 * to `console.error`.
 *
 * @chainable
 */
Machine.prototype.warn = function () {

  /**
   * Default `onWarn` handler
   * @logs {String,String,...}
   */
  (this.onWarn||function _defaultWarnHandler(/*...*/){
    console.error.apply(console, Array.prototype.slice.call(arguments));
  }).apply(this, Array.prototype.slice.call(arguments));

  return this;
};

// Make `Machine._requireCtx` non-enumerable
Object.defineProperty(Machine, '_requireCtx', { enumerable: false, writable: true });
