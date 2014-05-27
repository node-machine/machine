/**
 * Module dependencies
 */

var _ = require('lodash');
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

  // TODO: resolve dependencies

  _.extend(this, definition);
}

Machine.prototype.inputs =
Machine.prototype.configure = function (configuredInputs) {
  _.extend(this._configuredInputs, _.cloneDeep(configuredInputs));
};

Machine.prototype.exits = function (configuredExits) {
  _.extend(this._configuredExits, _.cloneDeep(configuredExits));

  // Switchbackify
  configuredExits = _.mapValues(configuredExits, function (handler, exitName) {

    // TODO: fwd any unspecified exits to catchall
    // TODO: if a formerly unspecified exit is specified, undo the fwding and make it explicit

    return switchback(handler);
  });
};

Machine.prototype.exec = function (configuredExits) {
  if (configuredExits) {
    this.exits(configuredExits);
  }

  // TODO: implement Deferred/promise usage

  this.fn(this._configuredInputs, this._configuredExits);
};



// Usage:
//
// var Machine = require('node-machine');
//
// var someMachine = new Machine( require('machine-somemachine') );
//
// someMachine.configure({
//   someInput: 'foo',
//   someOtherInput: 'bar'
// };
//
// someMachine.exec({
//   success: function (results){...},
//   error: function (err){...},
//   invalid: function (err){...},
//   etc...
// });
