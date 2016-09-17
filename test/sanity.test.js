var assert = require('assert');
var M = require('../lib/Machine.constructor');

describe('Sanity test', function() {

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
      if(err) { return done(err); }
      done();
    });
  });

  it('should error with mildly-invalid inputs when input coercion is off', function(done) {

    var live = M.build(machine)
    .configure({
      foo: 'hello',
      bar: '4'
    });

    live._inputCoercion = false;

    live.exec(function(err, result) {
      assert(err, 'expected error providing `"4"` to an input with example === `4`');
      done();
    });
  });

  it('should not error with mildly-invalid inputs when input coercion is on', function(done) {
    M.build(machine)
    .configure({
      foo: 'hello',
      bar: '4'
    })
    .exec(function(err, result) {
      if(err) { return done(err); }
      done();
    });
  });

  it('should error when undeclared exits are configured', function(done) {
    try {
      var live = M.build(machine)
      .configure({
        foo: 'hello',
        bar: 4
      });

      live._inputCoercion = false;

      live.exec({
        success: function(){},
        error: function() {},
        baz: function() {},
        boop: function() {}
      });

      return done(new Error('Expected an error regarding undeclared exits `baz, boop`.'));

    } catch (e) {
      return done();
    }
  });


});
