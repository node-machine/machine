var assert = require('assert');
var M = require('../../lib/Machine.constructor');

describe('Machine inputs getExample', function() {

  var machine = {
    inputs: {
      foo: {
        getExample: function(inputs, env) {
          return {
            bar: 'baz',
            baz: 1
          }
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


  ////////////////////////////////
  // Valid
  ////////////////////////////////

  it('should run get example to build up a schema', function(done) {
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

  it('should coerce run-time input values', function(done) {
    M.build(machine)
    .configure({
      foo: {
        bar: 'world',
        baz: '123'
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

  it('should fail when the run-time inputs don\'t match the results of getExample', function(done) {
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

});
