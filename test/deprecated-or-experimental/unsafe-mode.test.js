var assert = require('assert');
var util = require('util');
var _ = require('@sailshq/lodash');
var M = require('../lib/Machine.constructor');


//              ██╗    ██╗ █████╗ ██████╗ ███╗   ██╗██╗███╗   ██╗ ██████╗
//  ▄ ██╗▄▄ ██╗▄██║    ██║██╔══██╗██╔══██╗████╗  ██║██║████╗  ██║██╔════╝ ▄ ██╗▄▄ ██╗▄
//   ████╗ ████╗██║ █╗ ██║███████║██████╔╝██╔██╗ ██║██║██╔██╗ ██║██║  ███╗ ████╗ ████╗
//  ▀╚██╔▀▀╚██╔▀██║███╗██║██╔══██║██╔══██╗██║╚██╗██║██║██║╚██╗██║██║   ██║▀╚██╔▀▀╚██╔▀
//    ╚═╝   ╚═╝ ╚███╔███╔╝██║  ██║██║  ██║██║ ╚████║██║██║ ╚████║╚██████╔╝  ╚═╝   ╚═╝
//               ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝╚═╝  ╚═══╝ ╚═════╝
//
//   █████╗ ██╗     ██╗         ██╗   ██╗███████╗███████╗██████╗ ██╗      █████╗ ███╗   ██╗██████╗
//  ██╔══██╗██║     ██║         ██║   ██║██╔════╝██╔════╝██╔══██╗██║     ██╔══██╗████╗  ██║██╔══██╗
//  ███████║██║     ██║         ██║   ██║███████╗█████╗  ██████╔╝██║     ███████║██╔██╗ ██║██║  ██║
//  ██╔══██║██║     ██║         ██║   ██║╚════██║██╔══╝  ██╔══██╗██║     ██╔══██║██║╚██╗██║██║  ██║
//  ██║  ██║███████╗███████╗    ╚██████╔╝███████║███████╗██║  ██║███████╗██║  ██║██║ ╚████║██████╔╝
//  ╚═╝  ╚═╝╚══════╝╚══════╝     ╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═════╝
//
//  ████████╗██╗   ██╗██████╗ ███████╗    ███████╗ █████╗ ███████╗███████╗████████╗██╗   ██╗
//  ╚══██╔══╝╚██╗ ██╔╝██╔══██╗██╔════╝    ██╔════╝██╔══██╗██╔════╝██╔════╝╚══██╔══╝╚██╗ ██╔╝
//     ██║    ╚████╔╝ ██████╔╝█████╗█████╗███████╗███████║█████╗  █████╗     ██║    ╚████╔╝
//     ██║     ╚██╔╝  ██╔═══╝ ██╔══╝╚════╝╚════██║██╔══██║██╔══╝  ██╔══╝     ██║     ╚██╔╝
//     ██║      ██║   ██║     ███████╗    ███████║██║  ██║██║     ███████╗   ██║      ██║
//     ╚═╝      ╚═╝   ╚═╝     ╚══════╝    ╚══════╝╚═╝  ╚═╝╚═╝     ╚══════╝   ╚═╝      ╚═╝
//
//   ██████╗ ██████╗ ███╗   ██╗████████╗██████╗  ██████╗ ██╗     ███████╗     █████╗ ██████╗ ███████╗
//  ██╔════╝██╔═══██╗████╗  ██║╚══██╔══╝██╔══██╗██╔═══██╗██║     ██╔════╝    ██╔══██╗██╔══██╗██╔════╝
//  ██║     ██║   ██║██╔██╗ ██║   ██║   ██████╔╝██║   ██║██║     ███████╗    ███████║██████╔╝█████╗
//  ██║     ██║   ██║██║╚██╗██║   ██║   ██╔══██╗██║   ██║██║     ╚════██║    ██╔══██║██╔══██╗██╔══╝
//  ╚██████╗╚██████╔╝██║ ╚████║   ██║   ██║  ██║╚██████╔╝███████╗███████║    ██║  ██║██║  ██║███████╗
//   ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚══════╝    ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝
//
//  ███████╗██╗  ██╗██████╗ ███████╗██████╗ ██╗███╗   ███╗███████╗███╗   ██╗████████╗ █████╗ ██╗     ██╗██╗
//  ██╔════╝╚██╗██╔╝██╔══██╗██╔════╝██╔══██╗██║████╗ ████║██╔════╝████╗  ██║╚══██╔══╝██╔══██╗██║     ██║██║
//  █████╗   ╚███╔╝ ██████╔╝█████╗  ██████╔╝██║██╔████╔██║█████╗  ██╔██╗ ██║   ██║   ███████║██║     ██║██║
//  ██╔══╝   ██╔██╗ ██╔═══╝ ██╔══╝  ██╔══██╗██║██║╚██╔╝██║██╔══╝  ██║╚██╗██║   ██║   ██╔══██║██║     ╚═╝╚═╝
//  ███████╗██╔╝ ██╗██║     ███████╗██║  ██║██║██║ ╚═╝ ██║███████╗██║ ╚████║   ██║   ██║  ██║███████╗██╗██╗
//  ╚══════╝╚═╝  ╚═╝╚═╝     ╚══════╝╚═╝  ╚═╝╚═╝╚═╝     ╚═╝╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝╚═╝
//
describe('Unsafe mode', function() {

  it('should not coerce input data into proper types', function(done) {
    var _inputs;

    var sampleMachineDef = {
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

      var live = M.build(sampleMachineDef)
      .configure({
        foo: '20',
        bar: 20
      });

      // Set experimental flags:
      live._unsafeMode = true;
      live._runTimeTypeCheck = false;
      live._inputCoercion = false;
      live._exitCoercion = false;

      live.exec(function(err, result) {
        if(err) { return done(err); }
        assert.strictEqual(_inputs.foo,'20');
        assert.strictEqual(_inputs.bar,20);
        done();
      });
    }
    catch (e){
      assert(false, 'Should not throw');
    }
  });


  it('should not fail if input expects string, but empty object ({}) is provided', function(done) {
    testInputConfiguration({
      example: 'asdf',
      actual: {}
    }, function (err, result){
      if (!err) {
        return done();
      }
      return done(new Error('Unexpected error: ', err));
    });
  });
  it('should fail if input expects string, but empty array ([]) is provided', function(done) {
    testInputConfiguration({
      example: 'asdf',
      actual: []
    }, function (err, result){
      if (!err) {
        return done();
      }
      return done(new Error('Unexpected error: ', err));
    });
  });

  it('should fail if input expects string, but `{foo:"bar"}` is provided', function(done) {
    testInputConfiguration({
      example: 'asdf',
      actual: {foo: 'bar'}
    }, function (err, result){
      if (!err) {
        return done();
      }
      return done(new Error('Unexpected error: ', err));
    });
  });

  it('should fail if input expects string, but `{foo:{bar: "baz"}}` is provided', function(done) {
    testInputConfiguration({
      example: 'asdf',
      actual: {foo:{bar: 'baz'}}
    }, function (err, result){
      if (!err) {
        return done();
      }
      return done(new Error('Unexpected error: ', err));
    });
  });

  it('should fail if input expects number, but `{foo:{bar: "baz"}}` is provided', function(done) {
    testInputConfiguration({
      example: 1234,
      actual: {foo:{bar: 'baz'}}
    }, function (err, result){
      if (!err) {
        return done();
      }
      return done(new Error('Unexpected error: ', err));
    });
  });


});












describe('_inputCoercion flag (+assorted sanity checks)', function() {

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










////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////// HELPERS ///////////////

function testInputConfiguration(options, cb){
  var _inputsInFn;
  var outputValue;
  var live = M.build({
    inputs: {
      x: (function _determineInputDefinition(){
        var def = {};
        if (!_.isUndefined(options.example)) {
          def.example = options.example;
        }
        return def;
      })()
    },
    exits: {
      error: {},
      success: {}
    },
    fn: function (inputs, exits) {
      _inputsInFn = inputs;
      exits(null, outputValue);
    }
  })
  .configure({
    x: options.actual
  });

  // Set experimental flags:
  live._unsafeMode = true;
  live._runTimeTypeCheck = false;
  live._inputCoercion = false;
  live._exitCoercion = false;

  live.exec(function (err, result){
    return cb(err, result);
  });
}
