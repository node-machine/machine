/**
 * Module dependencies
 */

var util = require('util');
var _ = require('lodash');
var Machine = require('../../');




module.exports = function testInputValidation(options, cb){
  var _inputsInFn;
  var machine = Machine.build({
    inputs: {
      x: (function _determineInputDefinition(){
        var def = {};
        if (!_.isUndefined(options.required)) {
          def.required = options.required;
        }
        if (!_.isUndefined(options.example)) {
          def.example = options.example;
        }
        if (!_.isUndefined(options.typeclass)) {
          def.typeclass = options.typeclass;
        }
        if (!_.isUndefined(options.getExample)) {
          def.getExample = options.getExample;
        }
        if (!_.isUndefined(options.validate)) {
          def.validate = options.validate;
        }
        return def;
      })()
    },
    exits: {
      error: {},
      success: {}
    },
    fn: function (inputs, exits) {
      _inputsInFn = inputs;
      exits();
    }
  })
  .configure({
    x: options.actual
  })
  .exec(function (err){

    // validate that error exit was traversed, if expected
    if (err){
      if (options.error) return cb();
      return cb(new Error('did not expect machine to call `error`, but it did:\n' + err));
    }
    else if (options.error) {
      return cb(new Error('expected machine to call `error` exit due to input validation error, but it did not.'));
    }

    if (!_.isUndefined(options.result)) {
      if (!_.isObject(_inputsInFn)) {
        return cb(new Error('`inputs` argument in machine fn was corrupted!'));
      }
      // validate `_inputsInFn` against expected result
      if (!_.isEqual(_inputsInFn.x, options.result)){
        return cb(new Error('incorrect input value passed to machine, got: '+util.inspect(_inputsInFn.x)));
      }
    }

    return cb();
  });
};

