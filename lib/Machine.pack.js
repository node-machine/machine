/**
 * Module dependencies
 */

var util = require('util');
var path = require('path');
var _ = require('lodash');
var makeECMAScriptCompatible = require('./make-ecmascript-compatible');


/**
 * Build an object of callable machine functions.
 *
 * @param  {Object} options
 *   @required {Object} pkg
 *   @optional {Object} dir
 * @return {Object}
 */

module.exports = function Machineºpack (options) {

  // Get the `Machine` constructor
  var Machine = this;

  options = options||{};

  var machines;
  try {
    machines = options.pkg.machinepack.machines;
  }
  catch (e) {
    var err = new Error();
    err.code = 'E_INVALID_OPTION';
    err.message = util.format(
    'Failed to instantiate hydrated machinepack using the provided `pkg`.\n'+
    '`pkg` should be an object with the following properties:\n'+
    ' • machinepack.machines\n • machinepack\n\n'+
    'But the actual `pkg` option provided was:\n'+
    '------------------------------------------------------\n'+
    '%s\n'+
    '------------------------------------------------------\n',
    util.inspect(options.pkg, false, null));

    throw err;
  }

  // Build an object of all the machines in this pack
  return _.reduce(machines, function (memo, machineID) {

    // Require and hydrate each static definition into a callable machine fn
    var requirePath = path.resolve(options.dir||process.cwd(), machineID);
    var definition = require(requirePath);
    // console.log('requiring %s from %s...', machineID, requirePath);
    memo[makeECMAScriptCompatible(machineID)] = Machine.build(definition);
    return memo;

  }, {});


};
