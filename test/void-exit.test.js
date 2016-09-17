var assert = require('assert');
var M = require('../lib/Machine.constructor');

// TODO: deprecate `void`-- `outputExample: undefined` works just as well.
// (technically you can't smash output passed through that way, but that's
//  probably fine, considering it has never come up so far after ~3 yrs of
//  production use!)
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
      if(err) { return done(err); }
      assert(!result);
      done();
    });
  });

});
