/**
 * Module dependencies
 */

var util = require('util');
var _ = require('lodash');
var testExitCoercion = require('./helpers/test-exit-coercion.helper');



describe('exit output coercion', function (){

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
      result: 0,
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
          testExitCoercion(test, done);
        });
      }
    });
  });

});
