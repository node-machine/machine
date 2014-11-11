var assert = require('assert');
var T = require('../../lib/types');

describe('Run-time type checking', function() {

  describe('when objects values are used', function() {

    // Build an example input schema
    var inputSchema = {
      foo: {
        type: {
          bar: {
            baz: 'string'
          },
          foo: {
            bar: {
              baz: 'number'
            }
          }
        },
        required: true
      },
      bar: {
        type: 'number',
        required: false
      }
    };


    ////////////////////////////////
    // Valid
    ////////////////////////////////

    it('should validate when all required keys are met', function() {
      var test = {
        foo: {
          bar: {
            baz: 'hello'
          },
          foo: {
            bar: {
              baz: 4
            }
          }
        }
      };

      assert.doesNotThrow(function() {
        T.rttc(inputSchema, test, {coerce: true});
      });
    });

    it('should validate when all keys are valid', function() {
      var test = {
        foo: {
          bar: {
            baz: 'hello'
          },
          foo: {
            bar: {
              baz: 4
            }
          }
        },
        bar: 2
      };

      assert.doesNotThrow(function() {
        T.rttc(inputSchema, test, {coerce: true});
      });
    });

    ////////////////////////////////
    // Invalid
    ////////////////////////////////

    it('should not validate when all required keys are not met', function() {
      var test = {
        bar: 2
      };

      assert.throws(function() {
        T.rttc(inputSchema, test, {coerce: true});
      }, Error);
    });

    it('should not validate when all keys are not valid', function() {
      var test = {
        foo: {
          bar: {
            baz: 'hello'
          },
          foo: {
            bar: {
              baz: NaN
            }
          }
        }
      };

      assert.throws(function() {
        T.rttc(inputSchema, test, {coerce: true});
      }, Error);
    });

    ////////////////////////////////
    // Key Stripping
    ////////////////////////////////

    it('should remove keys that do not have a value in the schema', function() {
      var test = {
        foo: {
          bar: {
            baz: 'hello'
          },
          foo: {
            bar: {
              baz: 23
            }
          },
          boo: 'world'
        }
      };

      assert.doesNotThrow(function() {
        T.rttc(inputSchema, test, {coerce: true});
      });

      assert(!test.foo.boo);
    });

  });

});
