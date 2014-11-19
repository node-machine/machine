/**
 * Module dependencies
 */

var util = require('util');
var path = require('path');
var _ = require('lodash');


/**
 * Build an object of callable machine functions.
 *
 * @param  {Object} options
 *   @required {Object} pkg
 *   @optional {Object} dir
 * @return {Object}
 */

module.exports = function Machine_pack (options) {

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

    try {
      // Require and hydrate each static definition into a callable machine fn
      var requirePath = path.resolve(options.dir||process.cwd(), options.pkg.machinepack.machineDir || options.pkg.machinepack.machinedir || '', machineID);
      var definition = require(requirePath);

      // Attach the string identity as referenced in package.json to
      // the machine definition object as its "identity"
      // (unless the machine definition already has an "identity" explicitly specified)
      definition.identity = definition.identity || machineID;

      // Build the machine.
      var machineInstance = Machine.build(definition);

      // Expose the machine on our machinepack object using its
      // ECMAScript-friendly `variableName` as the key.
      memo[machineInstance.variableName] = machineInstance;
    }
    catch (e) {

      // TODO: check and see if this is a MODULE_ERROR-
      // if so, then it's a very different scenario and we should show a different
      // error message.

      throw (function buildError(){
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
      })();
    }
    return memo;
  }, {});


};
