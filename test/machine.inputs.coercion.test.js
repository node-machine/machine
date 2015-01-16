var assert = require('assert');
var M = require('../lib/Machine.constructor');

describe('Machine input coercion', function() {

  it('should coerce input data into proper types', function(done) {
    var _inputs;

    var machine = {
      inputs: {
        foo: {
          example: 100
        },
        bar: {
          example: 'foobar'
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
        _inputs = inputs;
        exits(null, 'foo');
      }
    };

    try {
      M.build(machine)
      .configure({
        foo: '20',
        bar: 20
      })
      .exec(function(err, result) {
        if(err) return done(err);
        assert.strictEqual(_inputs.foo,20);
        assert.strictEqual(_inputs.bar,'20');
        done();
      });
    }
    catch (e){
      assert(false, 'Should not throw');
    }
  });

  it('should error if an example or typeclass is not given for an input', function() {
    var machine = {
      inputs: {
        foo: {}
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
    };

    assert.throws(function() {
      M.build(machine);
    }, Error);
  });


  it('should fail if input expects string, but object is provided', function(done) {

    var _inputsInFn;
    var outputValue;
    var inputDef = { example: 'asdf' };
    var machine = M.build({
      inputs: {
        x: inputDef
      },
      fn: function (inputs, exits) {
        _inputsInFn = inputs;
        exits(null, outputValue);
      }
    });

    machine({ x: {} }).exec(function (err){
      if (!err) {
        return done(new Error('Expected `error` outcome'));
      }
      return done();
    });

  });

});
