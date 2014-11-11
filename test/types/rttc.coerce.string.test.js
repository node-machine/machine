var assert = require('assert');
var T = require('../../lib/types');

describe('Run-time type checking', function() {
  describe('input coercion', function() {

    describe('with strings', function() {

      // Build an example input schema
      var inputSchema = {
        foo: {
          type: 'string',
        }
      };

      ////////////////////////////////
      // Valid
      ////////////////////////////////

      it('should validate and coerce when the boolean true is used', function() {
        var test = {
          foo: true
        };

        assert.doesNotThrow(function() {
          T.rttc(inputSchema, test, {coerce: true});
        });
      });

      it('should validate and coerce when the boolean false is used', function() {
        var test = {
          foo: false
        };

        assert.doesNotThrow(function() {
          T.rttc(inputSchema, test, {coerce: true});
        });
      });

      it('should validate and coerce when the integer 2 is used', function() {
        var test = {
          foo: 2
        };

        assert.doesNotThrow(function() {
          T.rttc(inputSchema, test, {coerce: true});
        });
      });

      it('should validate and coerce when the integer -2 is used', function() {
        var test = {
          foo: -2
        };

        assert.doesNotThrow(function() {
          T.rttc(inputSchema, test, {coerce: true});
        });
      });

      it('should validate and coerce when the decimal 2.32 is used', function() {
        var test = {
          foo: 2.32
        };

        assert.doesNotThrow(function() {
          T.rttc(inputSchema, test, {coerce: true});
        });
      });


      ////////////////////////////////
      // Invalid
      ////////////////////////////////

      it('should not validate when a function is used', function() {
        var test = {
          foo: function() {}
        };

        assert.throws(function() {
          T.rttc(inputSchema, test, {coerce: true});
        }, Error);
      });

      it('should not validate when an Error is used', function() {
        var test = {
          foo: Error
        };

        assert.throws(function() {
          T.rttc(inputSchema, test, {coerce: true});
        }, Error);
      });

      it('should not validate when a regexp is used', function() {
        var test = {
          foo: /hfsdkjhf/
        };

        assert.throws(function() {
          T.rttc(inputSchema, test, {coerce: true});
        }, Error);
      });

      it('should not validate when a date is used', function() {
        var test = {
          foo: new Date()
        };

        assert.throws(function() {
          T.rttc(inputSchema, test, {coerce: true});
        }, Error);
      });

      it('should not validate when an object is used', function() {
        var test = {
          foo: {}
        };

        assert.throws(function() {
          T.rttc(inputSchema, test, {coerce: true});
        }, Error);
      });

      it('should not validate when an array is used', function() {
        var test = {
          foo: []
        };

        assert.throws(function() {
          T.rttc(inputSchema, test, {coerce: true});
        }, Error);
      });

      it('should not validate when an array of objects is used', function() {
        var test = {
          foo: [{}]
        };

        assert.throws(function() {
          T.rttc(inputSchema, test, {coerce: true});
        }, Error);
      });

      it('should not validate when Infinity is used', function() {
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

    });
  });
});
