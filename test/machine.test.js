var assert = require('assert');
var M = require('../lib/Machine.constructor');

describe('Machine test', function() {

  var machine = {
    inputs: {
      foo: {
        example: 'foo bar'
      },
      bar: {
        example: 2
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

  it('should run with valid inputs', function(done) {
    M.build(machine)
    .configure({
      foo: 'hello',
      bar: 4
    })
    .exec(function(err, result) {
      if(err) return done(err);
      done();
    });
  });

  it('should error with invalid inputs when input coercion is off', function(done) {
    M.build(machine)
    .configure({
      foo: 'hello',
      bar: '4'
    })
    .inputCoercion(false)
    .exec(function(err, result) {
      assert(err);
      done();
    });
  });

  it('should not error with invalid inputs when input coercion is on', function(done) {
    M.build(machine)
    .configure({
      foo: 'hello',
      bar: '4'
    })
    .inputCoercion(true)
    .exec(function(err, result) {
      if(err) return done(err);
      done();
    });
  });

});
