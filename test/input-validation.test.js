/**
 * Module dependencies
 */

var util = require('util');
var _ = require('lodash');
var testInputValidation = require('./helpers/test-input-validation.helper');




describe('input validation/coercion', function (){

  var INPUT_TEST_SUITE = [
    ////////////////////////////////////////////
    // STRINGS
    ////////////////////////////////////////////
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
    ////////////////////////////////////////////
    // NUMBERS
    ////////////////////////////////////////////
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
    ////////////////////////////////////////////
    // BOOLEANS
    ////////////////////////////////////////////
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

    ////////////////////////////////////////////
    // DICTIONARIES
    ////////////////////////////////////////////


    ////////////////////////////////////////////
    // ARRAYS
    ////////////////////////////////////////////

    ////////////////////////////////////////////
    // MISC
    ////////////////////////////////////////////
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
