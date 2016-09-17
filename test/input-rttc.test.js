/**
 * Module dependencies
 */

var Stream = require('stream');
var _ = require('lodash');
var runSuite = require('../node_modules/rttc/spec/helpers/run-suite');
var TEST_SUITE = require('../node_modules/rttc/spec/validation.spec.js');
var expandSuite = require('../node_modules/rttc/spec/helpers/expand-suite');
var toRunTest = require('./helpers/test-input-validation.helper');

describe('exhaustive input validation tests', function (){

  // Take the array of tests and extend them with some derivative
  // tests automatically.
  TEST_SUITE = expandSuite(TEST_SUITE);

  // Lodash 3.0 deprecated prototypal cloning of things like Errors
  // (so we shim a quick version for our purposes)
  var customCloneDeep = function (val){
    return _.cloneDeep(val, function(_val) {
      // Don't worry about cloning most things that _.cloneDeep would
      // normally reject; instead just pass them straight through.
      if (_.isError(_val)) {
        return _val;
      }
      else if (_.isFunction(_val)) {
        return _val;
      }
      else if (_.isObject(_val) && _val instanceof Buffer) {
        return _val;
      }
      else if (_.isObject(_val) && _val instanceof Stream) {
        return _val;
      }
      // Otherwise allow vanilla _.cloneDeep() behavior:
      else { return undefined; }
    });
  };

  // Modify the test suite to also test `typeclass` alongside the comparable examples.
  var extraTypeclassTests = [];
  _.each(TEST_SUITE, function (test){
    // Inject extra test to try `example:{}` as `typeclass: 'dictionary'` (at the top-level)
    if (_.isEqual(test.example, {})) {
      extraTypeclassTests.push((function(newTest){
        _.extend(newTest, customCloneDeep(test));
        delete newTest.example;
        newTest.typeclass = 'dictionary';
        return newTest;
      })({}));
    }
    // Inject extra test to try `example:[]` as `typeclass: 'array'` (at the top-level)
    else if (_.isEqual(test.example, [])) {
      extraTypeclassTests.push((function(newTest){
        _.extend(newTest, customCloneDeep(test));
        delete newTest.example;
        newTest.typeclass = 'array';
        return newTest;
      })({}));
    }
    // Inject extra test to try `example: '==='` as `typeclass: '*'` (at the top-level)
    else if (_.isEqual(test.example, '===')) {
      extraTypeclassTests.push((function(newTest){
        _.extend(newTest, customCloneDeep(test));
        delete newTest.example;
        newTest.typeclass = '*';
        return newTest;
      })({}));
    }
  });
  TEST_SUITE = TEST_SUITE.concat(extraTypeclassTests);

  // Now run all of the tests
  runSuite(TEST_SUITE, toRunTest );
});





var assert = require('assert');
var util = require('util');
var M = require('../lib/Machine.constructor');

describe('Specific machine input coercion use cases', function() {

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


  it('should fail if input expects string, but empty object ({}) is provided', function(done) {
    testInputConfiguration({
      example: 'asdf',
      actual: {}
    }, function (err, result){
      if (!err) {
        return done(new Error('Expected `error` outcome- instead no error, and got result:'+util.inspect(result)));
      }
      return done();
    });
  });
  it('should fail if input expects string, but empty array ([]) is provided', function(done) {
    testInputConfiguration({
      example: 'asdf',
      actual: []
    }, function (err, result){
      if (!err) {
        return done(new Error('Expected `error` outcome- instead no error, and got result:'+util.inspect(result)));
      }
      return done();
    });
  });

  it('should fail if input expects string, but `{foo:"bar"}` is provided', function(done) {
    testInputConfiguration({
      example: 'asdf',
      actual: {foo: 'bar'}
    }, function (err, result){
      if (!err) {
        return done(new Error('Expected `error` outcome- instead no error, and got result:'+util.inspect(result)));
      }
      return done();
    });
  });

  it('should fail if input expects string, but `{foo:{bar: "baz"}}` is provided', function(done) {
    testInputConfiguration({
      example: 'asdf',
      actual: {foo:{bar: "baz"}}
    }, function (err, result){
      if (!err) {
        return done(new Error('Expected `error` outcome- instead no error, and got result:'+util.inspect(result)));
      }
      return done();
    });
  });

  it('should fail if input expects number, but `{foo:{bar: "baz"}}` is provided', function(done) {
    testInputConfiguration({
      example: 1234,
      actual: {foo:{bar: "baz"}}
    }, function (err, result){
      if (!err) {
        return done(new Error('Expected `error` outcome- instead no error, and got result:'+util.inspect(result)));
      }
      return done();
    });
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
  var machine = M.build({
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
  })
  .exec(function (err, result){
    return cb(err, result);
  });
}
