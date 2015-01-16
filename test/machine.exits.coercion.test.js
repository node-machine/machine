var assert = require('assert');
var Machine = require('../lib/Machine.constructor');

describe('Machine exit coercion', function() {

  it('should return the valid data from the exit', function(done) {

    Machine.build({
      inputs: {
        foo: {
          example: 'foo bar'
        }
      },
      exits: {
        success: {
          example: 'hello'
        },
        error: {
          example: 'world'
        }
      },
      fn: function (inputs, exits, deps) {
        exits(null, 'foo');
      }
    })
    .configure({
      foo: 'hello'
    })
    .exec(function(err, result) {
      if(err) return done(err);
      assert(result === 'foo');
      done();
    });
  });

  it('should coerce invalid exit data into the correct types', function(done) {

    Machine.build({
      inputs: {
        foo: {
          example: 'foo bar'
        }
      },
      exits: {
        success: {
          example: 4
        },
        error: {
          example: 'world'
        }
      },
      fn: function (inputs, exits, deps) {
        exits(null, '100');
      }
    })
    .configure({
      foo: 'hello'
    })
    .exec(function(err, result) {
      if(err) return done(err);
      assert.strictEqual(result,100);
      done();
    });
  });

  it('should provide base types for values not present in the exit data', function(done) {

    Machine.build({
      inputs: {
        foo: {
          example: 'foo bar'
        }
      },
      exits: {
        success: {
          example: 4
        },
        error: {
          example: 'world'
        }
      },
      fn: function (inputs, exits, deps) {
        exits(null);
      }
    })
    .configure({
      foo: 'hello'
    })
    .exec(function(err, result) {
      if(err) return done(err);
      assert.strictEqual(result,0);
      done();
    });
  });


});
