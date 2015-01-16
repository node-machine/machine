var assert = require('assert');
var M = require('../../lib/Machine.constructor');

describe('Machine inputs getExample', function() {

  var machine = {
    inputs: {
      foo: {
        getExample: function(inputs, env) {
          return inputs.bar == 'int' ? 123 : ['abc'];
        }
      },
      bar: {
        example: 'abc'
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
      foo: 123,
      bar: 'int'
    })
    .exec(function(err, result) {
      if(err) return done(err);
      done();
    });
  });

  it('should coerce run-time input values', function(done) {
    M.build(machine)
    .configure({
      foo: '123',
      bar: 'int'
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
    console.log('\n\n\n------------');
    M.build(machine)
    .configure({
      foo: 123,
      bar: 'abc'
    })
    .exec(function(err, result) {
      assert(err, 'expected error because (for input `foo`) getExample() returned an array but a number was provided as the configured value');
      done();
    });
  });

});
