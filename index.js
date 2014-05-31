/**
 * Module dependencies
 */

var util = require('util');
var path = require('path');
var _ = require('lodash');
_.partialApply = require('partial-apply');
var switchback = require('node-switchback');

/**
 * @type {Machine.constructor}
 */
module.exports = Machine;


/**
 * Construct a Machine.
 *
 * @optional {Object} machineDefinition
 *                      • defaults to an anonymous "halt" machine definition which, when
 *                        executed, does nothing byond calling its error exit.
 *
 * @optional {Module} dependenciesModuleContext
 *                      • if specified, the specified module will be used as the require context
 *                        for dependencies instead of assuming the machine module is a direct child
 *                        dependency of the parent module which required `node-machine`
 *                        TODO: in the future, allow a string path to be provided instead of a
 *                        core Module instance.
 *
 * @constructor {Machine}
 * @static Machine.require()
 * @static Machine.noop()
 * @public this.configure()
 * @public this.exec()
 */
function Machine(machineDefinition, dependenciesModuleContext) {
  if (!machineDefinition) return Machine.noop();

  // Context for loading machine definitions
  Machine._requireCtx = Machine._requireCtx || module.parent;

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
  // (find it by fuzzy-searching in `module.parent.children`
  //  for the most likely match)
  dependenciesModuleContext = dependenciesModuleContext || getFromModuleRequiredModule(Machine._requireCtx, machineDefinition.moduleName);

  // console.log('dependenciesModuleContext:', dependenciesModuleContext);

  // Require dependencies for this machine, but do it from
  // the __dirname context of the machine machineDefinition module:
  _.each(this.dependencies||{}, function (versionStr, moduleName) {


    // Special case for `node-machine`
    // (require it from the context of the machine module)
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


Machine.toAction = require('./lib/Machine.toAction');


/**
 * Machine.require()
 *
 * A static factory method which returns an instantiated machine.
 * An alternative to using the Machine constructor directly.
 *
 * @param {String} moduleName
 *                   • the commonjs module name path, as if it was being
 *                     used IN THE PARENT MODULE
 *                     (ie. the module which required `node-machine`)
 *
 * @return {Machine}
 */

Machine.require = function (/* ∞ */){

  // Build require context for loading machine definitions
  // If not otherwise provided, default to using the module that
  // required `node-machine`.
  Machine._requireCtx = Machine._requireCtx || module.parent;

  _.partialApply(require('./lib/Machine.require'),Array.prototype.slice.call(arguments));
};


/**
 * Machine.machine()
 *
 * Alias for `Machine.require()`
 *
 * @type {Machine}
 */
Machine.machine = Machine.require;


/**
 * Machine.noop()
 *
 * A static factory method which returns an anonymous machine whose only
 * purpose is to call its success exit.
 *
 * @return {Machine}
 */
Machine.noop = function () {
  return new Machine({
    id: '_noop',
    fn: function (inputs,exits,dependencies) {
      exits.success();
    }
  });
};


/**
 * Machine.halt()
 *
 * A static factory method which returns an anonymous machine whose only
 * purpose is to call its error exit with the specified `errorMsg`.
 *
 * @optional {*} error
 *                 • defaults to an Error object indicating that an unexpected
 *                   error occurred
 *
 * @return {Machine}
 */
Machine.halt = function (error) {

  error = error || (function (){
    var DEFAULT_HALT_ERROR = new Error();
    DEFAULT_HALT_ERROR.code = 'E_MACHINE_HALT';
    DEFAULT_HALT_ERROR.message = 'Executed a halt machine';
    return DEFAULT_HALT_ERROR;
  })();

  return new Machine({
    id: '_halt',
    fn: function (inputs,exits,dependencies) {
      exits.error(error);
    }
  });
};


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
  _.extend(this._configuredExits, _.cloneDeep(configuredExits));

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

  this.fn(this._configuredInputs, switchback(this._configuredExits), this._dependencies);

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
};




/**
 * [getMachineModule description]
 * @api private
 * @return {[type]} [description]
 */
function getFromModuleRequiredModule (parentModule, moduleName) {

  return _(parentModule.children)
  .max(function rankEachModule (moduleRequiredByParent) {
    var _machineLikenessRank = 0;

    // Guess the likelihood of this being the correct module
    // by splitting the `id` on slashes and building a certainty
    // score (a % percentage) based on how far to the right-hand-side
    // the modulename appears as a substring in the `id` path.
    _(path.dirname(moduleRequiredByParent.id).split('/'))
    .reverse()
    .each(function (pathPart, i) {
      if (pathPart.match(moduleName)) {
        _machineLikenessRank += 1.0/(i+1);
      }
      // console.log('(1.0/(i+1) :: ',(1.0/(i+1)));
      // console.log('(parentModule.children*1.0) :: ',(parentModule.children.length*1.0));
    });
    _machineLikenessRank *= 100*(1.0/parentModule.children.length);
    // console.log('I think it is %s% likely that "%s" is the machine you\'re looking for', _machineLikenessRank, moduleRequiredByParent.id);
    return _machineLikenessRank;
  }).valueOf();
}
