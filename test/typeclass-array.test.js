var assert = require('assert');
var M = require('../lib/Machine.constructor');

describe('Machine inputs typeclass array', function() {

  var machine = {
    inputs: {
      foo: {
        typeclass: 'array'
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

  it('should run with an array of objects where each object is the same', function(done) {
    M.build(machine)
    .configure({
      foo: [{ bar: 'baz' }, { bar: 'foo' }]
    })
    .exec(function(err, result) {
      if(err) return done(err);
      done();
    });
  });

  it('should run with an empty array', function(done) {
    M.build(machine)
    .configure({
      foo: []
    })
    .exec(function(err, result) {
      if(err) return done(err);
      done();
    });
  });


  ////////////////////////////////
  // Invalid
  ////////////////////////////////

  // NOTE:
  // This functionality was temporarily disabled because it adds a lot of code, and can slow
  // things down for large arrays of big objects with large arrays of more big objects, etc.
  // In the future, perhaps this particular validation could be toggled on or off via configuration.
  //
  // ~Mike
  // Jan 16, 2015

  it.skip('should not run with an array of objects where each object is NOT the same', function(done) {
    M.build(machine)
    .configure({
      foo: [{ bar: 'baz' }, { foo: 'bar' }]
    })
    .exec(function(err, result) {
      assert(err, 'should not have allowed heterogeneous array in a typeclass:array input');
      done();
    });
  });

});
