/**
 * Module dependencies
 */

var util = require('util');
var Machine = require('../');
var _ = require('lodash');


describe('input validation/coercion', function (){

  var INPUT_TEST_SUITE = [
    {
      actual: 'bar',
      example: 'foo',
      result: 'bar'
    },
    {
      actual: 'bar',
      example: 'foo',
      result: 'bar'
    },
    {
      actual: 4.5,
      example: 123,
      result: 4.5
    },
    {
      actual: '4.5',
      example: 123,
      result: 4.5
    },
    {
      actual: '-4.5',
      example: 123,
      result: -4.5
    },
    {
      actual: 'asgasdgjasdg',
      example: 123,
      error: true
    },
    {
      actual: true,
      example: false,
      result: true
    },
    {
      actual: 'true',
      example: false,
      result: true
    },
    {
      actual: 'false',
      example: false,
      result: false
    },
  ];

  _.each(INPUT_TEST_SUITE, function (test){

    describe((function _determineDescribeMsg(){
      var msg = '';
      if (test.required){
        msg += 'required input ';
      }
      else {
        msg += 'optional input ';
      }
      if (!_.isUndefined(test.example)) {
        msg += 'with a '+typeof test.example+' example ('+util.inspect(test.example,false, null)+')';
      }
      else if (!_.isUndefined(test.typeclass)) {
        msg +='with typeclass: '+test.typeclass;
      }
      else {
        msg +='with neither an example nor typeclass';
      }

      return msg;
    })(), function suite (){
      if (test.error) {
        it('should error', function (done){
          testInputValidation(test, done);
        });
        return;
      }
      else {
        it(util.format('should coerce %s', util.inspect(test.actual, false, null), 'into '+util.inspect(test.result, false, null)+''), function (done){
          testInputValidation(test, done);
        });
      }
    });
  });

});


describe('exit coercion', function (){

  var EXIT_TEST_SUITE = [
    {
      actual: 'bar',
      example: 'foo',
      result: 'bar'
    },
    {
      actual: 'bar',
      example: 'foo',
      result: 'bar'
    },
    {
      actual: 4.5,
      example: 123,
      result: 4.5
    },
    {
      actual: '4.5',
      example: 123,
      result: 4.5
    },
    {
      actual: '-4.5',
      example: 123,
      result: -4.5
    },
    {
      actual: 'asgasdgjasdg',
      example: 123,
      error: true
    },
    {
      actual: true,
      example: false,
      result: true
    },
    {
      actual: 'true',
      example: false,
      result: true
    },
    {
      actual: 'false',
      example: false,
      result: false
    },
  ];

  _.each(EXIT_TEST_SUITE, function (test){

    describe((function _determineDescribeMsg(){
      var msg = '';
      if (test.void){
        msg += 'void exit ';
      }
      else {
        msg += 'exit ';
      }

      if (!_.isUndefined(test.example)) {
        msg += 'with a '+typeof test.example+' example ('+util.inspect(test.example,false, null)+')';
      }
      else {
        msg +='with no example';
      }

      return msg;
    })(), function suite (){
      if (test.error) {
        it('should error', function (done){
          testInputValidation(test, done);
        });
        return;
      }
      else {
        it(util.format('should coerce %s', util.inspect(test.actual, false, null), 'into '+util.inspect(test.result, false, null)+''), function (done){
          testInputValidation(test, done);
        });
      }
    });
  });

});




function testInputValidation(options, cb){
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
}


function testExitCoercion(options, cb){
  var _inputsInFn;
  var machine = Machine.build({
    inputs: {},
    exits: {
      error: {},
      success: (function _determineExitDefinition(){
        var def = {};
        if (!_.isUndefined(options.example)) {
          def.example = options.example;
        }
        if (!_.isUndefined(options.getExample)) {
          def.getExample = options.getExample;
        }
        if (!_.isUndefined(options.void)) {
          def.void = options.void;
        }
        return def;
      })()
    },
    fn: function (inputs, exits) {
      exits(null, options.actual);
    }
  })
  .exec(function (err, result){
    if (err) return cb(new Error('Unexpected error:'+require('util').inspect(err, false, null)));
    var expectedOutputValue = options.result;
    // TODO validate against expected output
    return cb(err, result);
  });
}
