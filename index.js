/**
 * Module dependencies
 */

var _ = require('lodash');
var util = require('util');
var switchback = require('node-switchback');


/**
 * [exports description]
 * @return {[type]} [description]
 */
module.exports = Machine;


/**
 * Construct a Machine.
 * @constructor
 * @param {[type]} definition [description]
 */
function Machine(definition) {
  definition = definition||{};
  definition._configuredInputs = {};
  definition._configuredExits = {};
  definition._node_modules = {};

  _.extend(this, definition);

  // TODO: resolve dependencies propertly
  _.each(this.dependencies||{}, function (versionStr, moduleName) {
    // var requireStr = util.format('%s@%s', moduleName, versionStr);
    var requireStr = util.format('%s', moduleName);

    var code;
    try {
      code = require(requireStr);
    }
    catch(e) { throw e; }

    this._node_modules[moduleName] = code;

  }, this);

}

/**
 * @param  {[type]} configuredInputs [description]
 * @chainable
 */
Machine.prototype.configureInputs = function (configuredInputs) {
  _.extend(this._configuredInputs, _.cloneDeep(configuredInputs));

  return this;
};

/**
 * @param  {[type]} configuredExits [description]
 * @chainable
 */
Machine.prototype.configureExits = function (configuredExits) {
  _.extend(this._configuredExits, _.cloneDeep(configuredExits));

  // Switchbackify
  this._configuredExits = switchback(this._configuredExits);

  // TODO: fwd any unspecified exits to catchall
  // TODO: if a formerly unspecified exit is specified, undo the fwding and make it explicit

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
    this.configureExits(configuredExits);
  }
  if (configuredInputs) {
    this.configureInputs(configuredInputs);
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
    this.configureExits(configuredExits);
  }

  // TODO: implement Deferred/promise usage

  this.fn(this._configuredInputs, this._configuredExits, this._node_modules);

  return this;
};



// Usage:
//
// var Machine = require('node-machine');
//
// var someMachine = new Machine( require('machine-somemachine') );
//
// someMachine
// .configure({
//   someInput: 'foo',
//   someOtherInput: 'bar'
// }
// .exec({
//   success: function (results){...},
//   error: function (err){...},
//   invalid: function (err){...},
//   etc...
// });
