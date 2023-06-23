/**
 * Module dependencies
 */

var util = require('util');
var _ = require('@sailshq/lodash');
var flaverr = require('flaverr');
var parley = require('parley');
var rttc = require('rttc');

var getIsProductionWithoutDebug = require('./get-is-production-without-debug');
var hashCustomUsageOpts = require('./hash-custom-usage-opts');
var normalizeMachineDef = require('./normalize-machine-def');
var normalizeArgins = require('./normalize-argins');
var GENERIC_HELP_SUFFIX = require('./GENERIC_HELP_SUFFIX.string');

var getMethodName = require('../get-method-name');


/**
 * .helpBuildMachine()
 *
 * Build a callable (aka "wet machine") function using the specified definition
 * and custom usage options.
 *
 * ·····································································································
 * @param {Dictionary} opts
 * ·    ·    ·    ·    ·    ·    ·    ·    ·    ·    ·    ·    ·    ·    ·    ·    ·    ·    ·    ·    ·    ·
 *   Implementor options:
 *
 *       @property {Dictionary} def  (A Node-Machine definition -- see https://node-machine.org/spec)
 *
 * ·    ·    ·    ·    ·    ·    ·    ·    ·    ·    ·    ·    ·    ·    ·    ·    ·    ·    ·    ·    ·    ·
 *   Custom (usage / higher-order runner) options:
 *
 *       @property {String?} arginStyle  ("named" or "serial")
 *       @property {String?} execStyle  ("natural", "deferred", or "immediate")
 *
 *       @property {String?} arginValidationTactic         ("coerceAndCloneOrError" or "error" or "doNotCheck")
 *       @property {String?} resultValidationTactic        ("forceCoerceAndClone" or "coerceAndCloneOrError" or "error" or "doNotCheck")
 *       @property {String?} extraArginsTactic             ("warn" or "warnAndOmit" or "error" or "doNotCheck")
 *       @property {String?} extraCallbacksTactic          ("warnAndOmit" or "error" or "doNotCheck")
 *
 *       @property {Function?} finalAfterExec              (a lifecycle callback-- specifically the final after-`.exec()` handler function, as defined by parley)
 *       @property {Dictionary?} defaultMeta               (an optional dictionary of defaults to automatically include as if `.meta()` was used, but every time the machine function is executed.  `.meta()` can still be called in userland, and if so, the provided metadata is treated as overrides and `_.extend()`-ed on top of a shallow copy of the baked-in `defaultMeta`.  Note that despite this option, in userland, subsequent calls to `.meta()` after the first STILL COMPLETELY IGNORE PRIOR USERLAND `.meta()` CALLS!  For example, if you build a machine with a `defaultMeta` of `{foo: 123}`, then in userland code execute it with `.meta({foo: 456})`, in the machine's implementation, `this.foo` will be `456`.  But if you execute the machine with `.meta({foo: 456}).meta({bar: 999})`, then in the machine's implementation, `this.bar` will be `999` but `this.foo` will be `undefined`!)
 *       @property {Dictionary?} defaultArgins             (an optional dictionary of defaults to automatically include as they were passed in as argins, but every time the machine function is executed.  These take precedent over `defaultsTo`.  If any of them don't apply to this machine (i.e. no matching input), they will be ignored.)
 *
 *       @property {String?} implementationSniffingTactic  ("analog" or "analogOrClassical")
 * ·····································································································
 * @param {Error?} btOmen
 *      Our build-time omen, if relevant.
 *      (For a more complete explanation of what an "omen" is,
 *      see the relevant comments in `build.js`.)
 * ·····································································································
 * @returns {Function} a callable (aka "wet") machine function, potentially with a custom usage style.
 */
module.exports = function helpBuildMachine(opts, btOmen) {

  // Assert valid usage of this method.
  // > (in production, we skip this stuff to save cycles.  We can get away w/ that
  // > because we only include this here to provide better error msgs in development
  // > anyway)
  if (!getIsProductionWithoutDebug()) {
    if (!_.isObject(opts) || _.isArray(opts) || _.isFunction(opts)) {
      throw new Error('opts must be a dictionary (i.e. plain JavaScript object like `{}`).  But instead, got:\n'+util.inspect(opts, {depth: 5}));
    }

    // We only know how to build "dry" Node-Machine definitions.  But we also use duck-typing
    // to check for other common things which are mistakenly passed in so we can handle them
    // with explicit error messages:
    //   • already-instantiated ("wet") machine instances
    //   • naked functions
    if (
      _.isFunction(opts.def) && (
        (opts.def.getDef&&opts.def.customize) || // machine@latest
        opts.def.isWetMachine || // machine@circa v12.x-14.x
        opts.def.name==='_callableMachineWrapper'// machine@ earlier versions
      )
    ) {
      throw new Error(
        'Cannot build because building from a pre-existing Callable is no longer supported-- '+
        'please pass in the dry definition instead.\n'+
        ' [?] Check out https://sailsjs.com/support for further assistance.'
      );
    } else if (_.isFunction(opts.def)) {
      throw new Error(
        'Cannot build from a raw function.\n'+
        'Instead, please use a well-formed definition like:\n'+
        '    {\n'+
        '      fn: async function (inputs, exits) {\n'+
        '        return exits.success();\n'+
        '      }\n'+
        '    }\n'+
        ' [?] Check out https://sailsjs.com/support for further assistance.'
      );
    } else if (!_.isObject(opts.def) || _.isArray(opts.def)) {
      throw new Error('Cannot build because the definition is invalid.  Expected a dictionary (i.e. plain JavaScript object like `{}`), but instead, got:\n'+util.inspect(opts.def, {depth: 5}));
    }

    if (opts.arginStyle !== undefined && !_.contains(['named','serial'], opts.arginStyle)) {
      throw new Error('If specified, `arginStyle` must be either "named" or "serial".  But instead, got:\n'+util.inspect(opts.arginStyle, {depth: 5}));
    }
    if (opts.execStyle !== undefined && !_.contains(['natural','deferred','immediate'], opts.execStyle)) {
      throw new Error('If specified, `execStyle` must be either "natural", "deferred", or "immediate".  But instead, got:\n'+util.inspect(opts.execStyle, {depth: 5}));
    }

    if (opts.arginValidationTactic !== undefined && !_.contains(['coerceAndCloneOrError','error','doNotCheck'], opts.arginValidationTactic)) {
      throw new Error('If specified, `arginValidationTactic` must be either "coerceAndCloneOrError", "error", or "doNotCheck".  But instead, got:\n'+util.inspect(opts.arginValidationTactic, {depth: 5}));
    }
    if (opts.resultValidationTactic !== undefined && !_.contains(['forceCoerceAndClone','coerceAndCloneOrError','error','doNotCheck'], opts.resultValidationTactic)) {
      throw new Error('If specified, `resultValidationTactic` must be either "forceCoerceAndClone", "coerceAndCloneOrError", "error", or "doNotCheck".  But instead, got:\n'+util.inspect(opts.resultValidationTactic, {depth: 5}));
    }
    if (opts.extraArginsTactic !== undefined && !_.contains(['warn', 'warnAndOmit','error','doNotCheck'], opts.extraArginsTactic)) {
      throw new Error('If specified, `extraArginsTactic` must be either "warn", "warnAndOmit", "error", or "doNotCheck".  But instead, got:\n'+util.inspect(opts.extraArginsTactic, {depth: 5}));
    }
    if (opts.extraCallbacks !== undefined && !_.contains(['warnAndOmit', 'error','doNotCheck'], opts.extraCallbacks)) {
      throw new Error('If specified, `extraCallbacks` must be either "warnAndOmit", "error", or "doNotCheck" (i.e. silently omit).  But instead, got:\n'+util.inspect(opts.extraCallbacks, {depth: 5}));
    }
    if (opts.implementationSniffingTactic !== undefined && !_.contains(['analog', 'analogOrClassical'], opts.implementationSniffingTactic)) {
      throw new Error('If specified, `implementationSniffingTactic` must be either "analog" or "analogOrClassical".  But instead, got:\n'+util.inspect(opts.extraCallbacks, {depth: 5}));
    }

    var VALID_OPTIONS = [
      'def',
      // Sweeping usage style preferences:
      'arginStyle',
      'execStyle',
      // More advanced / fine-grained / intricate / lower-level / performance-oriented preferences:
      // > These options allow userland code to circumvent default conventions of the runner.
      // > Use at your own risk!  These settings potentially allow you to set up circumstances that
      // > will make your use case dependent on an interplay of guarantees and expectations between
      // > the machine implementation and your userland code.  In other words, if you change these,
      // > I sure hope you know what you're doing!
      'arginValidationTactic',
      'resultValidationTactic',
      'extraArginsTactic',
      'extraCallbacksTactic',
      // Options for higher-level runners:
      'finalAfterExec',
      'defaultMeta',
      'defaultArgins',
      // Options for implementors:
      'implementationSniffingTactic'
    ];
    var extraneousOpts = _.difference(_.keys(opts), VALID_OPTIONS);
    if (extraneousOpts.length > 0) {
      throw flaverr({
        name:
          'UsageError',
        message:
          'Sorry, cannot build function due to unrecognized option(s): '+util.inspect(extraneousOpts, {depth: 5})+'\n'+
          'Valid options are: \n'+
          ' • '+VALID_OPTIONS.join('\n • ')+'\n'+
          '\n'+
          GENERIC_HELP_SUFFIX
      }, btOmen);
    }
  }//ﬁ   (skip usage checks in non-debug production env for performance reasons)


  // Get easy access to the machine definition.
  var nmDef = opts.def;

  // Normalize + validate + set implicit defaults for implementation-related
  // build options from userland:
  var implementationSniffingTactic = opts.implementationSniffingTactic || 'analog';

  // Verify correctness of node-machine definition.
  // > Note that we modify the "dry" definition in place.
  var implProblems = normalizeMachineDef(nmDef, implementationSniffingTactic);
  if (implProblems.length > 0) {
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // NOTE: In previous versions, this was:
    // ```
    //     code: 'E_MACHINE_DEFINITION_INVALID',
    // ```
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    throw flaverr({
      name: 'ImplementationError',
      code: 'E_INVALID_DEFINITION',
      problems: implProblems,
      message:
        'Sorry, could not interpret '+(nmDef.identity?'"'+nmDef.identity+'"':'this function')+' because '+
        'its underlying implementation has '+(implProblems.length===1?'a problem':implProblems.length+' problems')+':\n'+
        '------------------------------------------------------\n'+
        '• '+implProblems.join('\n• ')+'\n'+
        '------------------------------------------------------\n'+
        '\n'+
        (nmDef.identity?
        'If you are the maintainer of "'+nmDef.identity+'", then you can change '+
        'its implementation to solve the problem'+(implProblems.length===1?'':'s')+' above.  '+
        'Otherwise, please file a bug report with the maintainer, or fork your own copy and '+
        'fix that.'
        :
        'Please resolve the problem'+(implProblems.length===1?'':'s')+' above and try again.'
        )+'\n'+
        GENERIC_HELP_SUFFIX
    }, btOmen);
  }//•


  // This variable is used as a way to easily access the effective identity
  // of this machine (e.g. in order to compute the method name for use in
  // error messages)
  var identity = nmDef.identity;

  // Normalize + validate + set implicit defaults for other userland build options:
  var arginStyle = opts.arginStyle || 'named';
  var execStyle = opts.execStyle || 'deferred';
  var extraArginsTactic = opts.extraArginsTactic || 'warnAndOmit';
  var extraCallbacksTactic = opts.extraCallbacksTactic || 'warnAndOmit';
  var arginValidationTactic = opts.arginValidationTactic || 'coerceAndCloneOrError';
  var resultValidationTactic = opts.resultValidationTactic || 'doNotCheck';
  var finalAfterExec = opts.finalAfterExec;
  var defaultMeta = opts.defaultMeta;
  var defaultArgins = opts.defaultArgins;

  if (arginStyle === 'serial') {

    // This is a sane covention to allow any machine to be called with serial usage,
    // regardless of how many inputs it has and how they're set up, and even if it
    // doesn't define an `args` array to indicate its preference for ordering.
    // (This just respects key order in `inputs`.)
    if (nmDef.args === undefined) {
      nmDef.args = _.reduce(nmDef.inputs, function(args, inputDef, inputCodeName){
        args.push(inputCodeName);
        return args;
      }, []);
    }

    // If specified, check declared `args` to be sure each entry is valid;
    // that is, either the code name of a declared input or recognized
    // special notation.
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // FUTURE: Pull this into normalize-machine-def.
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    if (nmDef.args !== undefined) {
      if (!_.isArray(nmDef.args)) {
        throw flaverr({
          name:
            'ImplementationError',
          message:
            'Sorry, cannot build function (`'+getMethodName(nmDef.identity)+'`) because\n'+
            'the underlying implementation\'s `args` is not an array.  Instead, got:\n'+
            '```\n'+
            util.inspect(nmDef.args, {depth:5})+'\n'+
            '```\n'+
            GENERIC_HELP_SUFFIX
        }, btOmen);
      }

      _.each(nmDef.args, function(arg, i) {
        if (arg === '{...}' || arg === '{…}' || arg === '...' || arg === '…' || arg === '*' || arg === '{}') {
          throw flaverr({
            name:
              'ImplementationError',
            message:
              'Sorry, cannot build function (`'+getMethodName(nmDef.identity)+'`) because\n'+
              'the underlying implementation\'s `args` array contains invalid syntax.\n'+
              '> Did you mean to use `\'{*}\'` instead?\n'+
              GENERIC_HELP_SUFFIX
          }, btOmen);
        } else if (arg === '{*}') {
          if (i !== nmDef.args.length-1){
            throw flaverr({
              name:
                'ImplementationError',
              message:
                'Sorry, cannot build function (`'+getMethodName(nmDef.identity)+'`) because\n'+
                'the underlying implementation\'s `args` array is invalid.  If the special\n'+
                '`\'{*}\'` notation is used, it must be the very last item in `args`.\n'+
                GENERIC_HELP_SUFFIX
            }, btOmen);
          } else {
            // Otherwise it's ok.  This is a valid symbol.
          }
        } else if (!_.isString(arg) || !_.contains(_.keys(nmDef.inputs), arg)) {
        // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
        // FUTURE: allow declaring variadic usage (`[[]]`) and spread usage (`etc[]`)
        // (See other "FUTURE" notes below for links w/ more info)
        // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
          throw flaverr({
            name:
              'ImplementationError',
            message:
              'Sorry, cannot build function (`'+getMethodName(nmDef.identity)+'`) because\n'+
              'the underlying implementation\'s `args` array contains invalid syntax: `'+util.inspect(arg, {depth:5})+'`\n'+
              'All entries in `args` should be either recognized special notation or the name of a declared input.\n'+
              GENERIC_HELP_SUFFIX
          }, btOmen);
        } else {
          // Otherwise it's ok. It's a recognized input code name.
        }
      });//∞


    }

  }//ﬁ




  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // FUTURE: (maybe) Since timeouts, spinlocks, catching, etc don't work unless using the
  // Deferred usage pattern, then log a warning if an explicit callback was passed in at
  // runtime for a machine implementation that declares a `timeout`.
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  // Return our callable ("wet") machine (which is just a function that runs `fn`,
  // really, plus some extra properties that we add below.)
  var wetMachine = function runFn(_argins, _explicitCbMaybe, _metadata){

    var argins;
    var explicitCbMaybe;
    var metadata;

    // Potentially build a runtime "omen".
    // (see comments in `build.js` for explanation/reminder of what an "omen" is.)
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // FUTURE: Provide a way to pass in a custom runtime omen (prbly in metadata).
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    var rtOmen = flaverr.omen(runFn);

    // In addition to the omen (which won't necessarily have been created -- e.g. in production),
    // we also define a traceRef instance.  We use this below to ensure that a particular runtime
    // error comes from the same "wet machine" invocation we expected it to come from.
    var privateTraceRef = {};

    // console.log(identity,'• arginStyle', arginStyle, ' • execStyle', execStyle);

    // Now determine how to parse our arguments.
    switch (arginStyle) {

      case 'named':
        // If "named", then `argins`, if any, are defined as a dictionary and passed in as the first argument.

        // Tolerate a few alternative usages:
        // • `runFn(function(err, result){...})`
        // • `runFn(function(err, result){...}, {...})`
        if (_.isFunction(_argins) && _.isUndefined(_explicitCbMaybe)) {
          metadata = _explicitCbMaybe;
          explicitCbMaybe = _argins;
        }//ﬁ

        if (_argins !== undefined) {
          argins = _argins;
        }
        else {
          argins = {};
        }//ﬂ

        if (_explicitCbMaybe !== undefined) {
          explicitCbMaybe = _explicitCbMaybe;
        }//ﬁ

        if (_metadata !== undefined) {
          // (fka habitat vars)
          metadata = _metadata;
        }
        else {
          metadata = {};
        }//ﬁ

        // Check usage.
        if (!_.isObject(argins) || _.isFunction(argins) || _.isArray(argins)) {
          throw flaverr({
            name:
              'UsageError',
            message:
              'Sorry, this function doesn\'t know how to handle usage like that.\n'+
              'If provided, the 1st argument should be a dictionary like `{...}`\n'+
              'consisting of input values (aka "argins") to pass through to the fn.\n'+
              GENERIC_HELP_SUFFIX
          }, rtOmen);
        }
        if (!_.isUndefined(explicitCbMaybe) && !_.isFunction(explicitCbMaybe)) {
          if (!_.isArray(explicitCbMaybe) && _.isObject(explicitCbMaybe)) {
            throw flaverr({
              name:
                'UsageError',
              message:
                'Sorry, this function doesn\'t know how to handle {...} callbacks.\n'+
                'If provided, the 2nd argument should be a function like `function(err,result){...}`\n'+
                '|  If you passed in {...} on purpose as a "switchback" (dictionary of callbacks),\n'+
                '|  please be aware that, as of machine v15, you can no longer pass in a switchback\n'+
                '|  as the 2nd argument.  And you can\'t pass a switchback in to .exec() anymore either.\n'+
                '|  Instead, you\'ll need to explicitly call .switch().\n'+
                GENERIC_HELP_SUFFIX
            }, rtOmen);
          }
          else {
            throw flaverr({
              name:
                'UsageError',
              message:
                'Sorry, this function doesn\'t know how to handle usage like that.\n'+
                'If provided, the 2nd argument should be a function like `function(err,result){...}`\n'+
                'that will be triggered as a callback after this fn is finished.\n'+
                GENERIC_HELP_SUFFIX
            }, rtOmen);
          }
        }//•

        break;

      case 'serial':

        // Parse argins
        argins = _.reduce(arguments, function(argins, argin, i){
          if (!nmDef.args) {
            throw new Error('Consistency violation: `args` is not defined in the implementation, and for some unknown reason, a suitable ordering could not be automatically inferred from `inputs`.');
          }

          if (!(nmDef.args[i])) {
            throw new Error('Invalid usage with serial arguments: Received unexpected '+(i===0?'first':i===1?'second':i===2?'third':(i+1)+'th')+' argument.');
          }

          // Interpret special notation.
          // > Remember, if we made it to this point, we know it's valid b/c it's already been checked.
          if (nmDef.args[i] === '{*}') {
            if (argin !== undefined && (!_.isObject(argin) || _.isArray(argin) || _.isFunction(argin))) {
              throw new Error('Invalid usage with serial arguments: If provided, expected '+(i===0?'first':i===1?'second':i===2?'third':(i+1)+'th')+' argument to be a dictionary (plain JavaScript object, like `{}`).  But instead, got: '+util.inspect(argin, {depth:5})+'');
            } else if (argin !== undefined && _.intersection(_.keys(argins), _.keys(argin)).length > 0) {
              throw new Error('Invalid usage with serial arguments: If provided, expected '+(i===0?'first':i===1?'second':i===2?'third':(i+1)+'th')+' argument to have keys which DO NOT overlap with other already-configured argins!  But in reality, it contained conflicting keys: '+_.intersection(_.keys(argins), _.keys(argin))+'');
            }
            _.extend(argins, argin);
          } else {
            // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
            // Note: For design considerations & historical context, see:
            // • https://github.com/node-machine/machine/commit/fa3829fa637a267793be4a7fb573e008581c4656
            // • https://github.com/node-machine/spec/pull/2/files#diff-eba3c42d87dad8fb42b4080df85facec
            // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
            // FUTURE: Support declaring variadic usage
            // https://github.com/node-machine/spec/pull/2/files#diff-eba3c42d87dad8fb42b4080df85facecR58
            // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
            // FUTURE: Support declaring spread arguments
            // https://github.com/node-machine/spec/pull/2/files#diff-eba3c42d87dad8fb42b4080df85facecR66
            // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
            // Otherwise interpret this as the code name of an input
            argins[nmDef.args[i]] = argin;
          }

          return argins;

        }, {});//= (∞)

        break;

      default:
        throw flaverr({
          name:'UsageError',
          message: 'Unrecognized arginStyle: "'+arginStyle+'"'
        }, btOmen);
    }



    // Build and return an appropriate deferred object.
    // (Or possibly just start executing the machine immediately, depending on usage)
    var deferredObj = parley(

      //  ███████╗██╗  ██╗███████╗ ██████╗██╗   ██╗████████╗██╗ ██████╗ ███╗   ██╗███████╗██████╗
      //  ██╔════╝╚██╗██╔╝██╔════╝██╔════╝██║   ██║╚══██╔══╝██║██╔═══██╗████╗  ██║██╔════╝██╔══██╗
      //  █████╗   ╚███╔╝ █████╗  ██║     ██║   ██║   ██║   ██║██║   ██║██╔██╗ ██║█████╗  ██████╔╝
      //  ██╔══╝   ██╔██╗ ██╔══╝  ██║     ██║   ██║   ██║   ██║██║   ██║██║╚██╗██║██╔══╝  ██╔══██╗
      //  ███████╗██╔╝ ██╗███████╗╚██████╗╚██████╔╝   ██║   ██║╚██████╔╝██║ ╚████║███████╗██║  ██║
      //  ╚══════╝╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═════╝    ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝
      //
      function (done){

        // Now actually run the machine, in whatever way is appropriate based on its implementation type.
        switch (nmDef.implementationType) {

          case 'composite':
            // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
            // See https://www.youtube.com/watch?v=1X-Q-HUS4mg&list=PLIQKJlrxhPyIDGAZ6CastNOmSSQkXSx2E&index=1
            // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
            return done(flaverr({name:'UsageError', message: 'This runner doesn\'t know how to interpret and execute logic implemented in this way (`implementationType: \'composite\'`).  Could you transpile it to the common tongue (JavaScript) first, and then change the declared `implementationType`?\n'+GENERIC_HELP_SUFFIX}, rtOmen));

          // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
          // FUTURE: for all `string:*` cases: make everything build properly even though `fn` doesn't exist
          // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
          case 'string:js':
            return done(flaverr({name:'UsageError', message: 'This runner doesn\'t know how to interpret and execute a code string (`implementationType: \'string:js\'`).  Could you use `eval()` on it first to get a hydrated function, and then change the declared `implementationType` to `classical` or `analog`?\n'+GENERIC_HELP_SUFFIX}, rtOmen));

          case 'string:c':
            return done(flaverr({name:'UsageError', message: 'This runner doesn\'t know how to interpret and execute code strings of logic implemented in C (`implementationType: \''+nmDef.implementationType+'\'`).  Could you transpile it to the common tongue (JavaScript) first, then change the declared `implementationType` to `string:js`?  Otherwise, try a runner written in C, or rewrite this logic in JavaScript.\n'+GENERIC_HELP_SUFFIX}, rtOmen));

          case 'string:c++':
            return done(flaverr({name:'UsageError', message: 'This runner doesn\'t know how to interpret and execute code strings of logic implemented in C++ (`implementationType: \''+nmDef.implementationType+'++\'`).  Could you transpile it to the common tongue (JavaScript) first, then change the declared `implementationType` to `string:js`?  Otherwise, try a runner written in C++, or rewrite this logic in JavaScript.\n'+GENERIC_HELP_SUFFIX}, rtOmen));

          case 'string:c#':
            return done(flaverr({name:'UsageError', message: 'This runner doesn\'t know how to interpret and execute code strings of logic implemented in C# (`implementationType: \''+nmDef.implementationType+'#\'`).  Could you transpile it to the common tongue (JavaScript) first, then change the declared `implementationType` to `string:js`?  Otherwise, try a runner written in C#, or rewrite this logic in JavaScript.\n'+GENERIC_HELP_SUFFIX}, rtOmen));

          case 'string:rust':
            return done(flaverr({name:'UsageError', message: 'This runner doesn\'t know how to interpret and execute code strings of logic implemented in Rust (`implementationType: \''+nmDef.implementationType+'\'`).  Could you transpile it to the common tongue (JavaScript) first, then change the declared `implementationType` to `string:js`?  Otherwise, try a runner written in Rust, or rewrite this logic in JavaScript.\n'+GENERIC_HELP_SUFFIX}, rtOmen));

          case 'string:php':
            return done(flaverr({name:'UsageError', message: 'This runner doesn\'t know how to interpret and execute code strings of logic implemented in PHP (`implementationType: \''+nmDef.implementationType+'\'`).  Could you transpile it to the common tongue (JavaScript) first, then change the declared `implementationType` to `string:js`?  Otherwise, try a runner written in PHP, or rewrite this logic in JavaScript.\n'+GENERIC_HELP_SUFFIX}, rtOmen));

          case 'string:python':
            return done(flaverr({name:'UsageError', message: 'This runner doesn\'t know how to interpret and execute code strings of logic implemented in Python (`implementationType: \''+nmDef.implementationType+'\'`).  Could you transpile it to the common tongue (JavaScript) first, then change the declared `implementationType` to `string:js`?  Otherwise, try a runner written in Python, or rewrite this logic in JavaScript.\n'+GENERIC_HELP_SUFFIX}, rtOmen));

          case 'string:ruby':
            return done(flaverr({name:'UsageError', message: 'This runner doesn\'t know how to interpret and execute code strings of logic implemented in Ruby (`implementationType: \''+nmDef.implementationType+'\'`).  Could you transpile it to the common tongue (JavaScript) first, then change the declared `implementationType` to `string:js`?  Otherwise, try a runner written in Ruby, or rewrite this logic in JavaScript.\n'+GENERIC_HELP_SUFFIX}, rtOmen));

          case 'string:erlang':
            return done(flaverr({name:'UsageError', message: 'This runner doesn\'t know how to interpret and execute code strings of logic implemented in Erlang (`implementationType: \''+nmDef.implementationType+'\'`).  Could you transpile it to the common tongue (JavaScript) first, then change the declared `implementationType` to `string:js`?  Otherwise, try a runner written in Erlang, or rewrite this logic in JavaScript.\n'+GENERIC_HELP_SUFFIX}, rtOmen));

          case 'string:java':
            return done(flaverr({name:'UsageError', message: 'This runner doesn\'t know how to interpret and execute code strings of logic implemented in Java (`implementationType: \''+nmDef.implementationType+'\'`).  Could you transpile it to the common tongue (JavaScript) first, then change the declared `implementationType` to `string:js`?  Otherwise, try a runner written in Java, or rewrite this logic in JavaScript.\n'+GENERIC_HELP_SUFFIX}, rtOmen));

          case 'string:groovy':
            return done(flaverr({name:'UsageError', message: 'This runner doesn\'t know how to interpret and execute code strings of logic implemented in Groovy (`implementationType: \''+nmDef.implementationType+'\'`).  Could you transpile it to the common tongue (JavaScript) first, then change the declared `implementationType` to `string:js`?  Otherwise, try a runner written in Groovy, or rewrite this logic in JavaScript.\n'+GENERIC_HELP_SUFFIX}, rtOmen));

          case 'string:scala':
            return done(flaverr({name:'UsageError', message: 'This runner doesn\'t know how to interpret and execute code strings of logic implemented in Scala (`implementationType: \''+nmDef.implementationType+'\'`).  Could you transpile it to the common tongue (JavaScript) first, then change the declared `implementationType` to `string:js`?  Otherwise, try a runner written in Scala, or rewrite this logic in JavaScript.\n'+GENERIC_HELP_SUFFIX}, rtOmen));

          case 'string:typescript':
            return done(flaverr({name:'UsageError', message: 'This runner doesn\'t know how to interpret and execute code strings of logic implemented in TypeScript (`implementationType: \''+nmDef.implementationType+'\'`).  Could you transpile it to the common tongue (JavaScript) first, then change the declared `implementationType` to `string:js`?  Otherwise, try a runner written in TypeScript, or rewrite this logic in JavaScript.\n'+GENERIC_HELP_SUFFIX}, rtOmen));

          case 'string:coffeescript':
            return done(flaverr({name:'UsageError', message: 'This runner doesn\'t know how to interpret and execute code strings of logic implemented in TypeScript (`implementationType: \''+nmDef.implementationType+'\'`).  Could you transpile it to the common tongue (JavaScript) first, then change the declared `implementationType` to `string:js`?  Otherwise, try a runner written in TypeScript, or rewrite this logic in JavaScript.\n'+GENERIC_HELP_SUFFIX}, rtOmen));

          case 'abstract':
            // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
            // FUTURE: make everything build properly even though `fn` won't exist
            // i.e. - still do the argin checks etc, and then have the machine PRETEND to execute,
            // but exit with a descriptive + parseable "Not implemented yet" kind of an error.
            // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
            return done(flaverr({name:'UsageError', message: 'The experimental `abstract` implementation type is not yet supported.  See https://sailsjs.com/support for help.'}, rtOmen));

          case 'classical':
          case 'analog':

            // If build-time options indicate that we're free to perform cloning of argins,
            // then do an initial, one-time shallow clone.  In a moment when we begin
            // validating/coercing argins, this will allow us to safely make changes
            // without damaging the argins dictionary passed in from userland (which, although
            // not recommended, still might potentially be in use elsewhere).
            if (arginValidationTactic === 'coerceAndCloneOrError') {
              argins = _.extend({}, argins);
            }

            // Validate argins vs. the declared input definitions, honoring type safety, potentially performing
            // light coercion, applying defaultsTo, ensuring required argins are present for all required inputs,
            // and preventing unexpected extraneous argins.
            // > • In many cases, this will modify `argins` in-place, as a direct reference.
            // > • Also note that this behavior is somewhat configurable via build-time options.
            var validationProblems = normalizeArgins(argins, arginValidationTactic, extraArginsTactic, defaultArgins, nmDef, rtOmen);
            if (validationProblems.length > 0) {
              return done(flaverr({
                // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
                // NOTE: In previous versions, this was:
                // ```
                //     code: 'E_MACHINE_RUNTIME_VALIDATION',
                // ```
                // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
                name:
                  'UsageError',
                code:
                  'E_INVALID_ARGINS',
                problems:
                  validationProblems,
                message:
                  'Could not run '+getMethodName(nmDef.identity)+'() because '+
                  'of '+(validationProblems.length===1?'a problem':validationProblems.length+' problems')+':\n'+
                  '------------------------------------------------------\n'+
                  '• '+validationProblems.join('\n• ')+'\n'+
                  '------------------------------------------------------\n'+
                  '\n'+
                  'Please adjust your usage and try again.\n'+
                  // '  the maintainer of "'+getMethodName(nmDef.identity)+'", then you can change '+
                  // 'If you are the maintainer of "'+getMethodName(nmDef.identity)+'", then you can change '+
                  // 'its implementation to solve the problem'+(validationProblems.length===1?'':'s')+' above.  '+
                  // 'Otherwise, please file a bug report with the maintainer, or fork your own copy and '+
                  // 'fix that.'
                  // +'\n'+
                  // 'Could not run `'+getMethodName(identity)+'` due to '+validationProblems.length+' '+
                  // 'usage problem'+(validationProblems.length===1?'':'s')+':\n'+
                  // (()=>{
                  //   var bulletPrefixedProblems = _.map(validationProblems, function (vProblem){ return '  • '+vProblem.details; });
                  //   var prettyPrintedValidationProblemsStr = bulletPrefixedProblems.join('\n');
                  //   return prettyPrintedValidationProblemsStr;
                  // })(),
                  GENERIC_HELP_SUFFIX,

              }, rtOmen));
            }//•


            // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
            // FUTURE: (maybe) Build callable forms of lambda inversions (aka submachines)??
            // But really, maybe consider ripping out support for this in the interest of simplicity.
            // Only a few machines really need to use it, and it's easy to make it work.  The only thing
            // is that we would then lose the nice, consistent handling of edge cases provided by the machine
            // runner.  But the performance benefits and simplification are probably worth it.
            // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


            // Build & return exit handler callbacks for use by the machine's `fn`.
            // > Note: The only reason this is a self-calling function is to keep private variables insulated.
            var implSideExitHandlerCbs = (function _gettingHandlerCbs(){

              var handlerCbs = function() {
                throw flaverr({
                  name: 'CompatibilityError',
                  message: 'Implementor-land switchbacks are no longer supported by default in the machine runner.  Instead of `exits()`, please call `exits.success()` or `exits.error()` from within your machine `fn`.  (For help, visit https://sailsjs.com/support)'
                }, rtOmen);
              };

              /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
              //
              //    USAGE: Node-style callback, or with a promise, or with async...await
              //    (note that, when leveraging switchbacks, there are slightly different rules)
              //
              //  _______________________________________________________________________________________________________________________________________________________________________________________________________________________________________
              //  ||            exit => | 'error' (explicit)      | 'error' (throw)         | 'error' (timeout)       | 'error' (bad argins)    | misc. exit              | misc. exit              | success                 | success                 |
              //  \/ output             | `exits.error()`         | `throw new Error()`     |                         |                         | (NOT expecting output)  | (EXPECTING output)      | (NOT expecting output)  | (EXPECTING output)      |
              //  ______________________|_________________________|_________________________|_________________________|_________________________|_________________________|_________________________|_________________________|_________________________|
              //  Error instance        | pass straight through   | pass straight through   | N/A - always an Error   | N/A - always an Error   | pass straight through   | coerce                  | pass straight through   | coerce                  |
              //                        |                         |   (handled by parley)   |   (handled by parley)   |                         |                         |                         |                         |                         |
              //  ----------------------| --  --  --  --  --  --  | --  --  --  --  --  --  | --  --  --  --  --  --  | --  --  --  --  --  --  | --  --  --  --  --  --  | --  --  --  --  --  --  | --  --  --  --  --  --  | --  --  --  --  --  --  |
              //  String data           | new Error w/ str as msg | new Error w/ str as msg | N/A - always an Error   | N/A - always an Error   | new Error w/ str as msg | coerce                  | pass straight through   | coerce                  |
              //                        |                         |                         |   (handled by parley)   |                         |                         |                         |                         |                         |
              //  ----------------------| --  --  --  --  --  --  | --  --  --  --  --  --  | --  --  --  --  --  --  | --  --  --  --  --  --  | --  --  --  --  --  --  | --  --  --  --  --  --  | --  --  --  --  --  --  | --  --  --  --  --  --  |
              //  Other non-Error data  | new Error + wrap output | new Error + wrap output | N/A - always an Error   | N/A - always an Error   | new Error + wrap output | coerce                  | pass straight through   | coerce                  |
              //                        |                         |                         |   (handled by parley)   |                         |                         |                         |                         |                         |
              //  ----------------------| --  --  --  --  --  --  | --  --  --  --  --  --  | --  --  --  --  --  --  | --  --  --  --  --  --  | --  --  --  --  --  --  | --  --  --  --  --  --  | --  --  --  --  --  --  | --  --  --  --  --  --  |
              //  No output (undefined) | new Error, generic      | new Error, generic      | N/A - always an Error   | N/A - always an Error   | new Error, w/ descrptn. | coerce                  | pass straight through   | coerce                  |
              //                        |                         |                         |   (handled by parley)   |                         |                         |                         |                         |                         |
              //  _______________________________________________________________________________________________________________________________________________________________________________________________________________________________________
              //
              /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

              // Set up support for exit forwarding in implementor-side exit handler callbacks:
              // > Note: We use another self-calling function in order to share future logic-- it's just for convenience/deduplication.
              // > The important thing is that we call `done` herein.
              (function _attachingHandlerCbs(proceed){

                // * * * Implementation of exits.error()... * * *
                handlerCbs.error = function(rawOutput){

                  // Ensure that the catchall error exit (`error`) always comes back with an Error instance
                  // (i.e. so node callback expectations are fulfilled)
                  var err;
                  if (undefined === rawOutput) {
                    err = flaverr({
                      name: 'Error',
                      message: 'Internal error occurred while running `'+getMethodName(identity)+'`.',
                      raw: flaverr({ name: 'ImplementationError' }, new Error('Called generic exits.error() callback, but without passing in an Error instance to explain "why".'), handlerCbs.error)
                      // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
                      // FUTURE: Consider doing something like this ^^ for a few of the other Errors below!
                      // (Specifically, the ones that came from a deliberate invocation of `exits.error()`
                      // since, in those cases, the trace is easily lost.  However, note the tactic of calling
                      // exits.error() deliberately is growing increasingly rare thanks to `await`, so going
                      // further than this may not really be worth it.)
                      // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
                    }, rtOmen);
                  }
                  else {
                    // Check to see if this is an Error (or close enough), and if it's not 100% canonical,
                    // then grab the proper Error instance from it.
                    var rawOutputParsedAsErr = flaverr.parseError(rawOutput);

                    if (rawOutputParsedAsErr) {

                      // Check the Error instance to see if it indicates any special meaning imposed by
                      // the machine runner, whether that be an `Exception` or argin validation error.
                      //
                      // In any of these cases, strip that information off and preserve it instead.  This allows
                      // us to correctly treat this as an internal error.
                      if (_.isError(rawOutputParsedAsErr) && (rawOutputParsedAsErr.name === 'Exception' || (rawOutputParsedAsErr.name === 'UsageError' && rawOutputParsedAsErr.code === 'E_INVALID_ARGINS'))) {
                        if (rawOutputParsedAsErr.name === 'Exception' && rawOutputParsedAsErr.traceRef === privateTraceRef) { throw new Error('Consistency violation: Somehow received exit Exception for this invocation, but in the internal handler for the error exit!  This should never happen!  (There is probably a bug in this version of the runner-- please file a bug at https://sailsjs.com/bugs)'); }

                        // IWMIH, it means this error is from some other, unrelated callable (wet machine) called
                        // internally from within the implementation.  So we can wrap it up in an external error
                        // to ease negotiation in userland code (which should _never_ need to worry about tracerefs!)
                        // > We'll also go ahead and remove our internal error's `traceRef`, now that it isn't needed anymore.
                        delete rawOutputParsedAsErr.traceRef;

                        // Note that these errors are NOT truly "wrapped" (i.e. with `flaverr.wrap()`)
                        // They are designed to be useful both as-is in deeply nested
                        // situations AND for lossless(ish) parsing by top-level runners like
                        // `machine-as-action`.  And since they need to handle both kinds of things
                        // we have to be a bit more nuanced.
                        err = flaverr({
                          name: 'Error',
                          code: 'E_INTERNAL_ERROR',
                          message: 'Internal error occurred while running `'+getMethodName(identity)+'`.  (See `.raw` for more information.)',
                          //   flaverr.getBareTrace(rawOutputParsedAsErr, 1).replace(/^\s+at\s*/, '')+'.\n'+
                          raw: rawOutputParsedAsErr
                        }, rtOmen);

                      } else {
                        err = rawOutputParsedAsErr;
                      }

                      // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
                      // Note that we could check to see if this is an internal "E_FROM_WITHIN" error here--
                      // i.e. which came from a nested invocations of a parley-wrapped function.
                      // (see https://github.com/mikermcneil/parley/blob/df030c857ccddb52707be9d74dd1392c1b050d46/lib/private/Deferred.js#L216-L245)
                      // And we could even attempt to improve the error output this way (like in whelk)--
                      // but there are problems with that approach since doing so could mess up automatic
                      // inspection and deduplication provided by parley's call stack management, since machines
                      // are regularly called from inside one other.  Thus we deliberately left this extra check out.
                      // It is included here for though, commented out- just for posterity:
                      // ```
                      // …} else if (rawOutputParsedAsErr.name === 'Envelope' && rawOutputParsedAsErr.code === 'E_FROM_WITHIN') {
                      //   err = flaverr.unwrap('E_FROM_WITHIN', rawOutputParsedAsErr);
                      // }…
                      // ```
                      // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

                    } else {
                      // Side note: In the past, string output had special handling (automatically converted into
                      // an Error instance).  But now, this causes a separate ImplementationError about how it
                      // should be an Error instance, just like any other non-Error data would.
                      err = flaverr({
                        name: 'ImplementationError',
                        message:
                        'Internal error occurred while running `'+getMethodName(identity)+'`.  Got non-Error: '+util.inspect(rawOutput, {depth: 5})+'\n'+
                        '\n'+
                        'If you are the maintainer of "'+getMethodName(identity)+'", then you can change '+
                        'its implementation to solve the problem (Most of the time, the solution is just to '+
                        'throw an actual Error instance instead.  Alternatively, if the goal was to indicate '+
                        'a particular exception, you could throw any of the special, reserved "exit signals"-- '+
                        'e.g. the code name of any of your defined exits besides "error" or "success").  '+
                        'Otherwise, please file a bug report with the maintainer, or fork your own copy and '+
                        'fix that.\n'+
                        GENERIC_HELP_SUFFIX,
                        raw: rawOutput
                      }, rtOmen);
                      // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
                      // FUTURE: add in additional verbiage explaining/clarifying why there should always
                      // be an Error instance sent back -- not some other value like this.
                      // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
                    }
                  }//ﬁ

                  return proceed(err);
                };//ƒ

                // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
                // FUTURE: MAYBE implement runtime refinement based on `like` and
                // `itemOf`  (but should consider performance here, especially since
                // output coercion is off by default now...)
                // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

                // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
                // FUTURE: MAYBE Implement runtime refinement based on `getExample`
                // (but same as above -- might not make sense anymore...)
                // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


                // * * * Implementation of exits.success()... * * *
                handlerCbs.success = function(rawOutput){

                  try {

                    // If configured to do so, ensure valid result (vs. expected output type for this exit)
                    var result;
                    if (resultValidationTactic === 'doNotCheck' || !nmDef.exits.success.outputType) {
                      result = rawOutput;
                    }
                    else if (resultValidationTactic === 'forceCoerceAndClone') {
                      try {
                        result = rttc.coerce(nmDef.exits.success.outputType, rawOutput);
                      } catch (err) {
                        throw flaverr({
                          name: 'Error',
                          message: 'Unexpected error when attempting to coerce the result from successfully running `'+getMethodName(identity)+'`.  Internal error details: '+util.inspect(err, {depth: 5}),
                          raw: err,
                          outputThatCouldNotBeCoerced: rawOutput,
                        }, rtOmen);
                      }
                    }
                    else if (resultValidationTactic === 'coerceAndCloneOrError' || resultValidationTactic === 'error') {
                      try {
                        if (resultValidationTactic === 'coerceAndCloneOrError') {
                          result = rttc.validate(nmDef.exits.success.outputType, rawOutput);
                        }
                        else {
                          rttc.validateStrict(nmDef.exits.success.outputType, rawOutput);
                          result = rawOutput;
                        }
                      } catch (err) {
                        switch (err.code) {
                          case 'E_INVALID':
                            throw flaverr({
                              name: 'ImplementationError',
                              code: 'E_INVALID_RESULT_DATA',
                              raw: rawOutput,
                              message: 'Successfully ran "'+getMethodName(identity)+'"… but with an unexpected result.\n'+
                              '------------------------------------------------------\n'+
                              ' • '+rttc.getInvalidityMessage(nmDef.exits.success.outputType, rawOutput, err, 'result data')+'\n'+
                              '------------------------------------------------------\n'+
                              '\n'+
                              'If you are the maintainer of "'+getMethodName(identity)+'", then you can change '+
                              'its implementation accordingly (either send back the proper expected data in your '+
                              'call(s) to `exits.success(…)`, or update the "success" exit\'s `outputType` to loosen '+
                              'up its data type expectation.  Otherwise, please file a bug report with the maintainer, '+
                              'or fork your own copy and fix that.\n'+
                              GENERIC_HELP_SUFFIX
                            }, rtOmen);
                          default:
                            throw err;
                        }
                      }
                    }//ﬁ
                  } catch (err) { return proceed(err); }

                  return proceed(undefined, result);

                };//ƒ

                // * * * Implementation of each of the other misc. exits  (`exits.*()`)... * * *
                _.each(_.difference(_.keys(nmDef.exits), ['error','success']), function (miscExitCodeName){
                  handlerCbs[miscExitCodeName] = function (rawOutput){

                    // If configured to do so, ensure valid result (vs. expected output type for this exit)
                    var result;
                    try {
                      if (resultValidationTactic === 'doNotCheck' || !nmDef.exits[miscExitCodeName].outputType) {
                        result = rawOutput;
                      }
                      else if (resultValidationTactic === 'forceCoerceAndClone') {
                        try {
                          result = rttc.coerce(nmDef.exits[miscExitCodeName].outputType, rawOutput);
                        } catch (err) {
                          throw flaverr({
                            name: 'Error',
                            message: 'After running "'+getMethodName(identity)+'", which triggered its "'+miscExitCodeName+'" exception, an unexpected error was encountered while attempting to coerce the result data that was returned.  Internal error details: '+util.inspect(err, {depth: 5}),
                            raw: err,
                            outputThatCouldNotBeCoerced: rawOutput
                          }, rtOmen);
                        }
                      }
                      else if (resultValidationTactic === 'coerceAndCloneOrError' || resultValidationTactic === 'error') {
                        try {
                          if (resultValidationTactic === 'coerceAndCloneOrError') {
                            result = rttc.validate(nmDef.exits[miscExitCodeName].outputType, rawOutput);
                          }
                          else {
                            rttc.validateStrict(nmDef.exits[miscExitCodeName].outputType, rawOutput);
                            result = rawOutput;
                          }
                        } catch (err) {
                          switch (err.code) {
                            case 'E_INVALID':
                              throw flaverr({
                                name: 'ImplementationError',
                                code: 'E_INVALID_RESULT_DATA',
                                raw: rawOutput,
                                message: 'Ran "'+getMethodName(identity)+'", which triggered its "'+miscExitCodeName+'" exception… but with invalid output.\n'+
                                '------------------------------------------------------\n'+
                                ' • '+rttc.getInvalidityMessage(nmDef.exits[miscExitCodeName].outputType, rawOutput, err, 'result data')+'\n'+
                                '------------------------------------------------------\n'+
                                '\n'+
                                'If you are the maintainer of "'+getMethodName(identity)+'", then you can change '+
                                'its implementation accordingly (either send back the proper expected data in your '+
                                'call(s) to `exits.'+miscExitCodeName+'(…)`, or update the "'+miscExitCodeName+'" exit\'s '+
                                '`outputType` to loosen up its data type expectation.  Otherwise, please file a bug report '+
                                'with the maintainer, or fork your own copy and fix that.\n'+
                                GENERIC_HELP_SUFFIX
                              }, rtOmen);
                            default:
                              throw err;
                          }
                        }
                      }//ﬁ

                    } catch (err) { return proceed(err); }

                    // IWMIH, the output is fine.
                    //
                    // So now build our Error instance for our "exception" (fka "forwarding error").
                    var err = flaverr(
                      (function _gettingExceptionPropsForFlaverr(){
                        var props = {
                          name: 'Exception',
                          code: miscExitCodeName,
                          exit: miscExitCodeName,//« (just an alias for `code`, for clarity and compatibility)
                          traceRef: privateTraceRef,
                          // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
                          // ^^FUTURE: Consider setting traceRef as a non-enumerable property so that it
                          // is excluded from logs.  This would potentially slow things down, so it
                          // would only be enabled in development, or in production with DEBUG truthy.
                          // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
                          message: (function _gettingErrMsg(){

                            if (!_.isObject(nmDef.exits[miscExitCodeName])) { throw new Error('Consistency violation: '+getMethodName(identity)+' has become corrupted!  One of its exits (`'+miscExitCodeName+'`) has gone missing since build-time!'); }

                            // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
                            // NOTE: For many, many more permutations of this, as well as notes &
                            // thinking around it, see:
                            // • https://github.com/node-machine/machine/commit/f93e5228138c741c2ccb160072aa1e3ad6f17ed3
                            // • https://github.com/node-machine/machine/commit/a00a14afc17fe2080ca6f84693181063e6b6811d
                            // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

                            var errMsg = '`'+getMethodName(identity)+'` failed ("'+miscExitCodeName+'").';
                            if (nmDef.exits[miscExitCodeName].description) {
                              errMsg += '  '+nmDef.exits[miscExitCodeName].description+'';
                            }

                            if (rawOutput !== undefined) {

                              // Determine prefix.
                              var rawOutputParsedAsError = flaverr.parseError(rawOutput);
                              if (rawOutputParsedAsError) {
                                errMsg += '  (Also got an additional error -- see `.raw`).';
                              } else if (nmDef.exits[miscExitCodeName].outputFriendlyName) {
                                errMsg += '\n'+nmDef.exits[miscExitCodeName].outputFriendlyName+':';
                              } else {
                                errMsg += '\nAdditional data:';
                              }

                              if (!rawOutputParsedAsError) {
                                errMsg += '\n\n'+util.inspect(rawOutput, {depth: 5});
                              }

                            }//ﬁ

                            return errMsg;
                          })(),//†
                          // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
                          // FUTURE: In the past, we also exposed:
                          // ```
                          //     output: rawOutput,
                          // ```
                          // (Nowadays, you can get this info by accessing `.raw`)
                          // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
                        };

                        // Attach `.raw` if there is a non-undefined result to include.
                        if (result !== undefined) {
                          props.raw = result;
                        }
                        return props;
                      })(),//†
                      rtOmen
                    );

                    return proceed(err);
                  };//ƒ
                });//∞  </ each misc. exit from nmDef >

              })(function (err, result){

                // Then trigger our callback with the appropriate arguments.
                if (err) { return done(err); }
                if (_.isUndefined(result)) { return done(); }
                return done(undefined, result);
              });//_∏_   (†)


              return handlerCbs;

            })();//†  (implSideExitHandlerCbs:= {…:ƒ})


            // Run `fn`.
            //
            // > Notes:
            // > (1) When running our fn, we apply a special `this` context using
            // >     the provided meta keys (aka habitat vars)
            // >
            // > (2) If the `fn` is an ES8 async function, then we also attach a handler
            // >     to `.catch()` its return value (which will be a promise) in order to
            // >     react to unhandled promise rejections in the same way that parley
            // >     automatically handles any uncaught exceptions that it throws synchronously.
            // >     (https://trello.com/c/UdK9ooJ3/108-es7-async-await-in-core-sniff-request-handler-function-to-see-if-it-s-an-async-function-if-so-then-grab-the-return-value-from-th)
            // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
            // FUTURE: benchmark this `constructor.name` check and, if tangible enough,
            // provide some mechanism for passing in this information so that it can be
            // predetermined (e.g. at build-time).
            // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

            // ªIn the event of an uncaught error being thrown from the implementation, where
            // the value thrown happens to represent a particular way to exit, rather than a
            // normal error, this `specialExitSignal` variable will be used to hold a signal
            // string.  i.e. If a string is thrown from the implementation, then we look to
            // see if it matches the name of an exit.  If so, then we consider this equivalent
            // to `exits.theExitName()`.  (This is a convenience to allow for more
            // flexible flow control in the fn, and to allow implementors to avoid
            // unnecessary code just to escape iteratees from loops, recursion, etc.)
            //
            // 2 examples:
            //
            // ```
            // throw 'emailAlreadyInUse';
            // ```
            //
            // ```
            // throw { emailAlreadyInUse: 'irl@example.com' };
            // ```
            //
            // --
            // Note below that we also check to make sure the error isn't a special E_NON_ERROR
            // envelope thrown when invoking some other parley-wrapped function from
            // within the current machine's `fn`.  If so, we check that out too.
            // (see https://github.com/mikermcneil/parley/commit/8f28d1d8f0960867e47fdac3e587db1f94f79fb8)
            var specialExitSignal;

            if (nmDef._fnIsAsyncFunction) {
              // Note that `_.bind()` works perfectly OK with ES8 async functions, at least
              // in platforms tested (such as Node 8.1.2).  We still keep this as a separate
              // code path from below though, just to be 100% about what's going on.
              var boundES8AsyncFn = _.bind(nmDef.fn, metadata);
              var promise;
              try {
                if (nmDef.implementationType === 'classical') {
                  promise = boundES8AsyncFn(argins);
                } else {
                  promise = boundES8AsyncFn(argins, implSideExitHandlerCbs, metadata);
                }
              } catch (err) {
                // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
                // FUTURE: Determine whether we can get rid of this extra try/catch
                // (pretty sure we only need the 2 places, not 3).
                // An AsyncFunction should never just straight up throw-- it should
                // return a rejecting promise.  (Obviously a non-AsyncFunction still
                // might throw-- but that's handled separately below anyhow.)
                // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

                // > See "ª" above for explanation of what's going on here w/ the special exit signal check.
                specialExitSignal = flaverr.unwrap('E_NON_ERROR', err);
                if (_.isString(specialExitSignal) && specialExitSignal !== 'error' && specialExitSignal !== 'success' && implSideExitHandlerCbs[specialExitSignal]) {
                  return implSideExitHandlerCbs[specialExitSignal]();
                }
                else if (!_.isError(specialExitSignal) && !_.isArray(specialExitSignal) && !_.isFunction(specialExitSignal) && _.isObject(specialExitSignal) && _.keys(specialExitSignal).length === 1 && _.keys(specialExitSignal)[0] !== 'error' && _.keys(specialExitSignal)[0] !== 'success' && implSideExitHandlerCbs[_.keys(specialExitSignal)[0]]) {
                  return implSideExitHandlerCbs[_.keys(specialExitSignal)[0]](specialExitSignal[_.keys(specialExitSignal)[0]]);
                }
                else {
                  return implSideExitHandlerCbs.error(err);
                }
              }//</catch>

              if (nmDef.implementationType === 'classical') {
                // Instead of expecting exits.success() to be called, use the act of returning
                // as the success exit signal, and use the return value as the success output:
                promise = promise.then(function(result) {
                  implSideExitHandlerCbs.success(result);
                });//œ
              }//ﬁ

              // Also note that here, we don't write in the usual `return done(e)` style.
              // This is deliberate -- to provide a conspicuous reminder that we aren't
              // trying to get up to any funny business with the promise chain.
              promise.catch(function(err) {
                // > See "ª" above for explanation of what's going on here w/ the special exit signal check.
                specialExitSignal = flaverr.unwrap('E_NON_ERROR', err);
                if (_.isString(specialExitSignal) && specialExitSignal !== 'error' && specialExitSignal !== 'success' && implSideExitHandlerCbs[specialExitSignal]) {
                  implSideExitHandlerCbs[specialExitSignal]();
                }
                else if (!_.isError(specialExitSignal) && !_.isArray(specialExitSignal) && !_.isFunction(specialExitSignal) && _.isObject(specialExitSignal) && _.keys(specialExitSignal).length === 1 && _.keys(specialExitSignal)[0] !== 'error' && _.keys(specialExitSignal)[0] !== 'success' && implSideExitHandlerCbs[_.keys(specialExitSignal)[0]]) {
                  implSideExitHandlerCbs[_.keys(specialExitSignal)[0]](specialExitSignal[_.keys(specialExitSignal)[0]]);
                }
                else {
                  implSideExitHandlerCbs.error(err);
                }
              });//æ


            } else {
              // When using implementationType: 'classical', things work a bit differently.
              // Instead of expecting exits.success() to be called, use the act of returning
              // as the success exit signal, and use the return value as the success output.
              var classicalResult;
              try {
                var boundFn = _.bind(nmDef.fn, metadata);
                if (nmDef.implementationType === 'classical') {
                  classicalResult = boundFn(argins);
                } else {
                  boundFn(argins, implSideExitHandlerCbs, metadata);
                }
              } catch (err) {
                // > See "ª" above for explanation of what's going on here w/ the special exit signal check.
                specialExitSignal = flaverr.unwrap('E_NON_ERROR', err);
                if (_.isString(specialExitSignal) && specialExitSignal !== 'error' && specialExitSignal !== 'success' && implSideExitHandlerCbs[specialExitSignal]) {
                  return implSideExitHandlerCbs[specialExitSignal]();
                }
                else if (!_.isError(specialExitSignal) && !_.isArray(specialExitSignal) && !_.isFunction(specialExitSignal) && _.isObject(specialExitSignal) && _.keys(specialExitSignal).length === 1 && _.keys(specialExitSignal)[0] !== 'error' && _.keys(specialExitSignal)[0] !== 'success' && implSideExitHandlerCbs[_.keys(specialExitSignal)[0]]) {
                  return implSideExitHandlerCbs[_.keys(specialExitSignal)[0]](specialExitSignal[_.keys(specialExitSignal)[0]]);
                }
                else {
                  return implSideExitHandlerCbs.error(err);
                }
              }//</catch>
              if (nmDef.implementationType === 'classical') {
                implSideExitHandlerCbs.success(classicalResult);
              }
            }

            break;

          default:
            // Unrecognized code language:
            if (_.isString(nmDef.implementationType) && nmDef.implementationType.match(/^string\:.+$/)) {
              return done(flaverr({
                name:'UsageError',
                message: 'This runner doesn\'t know how to interpret and execute code strings implemented in this language (`implementationType: \''+nmDef.implementationType+'\'`).  Could you transpile to another language like JavaScript first, then change the declared `implementationType` to `string:js`?\n'+GENERIC_HELP_SUFFIX
              }, rtOmen));
            }//•

            // Should never make it here:
            throw new Error('Consistency violation: Unrecognized implementation type in the middle of the machine runner -- but this should have been caught earlier!');

        }//</ switch(nmDef.implementationType) >

      },//ƒ </ handleExec function >

      //  ███████╗██╗  ██╗██████╗ ██╗     ██╗ ██████╗██╗████████╗     ██████╗██████╗
      //  ██╔════╝╚██╗██╔╝██╔══██╗██║     ██║██╔════╝██║╚══██╔══╝    ██╔════╝██╔══██╗
      //  █████╗   ╚███╔╝ ██████╔╝██║     ██║██║     ██║   ██║       ██║     ██████╔╝
      //  ██╔══╝   ██╔██╗ ██╔═══╝ ██║     ██║██║     ██║   ██║       ██║     ██╔══██╗
      //  ███████╗██╔╝ ██╗██║     ███████╗██║╚██████╗██║   ██║       ╚██████╗██████╔╝
      //  ╚══════╝╚═╝  ╚═╝╚═╝     ╚══════╝╚═╝ ╚═════╝╚═╝   ╚═╝        ╚═════╝╚═════╝
      //
      // If provided, use the explicit callback.
      explicitCbMaybe || undefined,

      //  ███████╗██╗  ██╗████████╗██████╗  █████╗
      //  ██╔════╝╚██╗██╔╝╚══██╔══╝██╔══██╗██╔══██╗
      //  █████╗   ╚███╔╝    ██║   ██████╔╝███████║
      //  ██╔══╝   ██╔██╗    ██║   ██╔══██╗██╔══██║
      //  ███████╗██╔╝ ██╗   ██║   ██║  ██║██║  ██║
      //  ╚══════╝╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝
      //
      //  ███╗   ███╗███████╗████████╗██╗  ██╗ ██████╗ ██████╗ ███████╗
      //  ████╗ ████║██╔════╝╚══██╔══╝██║  ██║██╔═══██╗██╔══██╗██╔════╝
      //  ██╔████╔██║█████╗     ██║   ███████║██║   ██║██║  ██║███████╗
      //  ██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██║   ██║██║  ██║╚════██║
      //  ██║ ╚═╝ ██║███████╗   ██║   ██║  ██║╚██████╔╝██████╔╝███████║
      //  ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝
      //
      // Extra methods for the Deferred:
      {
        /**
         * .retry()
         *
         * Attach an exponential backoff and retry strategy for this invocation.
         *
         * > To test on the REPL:
         * > ```
         * > require('./').build({identity:'asdf', timeout: 500, sideEffects: 'idempotent', inputs:{foo: {type:'number', required: true}},fn: function(inputs, exits){ var magicNo = inputs.foo+Math.random(); if (magicNo > 0.3) {  setTimeout(()=>{ exits.success(magicNo); }, 1000); } else  { exits.success(magicNo); } } })({foo: 0}).retry({name:'TimeoutError'}, [5, 10, 5000]).timeout(550).log()
         * > ```
         *
         * @throws {Error} If it fails even after all retries
         */
        retry: function (negotiationRule, retryDelaySeries){

          // Validate arguments
          var isValidNegotationRule = (
            (negotiationRule && _.isString(negotiationRule)) ||
            _.isArray(negotiationRule) ||
            (_.isObject(negotiationRule) && !_.isArray(negotiationRule) && !_.isFunction(negotiationRule))
          );
          if (negotiationRule !== undefined && !isValidNegotationRule) {
            throw flaverr({
              name:
                'UsageError',
              message:
                'Invalid usage of `.retry()`.  Invalid error negotiation rule: `'+util.inspect(negotiationRule,{depth:null})+'`.\n'+
                ' [?] For advice or assistance, come visit https://sailsjs.com/support'
            }, rtOmen);
          }

          if (retryDelaySeries === undefined) {
            retryDelaySeries = [ 250, 500, 1000 ];
          } else if (!_.isArray(retryDelaySeries) || retryDelaySeries.length < 1 || !_.all(retryDelaySeries, function(ms){ return _.isNumber(ms) && ms > 0 && Math.floor(ms) === ms; })) {
            throw flaverr({
              name:
                'UsageError',
              message:
                'Invalid usage of `.retry()`.  Provided retry delay series is invalid.\n'+
                'If specified, it should be an array of at least one positive integer (# ms).\n'+
                ' [?] For advice or assistance, come visit https://sailsjs.com/support'
            }, rtOmen);
          }//•

          // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
          // FUTURE: Consider bringing this back if we add support for `retry`
          // as a implementor-land thing.  (Otherwise, it's too annoying -- imagine
          // a POST request that you know is idempotent, but can't otherwise
          // communicate that to the runner!  Could also have some kind of .idempotent()
          // thing to provide a workaround, but that'd be a little over the top...)
          // ```
          // var def = wetMachine.getDef();
          // if (def.sideEffects !== 'idempotent' && def.sideEffects !== 'cacheable') {
          //   throw flaverr({
          //     name:
          //       'UsageError',
          //     message:
          //       'Sorry, it might be unsafe to use `.retry()` with this function ("'+getMethodName(def.identity)+'"),\n'+
          //       'because it does not declare itself idempotent or cacheable (e.g. `sideEffects: \'idempotent\'`).\n'+
          //       GENERIC_HELP_SUFFIX
          //   }, rtOmen);
          // }
          // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

          var callableWithNormalizedUsage = helpBuildMachine({
            def: wetMachine.getDef(),
            arginStyle: 'named',
            execStyle: 'deferred'
          });
          // ^^Purposely omitting omen argument here (build should never fail--
          // if it does, it's a bug in the runner, and we want to know where it
          // came from)

          // - - - -  - - - - - - - -  - - - - - - - -  - - - - - - - -  - - - -
          // FUTURE: Maybe figure out a way to have the "tolerate" interruption
          // bound as a result of this .retry() attached FIRST, before other
          // tolerate/intercept interruptions.
          // - - - -  - - - - - - - -  - - - - - - - -  - - - - - - - -  - - - -
          var originalDeferred = this;
          this.tolerate(negotiationRule, function $originalRetryHandler(originalErr){
            var numRetriesSoFar = 1;
            var errorsThatCausedRetries = [ originalErr ];
            var originalInvocationInfo = originalDeferred.getInvocationInfo();
            return new Promise(function(resolve, reject){
              // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
              // FUTURE: consider an opt-in warning that logs before each
              // retry (or better yet, a configurable notifier function)
              // ```
              // console.warn('Waiting '+retryDelaySeries[numRetriesSoFar - 1]+'ms before trying again...  Here is the error: ', originalErr);
              // ```
              // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
              (function _recursively(done){
                setTimeout(function (){
                  var π = callableWithNormalizedUsage(_.clone(argins), undefined, _.clone(metadata));
                  π.tolerate(negotiationRule, function(err) {
                    return new Promise(function(resolve, reject){
                      errorsThatCausedRetries.push(err);
                      if (numRetriesSoFar === retryDelaySeries.length) {
                        reject(flaverr({
                          name:
                            'UsageError',
                          message:
                            'Even after trying '+(numRetriesSoFar+1)+' times, this function ("'+getMethodName(nmDef.identity)+'"),\n'+
                            'still did not return successfully.  The original failure was as follows:\n'+
                            '--\n'+
                            originalErr.message+'\n'+
                            '--\n'+
                            '(Check out `.raw` for details about subsequent failures.)',
                          raw:
                            errorsThatCausedRetries.slice(1)
                        }, originalErr));
                      } else {
                        numRetriesSoFar++;
                        _recursively(function(err, result) {
                          if (err) { return reject(err); }
                          return resolve(result);
                        });
                      }//ﬁ
                    });//•_∏_  </ new Promise() >
                  }, { thenable: true });
                  if (originalInvocationInfo.timeout) {
                    π.timeout(originalInvocationInfo.timeout);
                  }//ﬁ
                  if (originalInvocationInfo.interruptions) {
                    // Bind tolerates/intercepts for all but the original retry
                    _.each(originalInvocationInfo.interruptions, function(interruption){
                      if (interruption.type === 'tolerate') {
                        if (interruption.handler !== $originalRetryHandler) {
                          π.tolerate(interruption.rule, interruption.handler, { thenable: interruption.thenable });
                        }//ﬁ
                        // (ignore original retry so we don't recurse infinitely)
                      } else if (interruption.type === 'intercept') {
                        π.intercept(interruption.rule, interruption.handler, { thenable: interruption.thenable });
                      } else {
                        throw new Error('Consistency violation: Unrecognized interruption type (this should never happen)');
                      }//ﬁ
                    });//∞
                  }//ﬁ
                  π.exec(done);//_∏_  </ callableWithNormalizedUsage().exec() >
                }, retryDelaySeries[numRetriesSoFar - 1]);//  </ setTimeout() >
              // ~∞%°
              })(function afterwards(err, result) {
                if (err) {
                  reject(err);
                } else {
                  resolve(result);
                }
              });//_∏_
            });//•_∏_  </ new Promise() >
          }, { thenable: true });
          return this;
        },

        /**
         * .now()
         *
         * @returns {Ref} output from machine's success exit
         * @throws {Error} If something goes wrong, or the machine's fn triggers a non-success exit.
         */
        now: function (){

          // Check that the machine definition explicitly flagged itself as synchronous.
          // > If `sync` was NOT set, then this is a usage error.
          // > You can't run a machine synchronously unless it proudly declares itself as such.
          if (!nmDef.sync) {
            throw flaverr({
              name:
                'UsageError',
              message:
                'Sorry, this function ("'+getMethodName(nmDef.identity)+'") cannot be called synchronously,\n'+
                'because it does not declare support for synchronous usage (i.e. `sync: true`).\n'+
                'Rather than `.now()`, please use `await` or `.exec()`.\n'+
                GENERIC_HELP_SUFFIX
            }, rtOmen);
          }//-•

          // Call the underlying original `.now()` method from `parley`'s Deferred.
          try {
            return this.constructor.prototype.now.call(this);
          } catch (err) {
            // Note that we don't have to worry about a traceref here because parley
            // automatically wraps E_NOT_SYNCHRONOUS errors from any internal calls
            // in the implementation.
            if (err.code === 'E_NOT_SYNCHRONOUS') {
              throw flaverr({
                name:
                  'ImplementationError',
                message:
                  'Failed to call this function ("'+getMethodName(nmDef.identity)+'") synchronously,\n'+
                  'because it is not actually synchronous.  Instead, its implementation is asynchronous--\n'+
                  'which is inconsistent with its declared interface (`sync: true`).\n'+
                  'If you are the maintainer of "'+getMethodName(nmDef.identity)+'", then you can change its\n'+
                  'implementation so that it\'s actually synchronous.  Otherwise, please file a bug report\n'+
                  'with the maintainer, or fork your own copy and fix that.\n'+
                  GENERIC_HELP_SUFFIX
              }, rtOmen);
            }
            else {
              throw err;
            }
          }
        },


        /**
         * .meta()
         */
        meta: function (_metadata){

          // Check usage.
          if (!_.isObject(_metadata) || _.isArray(_metadata) || _.isFunction(_metadata)) {
            throw flaverr({
              name:
                'UsageError',
              message:
                'When calling .meta(), please pass in a dictionary (plain JavaScript object\n'+
                'like `{}`).  The keys from this dictionary will be available as properties of\n'+
                '`this` from within the implementation (`fn`).\n'+
                GENERIC_HELP_SUFFIX
            }, rtOmen);
          }//•
          // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
          // FUTURE: Maybe prevent certain reserved meta keys from being used.
          // (e.g. similar to what we check for in `parley` re method names)
          // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

          // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
          // FUTURE: Maybe log warning when `.meta()` is called more than once?
          // (since it can be confusing that the existing metadata gets replaced)
          // (see also comments about defaultMeta for more info)
          // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

          // Now set our private `metadata`, completely replacing anything that's already there.
          // If configured to do so, extend a fresh, shallow-cloned copy of the `defaultMeta`
          // with the newly provided dictionary.  Otherwise just drop it in.
          if (defaultMeta) {
            metadata = _.extend({}, defaultMeta, _metadata);
          } else {
            metadata = _metadata;
          }

          return this;
        },


        /**
         * .switch()
         */
        switch: function (userlandHandlers) {

          // Check usage.
          if (!_.isObject(userlandHandlers) || _.isArray(userlandHandlers) || _.isFunction(userlandHandlers)) {
            throw flaverr({
              name:
                'UsageError',
              message:
                'Sorry, .switch() doesn\'t know how to handle usage like that.\n'+
                'You should pass in a dictionary like `{...}` consisting of at least two\n'+
                'handler functions: one for `error` and one for `success`.  You can also\n'+
                'provide additional keys for any other exits you want to explicitly handle.\n'+
                GENERIC_HELP_SUFFIX
            }, rtOmen);
          }//-•

          // Before proceeding, ensure error exit is still configured w/ a callback.
          // If it is not, then get crazy and **throw** BEFORE calling the machine's `fn`.
          //
          // This is just yet another failsafe-- better to potentially terminate the process than
          // open up the possibility of silently swallowing errors later.
          if (!userlandHandlers.error){
            throw flaverr({
              name:
                'UsageError',
              message:
                'Invalid usage of .switch() -- missing `error` handler.\n'+
                'If you use .switch({...}), the provided dictionary (aka "switchback"), must\n'+
                'define an `error` key with a catchall callback function.  Otherwise, there\n'+
                'would be no way to handle any unexpected or internal errors!\n'+
                GENERIC_HELP_SUFFIX
            }, rtOmen);
          }//-•

          // Same thing for the `success` handler -- except in this case, use the provided `error`
          // handler, rather than throwing an uncatchable Error.
          if (!userlandHandlers.success){
            return userlandHandlers.error(flaverr({
              name:
                'UsageError',
              message:
                'Invalid usage of .switch() -- missing `success` handler.\n'+
                'If you use .switch({...}), the provided dictionary (aka "switchback"), must\n'+
                'define a `success` key with a callback function.  If you do not care about\n'+
                'the success scenario, please provide a no-op callback, or use .exec() instead.\n'+
                GENERIC_HELP_SUFFIX
            }, rtOmen));
          }//-•

          // Unless configured otherwise, make sure that no extra callbacks were provided (i.e. for undeclared exits)
          if (extraCallbacksTactic !== 'doNotCheck') {
            var unrecognizedExitCodeNames = _.difference(_.keys(userlandHandlers), _.keys(nmDef.exits));
            if (unrecognizedExitCodeNames.length > 0) {

              var extraCallbacksErrorMsg =
              'Invalid usage of .switch() in call to `'+getMethodName(nmDef.identity)+'`.\n'+
              unrecognizedExitCodeNames.length+' of the provided handler functions (`' + unrecognizedExitCodeNames.join(', ') +'`) '+
              (unrecognizedExitCodeNames.length === 1?'does':'do')+' not match up with any recognized exit.\n'+
              'Please try again without the offending function'+(unrecognizedExitCodeNames.length === 1?'':'s')+', or check your usage and adjust accordingly.\n'+
              GENERIC_HELP_SUFFIX;

              if (extraCallbacksTactic === 'error') {
                return userlandHandlers.error(flaverr({
                  name: 'UsageError',
                  message: extraCallbacksErrorMsg
                }, rtOmen));
              }//•

              if (extraCallbacksTactic === 'warnAndOmit') {
                // Include stack trace here, if rtOmen is truthy.
                var potentialWarningSuffix = rtOmen ? '\n'+flaverr.getBareTrace(rtOmen, 3) : '';
                console.warn(
                  '- - - - - - - - - - - - - - - - - - - - - - - -\n'+
                  'WARNING: '+extraCallbacksErrorMsg+potentialWarningSuffix+'\n'+
                  '- - - - - - - - - - - - - - - - - - - - - - - -'
                );
              }//ﬁ

            }//ﬁ
          }//ﬁ


          this.exec(function (err, result){

            if (err) {

              if (err.name === 'Exception' && err.traceRef === privateTraceRef) {
                // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
                // Note: In the past, we did this:
                // ```
                // if (err.name === 'Exception' && err === omen) {
                // ```
                //
                // ...but that didn't work in prod!  (Because the omen doesn't always exist.)
                // So we changed it.
                //
                // --
                //
                // To explain why this `=== omen` check (or equivalent) is necessary, have a look at this example:
                // ```
                // var inner = require('./')({ exits: { foo: {description: 'Whoops' } }, fn: function(inputs, exits) { return exits.foo(987); } }); var outer = require('./')({ exits: { foo: { description: 'Not the same' }}, fn: function(inputs, exits) { inner({}, (err)=>{ if (err) { return exits.error(err); } return exits.success(); }); } })().switch({ error: (err)=>{ console.log('Got error:',err); }, foo: ()=>{ console.log('Should NEVER make it here.  The `foo` exit of some other machine in the implementation has nothing to do with THIS `foo` exit!!'); }, success: ()=>{ console.log('Got success.'); }, });
                // ```
                // > Note: The same thing is true any time we might want to negotiate uncaught errors or unhandled
                // > promise rejections thrown from inside `fn`, timeout errors, or RTTC validation errors.
                // > It is important to remember that other machines used internally within `fn` could cause
                // > similar-looking errors!  We take some steps to handle this automatically elsewhere in this
                // > file (see where we define the implementor-side `exits.error` callback)
                // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
                // console.log('This represents an actual exit traversal');

                if (!err.code) { throw new Error('Consistency violation: Recognized misc. exit exceptions from the machine runner should always have a `code` property, but this one does not!  Here is the Error:'+util.inspect(err, {depth:null})); }
                if (err.code === 'error' || err.code === 'success') { throw new Error('Consistency violation: Recognized misc. exit exceptions from the machine runner should NEVER have a `code` property set to `error` or `success`, but somehow, this one does!  Here is the Error:'+util.inspect(err, {depth:null})); }

                // Strip off the exception's `traceRef`, now that it isn't needed anymore.
                delete err.traceRef;

                // Sometimes userland won't provide a specific way to handle this exception:
                if (!userlandHandlers[err.code]) {
                  return userlandHandlers.error(err);
                }
                // But other times, it will:
                else {
                  return userlandHandlers[err.code](err.raw);
                }
              }//-•

              // if (err.name === 'Exception') { console.log('DEBUG: This error must have come from some internal machine from within THIS machine\'s implementation (aka `fn`)!'); }
              return userlandHandlers.error(err);
            }//-•

            userlandHandlers.success(result);
          });//</ .exec() >

          return;
        },


        // Compatibility:
        // =====================================================================================================================
        execSync: function (){
          // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
          // FUTURE: Remove this deprecated method in favor of .now().
          // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
          return this.now();
        },

        setEnv: function (_metadata) {
          // Old implementation, for reference:
          // https://github.com/node-machine/machine/blob/3cbdf60f7754ef47688320d370ef543eb27e36f0/lib/Machine.constructor.js#L365-L383
          console.warn(
            'DEPRECATED AS OF MACHINE v15: Please use `.meta()` instead of `.setEnv()` in the future\n'+
            '(adjusting it for you automatically this time)\n'
          );
          return this.meta(_metadata);
        },

        // FUTURE: Consider completely removing the rest of these compatibility-error-throwing
        // niceties in production (to optimize performance of machine construction)
        // =====================================================================================================================
        demuxSync: function () {
          throw flaverr({
            name:
              'CompatibilityError',
            message:
              'As of machine v15, the experimental `.demuxSync()` method is no longer supported.\n'+
              'Instead, please use something like this:\n'+
              '\n'+
              '```\n'+
              '    var origResultFromDemuxSync = (()=>{\n'+
              '      try {\n'+
              '        thisMethod().now();\n'+
              '        return true;\n'+
              '      } catch (e) { return false; }\n'+
              '    })();\n'+
              '```\n'+
              '\n'+
              'Here is a link to the original implementation, for reference:\n'+
              'https://github.com/node-machine/machine/blob/3cbdf60f7754ef47688320d370ef543eb27e36f0/lib/Machine.prototype.demuxSync.js'
          }, rtOmen);
        },
        cache: function () {
          throw flaverr({
            name:
              'CompatibilityError',
            message:
              'As of machine v15, built-in caching functionality (and thus the `.cache()` method) is no longer supported.\n'+
              'Instead, please use your own caching mechanism-- for example:\n'+
              '\n'+
              '```\n'+
              '    global.MY_CACHE = global.MY_CACHE || {};\n'+
              '    var result = MY_CACHE[\'foo\'];\n'+
              '    if (result === undefined) {\n'+
              '      result = await thisMethod({id:\'foo\'});\n'+
              '      MY_CACHE[\'foo\'] = result;\n'+
              '    }\n'+
              '```\n'+
              '\n'+
              'Here is a link to part of the original implementation, for reference:\n'+
              'https://github.com/node-machine/machine/blob/3cbdf60f7754ef47688320d370ef543eb27e36f0/lib/Machine.prototype.cache.js'
          }, rtOmen);
        },

      },

      //  ████████╗██╗███╗   ███╗███████╗ ██████╗ ██╗   ██╗████████╗
      //  ╚══██╔══╝██║████╗ ████║██╔════╝██╔═══██╗██║   ██║╚══██╔══╝
      //     ██║   ██║██╔████╔██║█████╗  ██║   ██║██║   ██║   ██║
      //     ██║   ██║██║╚██╔╝██║██╔══╝  ██║   ██║██║   ██║   ██║
      //     ██║   ██║██║ ╚═╝ ██║███████╗╚██████╔╝╚██████╔╝   ██║
      //     ╚═╝   ╚═╝╚═╝     ╚═╝╚══════╝ ╚═════╝  ╚═════╝    ╚═╝
      //
      // If provided, use the timeout (max # of ms to wait for this machine to finish executing)
      nmDef.timeout || undefined,
      // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
      // FUTURE: Write tests that ensure all of the scenarios in c4e738e8016771bd55b78cba277e62a83d5c61fc are working.
      // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


      //   ██████╗ ███╗   ███╗███████╗███╗   ██╗
      //  ██╔═══██╗████╗ ████║██╔════╝████╗  ██║
      //  ██║   ██║██╔████╔██║█████╗  ██╔██╗ ██║
      //  ██║   ██║██║╚██╔╝██║██╔══╝  ██║╚██╗██║
      //  ╚██████╔╝██║ ╚═╝ ██║███████╗██║ ╚████║
      //   ╚═════╝ ╚═╝     ╚═╝╚══════╝╚═╝  ╚═══╝
      //
      // Pass in the omen, if we have one.
      rtOmen || undefined,


      // To allow higher-level tools to extend this runner (e.g. for improved error messages),
      // we pass through a final interceptor function here, if one was provided, for changing
      // the error/result on the way back out from .exec().
      finalAfterExec || undefined

    );//parley(…)


    // If an explicit callback was supplied, then there won't be a deferred object.
    // (so we should bail now)
    if (!deferredObj) { return; }

    // Finally, look at the "execStyle" and determine what to do next.
    switch (execStyle) {

      case 'natural':
        if (nmDef.sync) {
          return deferredObj.now();
        }
        else {
          return deferredObj;
        }

      case 'deferred':
        return deferredObj;

      case 'immediate':
        if (nmDef.sync) {
          return deferredObj.now();
        }
        else {
          return deferredObj.toPromise();
        }

      default:
        throw flaverr({name:'UsageError'}, new Error('Unrecognized execStyle: "'+execStyle+'"'));

    }

  };//ƒ   ( constructing callable )



  // Now attach a few additional properties to the callable ("wet") machine function.
  // (This is primarily for compatibility with existing tooling, and for easy access to the def.
  // But it also enhances the UX of working with machinepacks by adding .inspect() etc.  And it
  // allows us to attach the .customize() function for providing custom usage options.)
  // > Note that these properties should NEVER be changed after this point!


  /**
   * .getDef()
   *
   * Get the original, "dry" machine definition that was used to construct this "wet" machine.
   * (Be careful: The returned definition should never be modified!)
   *
   * @returns {Ref}  [the "dry" node machine definition]
   */

  Object.defineProperty(wetMachine, 'getDef', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: function getDef(){
      return nmDef;
    }//ƒ
  });


  /**
   * .toJSON()
   *
   * Note that, if this "dry" representation is ACTUALLY JSON-stringified afterwards,
   * the stringification process will be lossy.  Functions like `fn` or `custom` validators
   * are not actually JSON serializable.  (To overcome this, use an additional layer of
   * serialization and deserialization such as rttc.dehydrate() and rttc.hydrate().)
   *
   * (Automatically invoked before JSON stringification when this is passed
   * into `JSON.stringify()`)
   */

  Object.defineProperty(wetMachine, 'toJSON', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: function toJSON(){
      return wetMachine.getDef();
    }//ƒ
  });


  /**
   * .toString()
   *
   * (Automatically invoked before casting, string concatenation, etc.)
   *
   * This can be overridden.
   */

  Object.defineProperty(wetMachine, 'toString', {
    enumerable: false,
    configurable: false,
    writable: true,
    value: function toString(){
      return '[Machine: '+nmDef.identity+']';
    }//ƒ
  });


  /**
   * Symbol.for('nodejs.util.inspect.custom')
   * (formerly known as ".inspect()")
   * https://github.com/node-machine/machine/pull/50/
   *
   * (Automatically invoked in Node.js environments when this is passed into `util.inspect()` or `console.log()`)
   *
   * This can be overridden.
   */

  Object.defineProperty(wetMachine, Symbol.for('nodejs.util.inspect.custom'), {
    enumerable: false,
    configurable: false,
    writable: true,
    value: function inspect(){
      var hasInputs = (Object.keys(nmDef.inputs).length > 0);
      var lengthOfLongestInputCodeName = (function(){
        var longest = 0;
        _.each(Object.keys(nmDef.inputs), function(inputCodeName){
          if (inputCodeName.length > longest) {
            longest = inputCodeName.length;
          }
        });
        return longest;
      })();

      // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
      // FUTURE: Potentially show include like `result = ` in example usage, if the
      // success exit has output.
      // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
      return ''+
      '-----------------------------------------\n'+
      // OVERVIEW
      // ===============
      ' .'+getMethodName(nmDef.identity)+'()\n'+
      // - - - - - - - - - - - - - - -
      // The old way, for posterity:
      // ' ['+nmDef.identity+']\n'+
      // - - - - - - - - - - - - - - -
      (
        nmDef.description ? (' \n'+nmDef.description+'\n') : ''
      )+

      // USAGE
      // ===============
      (
        execStyle === 'immediate' || execStyle === 'natural'?
        (
          '\n'+
          ' Usage:\n'+
          (
            nmDef.sync?
            '     '+getMethodName(nmDef.identity)+'('+(hasInputs?(arginStyle==='serial'?'…':'{…}'):'')+');\n'
            :
            '     await '+getMethodName(nmDef.identity)+'('+(hasInputs?(arginStyle==='serial'?'…':'{…}'):'')+');\n'
          )+
          '\n'
        )
        :
        (
          '\n'+
          ' Usage:\n'+
          (
            nmDef.sync?
            '     '+getMethodName(nmDef.identity)+'('+(hasInputs?(arginStyle==='serial'?'…':'{…}'):'')+').now();\n'
            :
            (
              '     await '+getMethodName(nmDef.identity)+'('+(hasInputs?(arginStyle==='serial'?'…':'{…}'):'')+');\n'
            )
          )+
          '\n'
        )
      )+

      // INPUTS
      // ===============
      (
        arginStyle==='serial'?
        ' Arguments:'
        :
        ' Inputs:'
      )+
      (function _formattingInputDocs(){

        var hasRequiredUnconfiguredSerialArgs;
        var lastRequiredUnconfiguredArgIdx;
        if (arginStyle === 'serial') {
          var requiredInputCodeNames = _.reduce(nmDef.inputs, function(memo, inputDef, inputCodeName) {
            if (inputDef.required) {
              memo.push(inputCodeName);
            }
            return memo;
          }, []);

          _.each(nmDef.args||_.keys(nmDef.inputs), function(arg, i){
            var isGloballyConfigured = defaultArgins? defaultArgins[arg] !== undefined : false;
            var isRequired = _.contains(requiredInputCodeNames, arg);
            if (isRequired && !isGloballyConfigured) {
              hasRequiredUnconfiguredSerialArgs = true;
              lastRequiredUnconfiguredArgIdx = i;
            }
          });//∞

        }//ﬁ

        return _.reduce((
          arginStyle==='serial' && nmDef.args?
            nmDef.args
            :
            _.keys(nmDef.inputs)
        ), function (memo, arg, i){

          var MIN_PADDING = 2;
          var pad = _.repeat(' ', Math.max(
            MIN_PADDING,
            (lengthOfLongestInputCodeName-arg.length)+MIN_PADDING
          ));


          var inputDef = nmDef.inputs[arg];
          var prettySerialArgIdx = (i<9?' ':'')+(i+1)+'.';
          var prefix = (
            // Already globally configured:
            defaultArgins && defaultArgins[arg] !== undefined?(
              arginStyle==='serial'?
              '✔ '+prettySerialArgIdx+' '
              :
              '  ✔ '
            ):
            // Required:
            inputDef && inputDef.required?(
              arginStyle==='serial'?
              '* '+prettySerialArgIdx+' '
              :
              ' -*-'
            ):
            // Optional:
            arginStyle==='serial'?(
              hasRequiredUnconfiguredSerialArgs && i < lastRequiredUnconfiguredArgIdx?
              '* '+prettySerialArgIdx+' '
              // - - - - - - - - - - - - - - - - - - - - - - - - - - - -
              // FUTURE: Consider maybe disambiguating this case
              // (although it does carry the risk of making it seem like
              // the usage is variadic)
              // ```
              // '° '+prettySerialArgIdx+' '
              // ```
              // - - - - - - - - - - - - - - - - - - - - - - - - - - - -
              :
              '  '+prettySerialArgIdx+' '
            )
            :
            '  - '
          );//:=  </prefix>

          // Handle special "{*}" syntax:
          if (arg === '{*}') {
            memo += '\n '+prefix+' {…}'+pad+'(more opts)';
            var miscInputCodeNames = _.difference(_.keys(nmDef.inputs), nmDef.args);
            _.each(miscInputCodeNames, function(inputCodeName, i){
              var isTheLastOne = (i === miscInputCodeNames.length-1);
              memo += '\n         '+(isTheLastOne?'└':'├')+'─ '+inputCodeName;
            });
            return memo;
          }//•
          // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
          // FUTURE: Support other `args` syntax
          // (see other related "FUTURE" notes in `help-build-machine` for more info)
          // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

          // Otherwise handle this like any other input:
          if (arginStyle==='serial') {
            memo += '\n '+prefix+' '+arg;
          } else {
            memo += '\n '+prefix+' '+arg;
          }

          if (inputDef.type) {
            if (_.isString(inputDef.type)) {
              memo += pad+'(type: '+inputDef.type+')';
            }
            else if (_.isEqual(['string'], inputDef.type)){
              memo += pad+'(array of strings; e.g. `[\'a\',\'b\',\'c\']`)';
            }
            else if (_.isEqual(['number'], inputDef.type)){
              memo += pad+'(array of numbers; e.g. `[1,2,3]`)';
            }
            else if (_.isArray(inputDef.type) && _.isObject(inputDef.type[0]) && !_.isArray(inputDef.type[0])){
              memo += pad+'(array of dictionaries; e.g. `[{…}, {…}, {…}]`)';
            }
            else if (_.isArray(inputDef.type)){
              memo += pad+'(an array; e.g. `[…]`)';
            }
            else if (_.isObject(inputDef.type)) {
              memo += pad+'(a dictionary; e.g. `{…}`)';
            }
            else {
              // This should never happen!
            }
          }
          else if (inputDef.example !== undefined) {
            var displayTypeInferredFromExample = rttc.inferDisplayType(inputDef.example);
            // (^^FUTURE: can probably just use actual `type` here now that the nmDef gets normalized)
            if (displayTypeInferredFromExample === 'string' || displayTypeInferredFromExample === 'number') {
              memo += pad+'(e.g. '+util.inspect(inputDef.example, {depth: 5})+')';
            }
            else {
              memo += pad+'(type: '+displayTypeInferredFromExample+')';
            }
          }

          return memo;

        }, '')||
        ' (n/a)';
      })()+'\n'+//†
      '-----------------------------------------\n';

    }//ƒ
  });//…)   ( defining property on callable )


  // Set up a home for cached customizations.
  // (See `customize()` below for more information.)
  var cachedCustomizations = {};

  /**
   * .customize()
   *
   * Re-build a customized version of this machine on the fly, using the specified
   * custom usage options.
   * > If this exact customization has been used before for this machine,
   * > the customized machine will be _cloned and cached_.  This works much
   * > like Node's core require() cache, and is designed to improve performance
   * > by avoiding unnecessarily duplicating work on a per-call basis.
   *
   * @param {Dictionary} customUsageOpts
   *   @property {String?} arginStyle  ("named" or "serial")
   *   @property {String?} execStyle  ("deferred" or "immediate")
   *   … (For full reference of opts, see `buildWithCustomUsage()`)
   *
   * @returns {Ref}  [a custom, spin-off duplicate of this set machine w/ custom usage]
   */
  Object.defineProperty(wetMachine, 'customize', {
    enumerable: false,
    configurable: false,
    writable: true,
    value: function customize(customUsageOpts){
      if (!customUsageOpts || _.isEqual(customUsageOpts, {})) { throw new Error('Consistency violation: Cannot call `.customize()` without providing any custom usage options!  Please specify at least one option such as "arginStyle" or "execStyle".'); }
      if (!_.isObject(customUsageOpts) || _.isArray(customUsageOpts) || _.isFunction(customUsageOpts)) { throw new Error('Consistency violation: `.customize()` must be called with a dictionary of custom usage options.'); }
      if (customUsageOpts.def !== undefined) { throw new Error('Consistency violation: Cannot specify `def` when calling `.customize()`!  Instead, specify custom usage options like "arginStyle" or "execStyle".'); }

      // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
      // FUTURE: Maybe support shallow-merging on top of existing custom usage
      // opts as overrides, rather than requiring a complete replacement
      // e.g.
      // ```
      // customUsageOpts = _.extend({
      //   arginStyle: arginstyle,
      //   execStyle: execStyle,
      //   extraArginsTactic: extraArginsTactic,
      //   //…
      //   //etc…
      //   //…
      // }, customUsageOpts);
      // ```
      // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

      var hashed;
      try {
        hashed = hashCustomUsageOpts(customUsageOpts);
      } catch (err) {
        if (!flaverr.taste('E_UNHASHABLE', err)) {
          throw err;
        }
      }//>-

      // Use cached customization, if possible.
      if (hashed && cachedCustomizations[hashed]) {
        return cachedCustomizations[hashed];
      }//-•

      var customizedWetMachine = helpBuildMachine(_.extend({
        def: wetMachine.getDef(),
      }, customUsageOpts));

      // Cache this customization in case `.customize()` gets called again.
      if (hashed) {
        cachedCustomizations[hashed] = customizedWetMachine;
      }

      return customizedWetMachine;
    }//ƒ
  });//…)   ( defining property on callable )




  /**
   * .with()
   *
   * Pre-invoke this callable with the specified dictionary of named argins,
   * regardless of the current `arginStyle` setting.
   *
   * > This is an "escape hatch" from `arginStyle: 'serial'`; useful for
   * > situations where it's cleaner/easier/more obvious for userland code
   * > to use named input parameters instead of serial arguments.
   * > If this Callable's arginStyle is ALREADY 'serial', then the `with`
   * > property is just a circular reference to the Callable itself, rather
   * > than a separate customization.
   *
   * @type {Callable}
   */

  Object.defineProperty(wetMachine, 'with', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: arginStyle === 'named' ? wetMachine : wetMachine.customize({
      arginStyle: 'named',
      execStyle: execStyle,
      extraArginsTactic: extraArginsTactic,
      extraCallbacksTactic: extraCallbacksTactic,
      arginValidationTactic: arginValidationTactic,
      resultValidationTactic: resultValidationTactic,
      finalAfterExec: finalAfterExec,
      defaultMeta: defaultMeta,
      defaultArgins: defaultArgins,
      // Note there is no reason to pass through `implementationSniffingTactic`
      // here, since it would have already applied now (it applies at build-time.)
    })
  });



  return wetMachine;

};
