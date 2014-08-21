/**
 * Module dependencies
 */

var util = require('util');
var _ = require('lodash');



/**
 * Machine.load()
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

module.exports = function Machineºload (machineDefinition) {

  var Machine = this;


  // If machineDefinition is a string, assume it's the name of a module
  // for us to require.
  if (_.isString(machineDefinition)) {

    var moduleName = machineDefinition;

    // Build (update) require context for loading machine definitions/dependencies
    // If not otherwise provided, default to using the module that
    // required `node-machine`
    // (we use `module.parent.parent` since this file is actually required from `../index.js`)
    Machine._requireCtx = Machine._requireCtx || (module.parent&&module.parent.parent);

    // TODO:
    // find the package.json and use the actual root module path
    // from the machine module (really only comes up when developing/testing
    // since 'moduleName' might actually be a relative require path)

    // TODO: look up dependencies in the machine's package.json and merge them
    // into the `dependencies` key in the machine definition

    // TODO:
    // this doesnt actually have to be a synchronous require-
    // since the `.exec()` usage is asynchronous, we could actually
    // do an asynchronous fetch, return eagerly, then when exec is called,
    // if the machine code has not loaded yet, wait for that first, then
    // execute it, then go about our business.

    var requireCtx = Machine._requireCtx;
    // console.log('-------- TRYING TO REQUIRE:',moduleName, 'from',requireCtx.filename,'\n--------');
    // console.log('-------- SET REQUIRE CTX:',requireCtx,'\n--------');
    try {
      machineDefinition = requireCtx.require(moduleName);
    }
    catch(e) {
      var err = new Error();
      err.code = 'MODULE_NOT_FOUND';
      err.message = util.format(
      'Cannot load machine: "%s"\n'+
      '(attempted to require it from `%s`)\n'+
      'i.e.: %s',
      moduleName, requireCtx.filename, e.stack||util.inspect(e));
      throw err;
    }

  }

  return Machine.build(machineDefinition);

};
