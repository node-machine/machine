/**
 * Module dependencies
 */

var util = require('util');
var path = require('path');
var _ = require('lodash');


/**
 * Machine.pack()
 *
 * Build a dictionary of machine instances.
 *
 * Note that if `pkg` is not specified, all `.js`
 * files in `dir` will be loaded.
 *
 * - - - - - - - - - - - - - - - - - - - - - - - - -
 * @required {Dictionary} dir
 *           The absolute path to the location of the modules to pack.
 *           (If a relative path is specified, it will be resolved relative  from the `pkg`)
 *
 * @optional {Dictionary} pkg
 *           The package dictionary (i.e. what package.json exports).
 *           Will be used for refining the directory to load modules from.
 *
 * @returns {Dictionary}
 */

module.exports = function Machine_pack (options) {

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




  // Get the `Machine` constructor
  var Machine = this;
  if (!_.isFunction(Machine.build)) { throw new Error('Consistency violation: Context (`this`) is wrong in Machine.pack()!'); }


  // If `pkg` was specified...
  if (_.isUndefined(options.pkg)) {

    var machines;
    try {
      machines = options.pkg.machinepack.machines;
    }
    catch (e) {
      var err = new Error('Failed to instantiate hydrated machinepack using the provided `pkg`.');
      err.code = 'E_INVALID_OPTION';
      err.message = util.format(
      'Failed to instantiate hydrated machinepack using the provided `pkg`.\n'+
      '`pkg` should be a dictionary with the following properties:\n'+
      ' • machinepack.machines\n • machinepack\n\n'+
      'But the actual `pkg` option provided was:\n'+
      '------------------------------------------------------\n'+
      '%s\n'+
      '------------------------------------------------------\n',
      util.inspect(options.pkg, false, null));

      throw err;
    }

    // Build a dictionary of all the machines in this pack
    return _.reduce(machines, function (memo, machineID) {

      try {
        // Require and hydrate each static definition into a callable machine fn
        var requirePath = path.resolve(options.dir, options.pkg.machinepack.machineDir || options.pkg.machinepack.machinedir || '', machineID);
        var definition = require(requirePath);

        // Attach the string identity as referenced in package.json to
        // the machine definition dictionary as its "identity"
        // (unless the machine definition already has an "identity" explicitly specified)
        definition.identity = definition.identity || machineID;

        // Build the machine.
        var machineInstance = Machine.build(definition);

        // Expose the machine as a method on our Pack dictionary.
        memo[Machine.getMethodName(machineInstance.identity)] = machineInstance;
      }
      catch (e) {

        // Check and see if this is a MODULE_ERROR-
        // if so, then it's a very different scenario and we should show a different
        // error message.
        if (e.code === 'MODULE_NOT_FOUND') {
          throw e;
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
        })();
      }
      return memo;
    }, {});
  }//</if `pkg` option was specified>

  // Otherwise, `pkg` was not specified, so just load all `.js` files in `dir`.
  else {
    // TODO
  }//</else (no pkg option specified)>

};
