var assert = require('assert');
var M = require('../../lib/Machine.constructor');

describe('Machine inputs typeclass dictionary', function() {

  var machine = {
    inputs: {
      foo: {
        typeclass: 'dictionary'
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

  it('should run with a generic object', function(done) {
    M.build(machine)
    .configure({
      foo: { bar: 'baz'}
    })
    .exec(function(err, result) {
      if(err) return done(err);
      done();
    });
  });

  it('should not tamper with object which was passed in', function(done) {
    M.build(machine)
    .configure({
      foo: { bar: 'baz'}
    })
    .exec(function(err, result) {
      if(err) return done(err);
      assert.deepEqual(result, {
        foo: { bar: 'baz'}
      });
      done();
    });
  });

  it('should not tamper with object of arrays which was passed in', function(done) {
    M.build(machine)
    .configure({
      foo: [{foo: { bar: ['baz']}}]
    })
    .exec(function(err, result) {
      if(err) return done(err);
      assert.deepEqual(result, {
        foo: [{foo: { bar: ['baz']}}]
      });
      done();
    });
  });


  ////////////////////////////////
  // Invalid
  ////////////////////////////////

  it('should not run with an array of items', function(done) {
    M.build(machine)
    .configure({
      foo: [{ bar: 'baz' }, { foo: 'bar' }]
    })
    .exec(function(err, result) {
      assert(err, 'expected error because an array was passed in to a typeclass dictionary input');
      done();
    });
  });

});
