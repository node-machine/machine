var assert = require('assert');
var T = require('../../lib/types');

describe('Run-time type checking', function() {

  describe('when primative values are used', function() {

    // Build an example input schema
    var inputSchema = {
      foo: {
        type: 'string',
        required: true
      },
      bar: {
        type: 'number',
        required: false
      },
      baz: {
        type: 'boolean',
        required: true
      }
    };


    ////////////////////////////////
    // Valid
    ////////////////////////////////

    it('should validate when all required keys are met', function() {
      var test = {
        foo: 'bar',
        baz: false
      };

      assert.doesNotThrow(function() {
        T.rttc(inputSchema, test);
      });
    });

    it('should validate when all keys are valid', function() {
      var test = {
        foo: 'bar',
        bar: 2,
        baz: false
      };

      assert.doesNotThrow(function() {
        T.rttc(inputSchema, test);
      });
    });

    ////////////////////////////////
    // Invalid
    ////////////////////////////////

    it('should not validate when all required keys are not met', function() {
      var test = {
        foo: 'bar'
      };

      assert.throws(function() {
        T.rttc(inputSchema, test);
      }, Error);
    });

    it('should not validate when all keys are not valid', function() {
      var test = {
        foo: 'bar',
        bar: '2',
        baz: false
      };

      assert.throws(function() {
        T.rttc(inputSchema, test);
      }, Error);
    });

  });

});
