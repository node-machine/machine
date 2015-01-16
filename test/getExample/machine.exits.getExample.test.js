var assert = require('assert');
var M = require('../../lib/Machine.constructor');

describe('Machine exits getExample', function() {

  ////////////////////////////////
  // Valid
  ////////////////////////////////

  it('should run get example to build up an exits schema', function(done) {

    var machine = {
      inputs: {
        foo: {
          example: 'hello'
        }
      },

      exits: {
        success: {
          getExample: function(inputs, env) {
            return {
              code: 400,
              status: 'ok'
            };
          }
        },
        error: {}
      },

      fn: function (inputs, exits, deps) {
        exits.success({ code: 404, status: 'not found' });
      }
    };

    M.build(machine)
    .configure({
      foo: 'bar'
    })
    .exec(function(err, result) {
      if(err) return done(err);
      assert.strictEqual(result.code, 404);
      assert.strictEqual(result.status, 'not found')
      done();
    });
  });

  it('should coerce run-time exit values', function(done) {

    var machine = {
      inputs: {
        foo: {
          example: 'hello'
        }
      },

      exits: {
        success: {
          getExample: function(inputs, env) {
            return {
              code: 400,
              status: 'ok'
            }
          }
        },
        error: {}
      },

      fn: function (inputs, exits, deps) {
        exits.success({ code: '404', status: 'not found' });
      }
    };

    M.build(machine)
    .configure({
      foo: 'world'
    })
    .exec(function(err, result) {
      if(err) return done(err);
      assert.strictEqual(result.code, 404);
      assert.strictEqual(result.status, 'not found')
      done();
    });
  });


  ////////////////////////////////
  // Invalid
  ////////////////////////////////

  it('should return base types when the run-time inputs don\'t match the results of getExample', function(done) {

    var machine = {
      inputs: {
        foo: {
          example: 'hello'
        }
      },

      exits: {
        success: {
          getExample: function(inputs, env) {
            return {
              code: 400,
              status: 'ok'
            };
          }
        },
        error: {}
      },

      fn: function (inputs, exits, deps) {
        exits.success({ foo: 'bar', bar: 'baz' });
      }
    };

    M.build(machine)
    .configure({
      foo: 'hello'
    })
    .exec(function(err, result) {
      if(err) return done(err);
      assert.strictEqual(result.code, 0);
      assert.strictEqual(result.status, '');
      done();
    });
  });

});
