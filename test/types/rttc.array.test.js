var assert = require('assert');
var T = require('../../lib/types');

describe('Run-time type checking', function() {

  describe('when arrays of objects are used', function() {

    // Build an example input schema
    var inputSchema = {
      key: {
        type: [{
          foo: {
            bar: {
              baz: 'string'
            },
            foo: {
              bar: {
                baz: 'number'
              }
            }
          }
        }],

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
        key: [{
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
        },
        {
          foo: {
            bar: {
              baz: 'goodbye'
            },
            foo: {
              bar: {
                baz: 21
              }
            }
          }
        }]
      };

      assert.doesNotThrow(function() {
        T.rttc(inputSchema, test, {coerce: true});
      });
    });

    it('should validate when all keys are valid', function() {
      var test = {
        key: [{
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
        }],
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
        key: [{
          foo: {
            bar: {
              baz: 'hello'
            },
            foo: {
              bar: {
                baz: Infinity
              }
            }
          }
        },
        {
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
        }]
      };

      assert.throws(function() {
        T.rttc(inputSchema, test, {coerce: true});
      }, Error);
    });
  });

  describe('when an array with a star is used', function() {

    describe('and primative values are given at run-time', function() {

      ////////////////////////////////
      // Valid
      ////////////////////////////////

      it('should validate when all the items are numbers', function() {

        // Build an example input schema
        var inputSchema = {
          key: {
            type: ['*'],
            required: true
          }
        };

        var test = {
          key: [1,2]
        };

        assert.doesNotThrow(function() {
          T.rttc(inputSchema, test, {coerce: true});
        });
      });

      it('should validate when all the items are strings', function() {

        // Build an example input schema
        var inputSchema = {
          key: {
            type: ['*'],
            required: true
          }
        };

        var test = {
          key: ['foo', 'bar']
        };

        assert.doesNotThrow(function() {
          T.rttc(inputSchema, test, {coerce: true});
        });
      });

      ////////////////////////////////
      // Invalid
      ////////////////////////////////

      it('should NOT validate when all the items are not numbers', function() {

        // Build an example input schema
        var inputSchema = {
          key: {
            type: ['*'],
            required: true
          }
        };

        var test = {
          key: [1, 'foo']
        };

        assert.throws(function() {
          T.rttc(inputSchema, test, {coerce: true, baseType: false});
        });
      });
    });

    describe('and objects are given at run-time', function() {

      ////////////////////////////////
      // Valid
      ////////////////////////////////

      it('should validate when all the items are the same', function() {

        // Build an example input schema
        var inputSchema = {
          key: {
            type: ['*'],
            required: true
          }
        };

        var test = {
          key: [{ name: 'bob' }, { name: 'susan' }]
        };

        assert.doesNotThrow(function() {
          T.rttc(inputSchema, test, {coerce: true});
        });
      });

      ////////////////////////////////
      // Invalid
      ////////////////////////////////

      it('should NOT validate when all the items are not the same', function() {

        // Build an example input schema
        var inputSchema = {
          key: {
            type: ['*'],
            required: true
          }
        };

        var test = {
          key: [{ name: 'bob' }, { age: 22 }]
        };

        assert.throws(function() {
          T.rttc(inputSchema, test, {coerce: true, baseType: false});
        });
      });
    });

  });

});
