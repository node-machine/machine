var assert = require('assert');
var M = require('../lib/Machine.constructor');

// TODO: deprecate `void`-- `example: undefined` works just as well.
describe('void exit', function() {

  it('should not return data from a voided exit', function(done) {
    var machine = {
      inputs: {
        foo: {
          example: 'foo bar'
        }
      },
      exits: {
        success: {
          void: true
        },
        error: {
          example: 'world'
        }
      },
      fn: function (inputs, exits, deps) {
        exits(null, 'foo');
      }
    };

    M.build(machine)
    .configure({
      foo: 'hello'
    })
    .exec(function(err, result) {
      if(err) return done(err);
      assert(!result);
      done();
    });
  });

});
