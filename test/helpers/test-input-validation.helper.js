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
    if (options.error){
      if (!err) return cb(new Error('expected input validation error'));
    }

    if (!_.isUndefined(options.result)) {
      // validate `_inputsInFn` against expected result
      if (!_.isEqual(_inputsInFn.x, options.result)){
        return cb(new Error('incorrect input value passed to machine, got: '+util.inspect(_inputInFn.x)));
      }
    }

    return cb();
  });
};

