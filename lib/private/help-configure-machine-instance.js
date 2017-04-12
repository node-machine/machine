/**
 * Module dependencies
 */

var util = require('util');
var _ = require('@sailshq/lodash');
var flaverr = require('./flaverr');


/**
 * helpConfigureMachineInstance()
 *
 * Configure a live machine instance with:
 *  • `argins` (runtime values for its inputs)
 *  • `cbs` (callback functions for its exits)
 *  • `envToSet` (habitat vars like `sails` to provide to its implementation as `env`)
 *
 * > This is used internally in the machine runner, such as when the chainable `.configure()` function
 * > is called, or when `.exec()` is called, and even when a machine instance is called directly as a
 * > function.
 *
 * @required  {Ref} liveMachine    [<< will be modified in-place]
 * @optional  {Dictionary?} argins
 * @optional  {Dictionary?|Function?} cbs
 * @optional  {Dictionary?} envToSet
 *
 *
 * @throws {Error} If `liveMachine` is omitted or invalid
 * @throws {Error} If `argins`, `callbacks`, or `envToSet` are the wrong data type
 * @throws {E_USAGE} If any of the provided callbacks are configured for unrecognized exits
 * @throws {E_USAGE} If any of the provided argins are configured for unrecognized inputs
 */
module.exports = function helpConfigureMachineInstance (liveMachine, argins, cbs, envToSet) {

  // Assertions:
  if (!_.isObject(liveMachine)) {
    throw new Error('Consistency violation: The 1st arg of helpConfigureMachineInstance() (`liveMachine`) is required, and should be provided as a live machine instance.  But instead got: '+util.inspect(liveMachine, {depth: null}));
  }
  if (arguments.length > 4) {
    throw new Error('Consistency violation: helpConfigureMachineInstance() should never receive more than 4 arguments!  But got:'+util.inspect(arguments, {depth: null}));
  }

  // Usage errors:
  if (!_.isUndefined(argins) && (!_.isObject(argins) || _.isArray(argins) || _.isFunction(argins))) {
    throw flaverr('E_USAGE', new Error('Invalid usage: If specified, argins (runtime-configured input values) should be provided as a dictionary.  But instead got: '+util.inspect(argins, {depth: null})));
  }
  var wasCbsProvidedAsDictionary = _.isObject(cbs) && !_.isArray(cbs) && !_.isFunction(cbs);
  if (!_.isUndefined(cbs) && (!wasCbsProvidedAsDictionary && !_.isFunction(cbs))) {
    throw flaverr('E_USAGE', new Error('Invalid usage: If specified, callbacks (exit handlers) should be provided as either a dictionary of functions, or as a single Node.js-style callback function.  But instead got: '+util.inspect(cbs, {depth: null})));
  }
  if (!_.isUndefined(envToSet) && (!_.isObject(envToSet) || _.isArray(envToSet) || _.isFunction(envToSet))) {
    throw flaverr('E_USAGE', new Error('Invalid usage: If specified, the habitat variables (dictionary to fold into the `env` provided to the machine\'s `fn`) should be provided as a dictionary.  But instead got: '+util.inspect(envToSet, {depth: null})));
  }


  //  ╔═╗╦═╗╔═╗╦╔╗╔┌─┐
  //  ╠═╣╠╦╝║ ╦║║║║└─┐
  //  ╩ ╩╩╚═╚═╝╩╝╚╝└─┘
  //  ┌─    ┬─┐┬ ┬┌┐┌┌┬┐┬┌┬┐┌─┐  ┬┌┐┌┌─┐┬ ┬┌┬┐  ┬  ┬┌─┐┬  ┬ ┬┌─┐┌─┐    ─┐
  //  │───  ├┬┘│ ││││ │ ││││├┤   ││││├─┘│ │ │   └┐┌┘├─┤│  │ │├┤ └─┐  ───│
  //  └─    ┴└─└─┘┘└┘ ┴ ┴┴ ┴└─┘  ┴┘└┘┴  └─┘ ┴    └┘ ┴ ┴┴─┘└─┘└─┘└─┘    ─┘
  // If new argins were provided...
  if (!_.isUndefined(argins)) {

    // Make sure that no argins were configured for undeclared inputs:
    // First get the code names of all of this machine's declared inputs.
    var allDeclaredInputCodeNames = _.keys(liveMachine.inputs);
    // Next get the code names of all configured arguments (excluding those configured with `undefined` values).
    var allConfiguredArgins = _.omit(argins, function(val/*, key */) { return _.isUndefined(val); });
    // Get the difference of the two to see if there are any configured arguments that don't match
    // any known input for this machine.
    var unrecognizedInputCodeNames = _.difference(_.keys(allConfiguredArgins), allDeclaredInputCodeNames);
    // If so, throw an error.
    if (unrecognizedInputCodeNames.length > 0) {
      throw flaverr('E_USAGE', new Error('Invalid usage: One or more argins were configured for inputs that are not recognized by this machine: `' + unrecognizedInputCodeNames.join(', ') + '`.'));
    }

    // Fold new argins on top of any existing configured argins.
    _.extend(liveMachine._configuredInputs, argins);
  }


  // >-
  //  ╔═╗╔╗ ┌─┐
  //  ║  ╠╩╗└─┐
  //  ╚═╝╚═╝└─┘
  //  ┌─    ┌─┐─┐ ┬┬┌┬┐  ┬ ┬┌─┐┌┐┌┌┬┐┬  ┌─┐┬─┐  ┌─┐┌─┐┬  ┬  ┌┐ ┌─┐┌─┐┬┌─┌─┐    ─┐
  //  │───  ├┤ ┌┴┬┘│ │   ├─┤├─┤│││ │││  ├┤ ├┬┘  │  ├─┤│  │  ├┴┐├─┤│  ├┴┐└─┐  ───│
  //  └─    └─┘┴ └─┴ ┴   ┴ ┴┴ ┴┘└┘─┴┘┴─┘└─┘┴└─  └─┘┴ ┴┴─┘┴─┘└─┘┴ ┴└─┘┴ ┴└─┘    ─┘
  // If new callbacks were provided, then fold them on top of any existing configured callbacks.
  if (!_.isUndefined(cbs)) {

    // Fold new callbacks on top of any existing configured callbacks.
    // Do a quick sanity check to make sure it _at least looks like_ a callback function
    // or dictionary of callback functions.
    if (_.isArray(cbs) || (!_.isFunction(cbs) && !_.isObject(cbs))) {
      throw flaverr('E_USAGE',
        new Error('Invalid usage: Provided callback(s) must be either:\n'+
                  '  (1) a standard Node callback function, or\n'+
                  '  (2) a dictionary of per-exit callback functions\n'+
                  '\n'+
                  'But instead, got:\n'+
                  util.inspect({depth: null})+
                  ''));
    }
    // Otherwise, if a callback function was provided, assume it is a conventional
    // Node.js-style callback and bust it out accordingly.
    else if (_.isFunction(cbs)) {
      liveMachine._configuredExits.success = function (result){
        return cbs(undefined, result);
      };
      liveMachine._configuredExits.error = function (err){
        return cbs(err);
      };
    }
    // Finally, if a dictionary of individual callbacks was provided, handle them accordingly.
    else {

      // Make sure that no callbacks for undeclared exits were configured.
      var allDeclaredExitCodeNames = _.keys(liveMachine.exits);
      var unrecognizedExitCodeNames = _.difference(_.keys(cbs), allDeclaredExitCodeNames);
      if (unrecognizedExitCodeNames.length > 0) {
        throw flaverr('E_USAGE',
          new Error('Invalid usage: One or more callbacks were configured for exits that are '+
                    'not recognized by this machine: `' + unrecognizedExitCodeNames.join(', ') +
                    '`.'));
      }

      // Tack these individual callbacks onto the dictionary of configured exit callbacks.
      _.extend(liveMachine._configuredExits, cbs);

    }//</else :: dictionary of callbacks provided>
  }//</if callbacks were specified>


  // >-
  //  ╔═╗╔╗╔╦  ╦  ╔╦╗╔═╗  ╔═╗╔═╗╔╦╗
  //  ║╣ ║║║╚╗╔╝   ║ ║ ║  ╚═╗║╣  ║
  //  ╚═╝╝╚╝ ╚╝    ╩ ╚═╝  ╚═╝╚═╝ ╩
  //  ┌─    ┬ ┬┌─┐┌┐ ┬┌┬┐┌─┐┌┬┐  ┬  ┬┌─┐┬─┐┌─┐    ─┐
  //  │───  ├─┤├─┤├┴┐│ │ ├─┤ │   └┐┌┘├─┤├┬┘└─┐  ───│
  //  └─    ┴ ┴┴ ┴└─┘┴ ┴ ┴ ┴ ┴    └┘ ┴ ┴┴└─└─┘    ─┘
  // If new habitat vars were provided, then fold them on top of any existing habitat vars.
  if (!_.isUndefined(envToSet)) {
    _.extend(liveMachine._configuredEnvironment, envToSet);
  }


};

