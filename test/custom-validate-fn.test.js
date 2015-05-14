var assert = require('assert');
var M = require('../lib/Machine.constructor');

describe('Custom `validate()` for an input', function() {

  ////////////////////////////////
  // Valid
  ////////////////////////////////

  it('should run when validate returns true', function(done) {

    var machine = {
      inputs: {
        foo: {
          validate: function(inputs, env) {
            return true;
          }
        }
      },

      exits: {
        success: {},
        error: {}
      },

      fn: function (inputs, exits, deps) {
        exits();
      }
    };

    M.build(machine)
    .configure({
      foo: {
        bar: 'hello',
        baz: 123
      }
    })
    .exec(function(err, result) {
      if(err) return done(err);
      done();
    });
  });

  ////////////////////////////////
  // Invalid
  ////////////////////////////////

  it('should fail when validate returns false', function(done) {

    var machine = {
      inputs: {
        foo: {
          validate: function(inputs, env) {
            return false;
          }
        }
      },

      exits: {
        success: {},
        error: {}
      },

      fn: function (inputs, exits, deps) {
        exits();
      }
    };

    M.build(machine)
    .configure({
      foo: {
        bar: 'hello',
        foo: 123
      }
    })
    .exec(function(err, result) {
      assert(err);
      done();
    });
  });

  it('should fail when an input is defined with a valid key', function() {

    var machine = {
      inputs: {
        foo: {
          valid: true
        }
      },

      exits: {
        success: {},
        error: {}
      },

      fn: function (inputs, exits, deps) {
        exits();
      }
    };

    assert.throws(function() {
      M.build(machine);
    });
  });

});
