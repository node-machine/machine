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
        T.rttc(inputSchema, test);
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
        T.rttc(inputSchema, test);
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
        T.rttc(inputSchema, test);
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
                baz: 'world'
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
        T.rttc(inputSchema, test);
      }, Error);
    });

  });

});
