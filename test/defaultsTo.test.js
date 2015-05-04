var assert = require('assert');
var M = require('..');

describe('inputs should respect defaultsTo', function() {

  var valueOfFooInFn;
  var valueOfBarInFn;

  var machine = {
    inputs: {
      foo: {
        example: 'foo bar',
        defaultsTo: 'foo@bar.com'
      },
      bar: {
        example: 2,
        required: true,
        defaultsTo: 23823
      }
    },

    exits: {
      success: {},
      error: {}
    },

    fn: function (inputs, exits, deps) {
      valueOfFooInFn=inputs.foo;
      valueOfBarInFn=inputs.bar;
      exits();
    }
  };

  it('should ignore `defaultsTo` for required inputs', function(done) {
    M.build(machine)
    .configure({})
    .exec(function(err, result) {
      assert(err, 'Expecting `err` because required input is missing.');
      done();
    });
  });

  it('should apply `defaultsTo` for optional inputs, if they have one', function(done) {
    M.build(machine)
    .configure({
      bar: 3
    })
    .exec(function(err, result) {
      if(err) return done(err);
      assert.equal(valueOfFooInFn, 'foo@bar.com');
      done();
    });
  });

});
