var assert = require('assert');
var T = require('../../lib/types');

describe('Run-time type checking', function() {
  describe('input coercion', function() {

    describe('with numbers', function() {

      // Build an example input schema
      var inputSchema = {
        foo: {
          type: 'number',
        }
      };

      ////////////////////////////////
      // Valid
      ////////////////////////////////

      it('should validate and coerce when the number 2 is used', function() {
        var test = {
          foo: 2
        };

        assert.doesNotThrow(function() {
          T.rttc(inputSchema, test, {coerce: true});
        });
      });

      it('should validate and coerce when the string "2" is used', function() {
        var test = {
          foo: '2'
        };

        assert.doesNotThrow(function() {
          T.rttc(inputSchema, test, {coerce: true});
        });
      });

      it('should validate and coerce when the float 2.32 is used', function() {
        var test = {
          foo: 2.32
        };

        assert.doesNotThrow(function() {
          T.rttc(inputSchema, test, {coerce: true});
        });
      });

      it('should validate and coerce when the string "2.32" is used', function() {
        var test = {
          foo: '2.32'
        };

        assert.doesNotThrow(function() {
          T.rttc(inputSchema, test, {coerce: true});
        });
      });


      ////////////////////////////////
      // Invalid
      ////////////////////////////////

      it('should not validate when the string "Infinity" is used', function() {
        var test = {
          foo: 'Infinity'
        };

        assert.throws(function() {
          T.rttc(inputSchema, test, {coerce: true});
        }, Error);
      });

      it('should not validate when the number Infinity is used', function() {
        var test = {
          foo: Infinity
        };

        assert.throws(function() {
          T.rttc(inputSchema, test, {coerce: true});
        }, Error);
      });

      it('should not validate when null is used', function() {
        var test = {
          foo: null
        };

        assert.throws(function() {
          T.rttc(inputSchema, test, {coerce: true});
        }, Error);
      });

      it('should not validate when NaN is used', function() {
        var test = {
          foo: NaN
        };

        assert.throws(function() {
          T.rttc(inputSchema, test, {coerce: true});
        }, Error);
      });

    });
  });
});
