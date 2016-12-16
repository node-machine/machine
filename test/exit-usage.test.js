var assert = require('assert');
var _ = require('@sailshq/lodash');
var M = require('../lib/Machine.constructor');

describe('Machine fn calling `exits()` (w/ different usages)', function() {


  describe('with success exit and error exit defined', function() {

    testDifferentUsages({
      exits: {
        success: {},
        error: {}
      }
    });

  }); // </with success exit and error exit defined>




  describe('with error exit defined, but no success exit', function() {

    testDifferentUsages({
      exits: {
        error: {}
      }
    });

  }); // </with error exit defined, but no success exit>



  describe('with success exit defined, but no error exit', function() {

    testDifferentUsages({
      exits: {
        success: {}
      }
    });

  }); // </with success exit defined, but no error exit>



  describe('with some other exit defined, but no success or error exit', function() {

    testDifferentUsages({
      exits: {
        somethingElse: {}
      }
    });

  }); // </with somethingElse exit defined, but no error exit>


  describe('with neither error nor success exit defined', function() {

    testDifferentUsages({
      exits: {}
    });


  }); // </with neither error nor success exit defined>


  describe('with no exits object defined in the machine def at all', function() {

    testDifferentUsages({});

  }); // </with no exits object defined in the machine def at all>


  describe('with success exit defined such that it has both an `example` and an `outputExample`', function() {

    testDifferentUsages(
      {
        exits: {
          success: {
            outputExample: 'foo',
            example: false
          }
        }
      },
      // If the following runtime value is returned through the success exit FROM INSIDE the machine `fn`:
      undefined,
      // ...then the following runtime value should be received on the OUTSIDE:
      ''
    );

    testDifferentUsages(
      {
        exits: {
          success: {
            outputExample: 'foo',
            example: undefined
          }
        }
      },
      // If the following runtime value is returned through the success exit FROM INSIDE the machine `fn`:
      undefined,
      // ...then the following runtime value should be received on the OUTSIDE:
      ''
    );

  }); // </with success exit defined such that it has both an `example` and an `outputExample`>


  describe('with an exit defined with an `outputExample`', function() {


    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // The following constants are used below:
    // =======================================
    //
    // To test regular expressions:
    var SOME_REGEXP = /^Sandwich/gi;
    //
    // To test functions:
    var SOME_ARBITRARY_FUNCTION = function foo (a, b, c){ console.log('stuff'); };
    //
    // To test circular references:
    var ERSTWHILE_PARTICLE = { x: 32, y: 49, z: -101, rgba: {r:255,g:255,b:255,a:100} };
    var DIFFUSE_PARTICLE = { x: -500, y: 871.5, z: 4.4, rgba: {r:0,g:0,b:0,a:255} };
    // DIFFUSE_PARTICLE.entangling = [ {}, {}, ERSTWHILE_PARTICLE, {}, {} ];
    DIFFUSE_PARTICLE.entangling = [ ERSTWHILE_PARTICLE ];
    ERSTWHILE_PARTICLE.entangledBy = { particleRef: DIFFUSE_PARTICLE };
    var ITERATOR_SAFE_VERSION_OF_ERSTWHILE_PARTICLE = {
      x: 32,
      y: 49,
      z: -101,
      rgba: { r:255, g:255, b:255, a:100 },
      entangledBy: {
        particleRef: {
          x: -500,
          y: 871.5,
          z: 4.4,
          rgba: { r:0, g:0, b:0, a:255 },
          // entangling: [ {}, {}, '[Circular ~.0]', {}, {} ]
          entangling: [ '[Circular ~.0]' ]
        }//</.entangledBy.particleRef>
      }//</.entangledBy>
    };

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // Start with a few basic sanity checks to be sure that it builds properly:
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    testDifferentUsages({
      exits: {
        success: {
          outputExample: 'foo'
        }
      }
    });

    testDifferentUsages({
      exits: {
        success: { outputExample: 'foo' },
        somethingElse: { outputExample: true },
        somethingElse2: { outputExample: false },
        somethingElse3: { outputExample: -329.3 },
        somethingElse4: { outputExample: {} },
        somethingElse5: { outputExample: '*' },
        somethingElse6: { outputExample: '->' },
        somethingElse7: { outputExample: '===' },
        somethingElse8: { outputExample: [{opts: '*'}] },
        somethingElse9: { outputExample: [{fn: '->'}] },
        somethingElse10: { outputExample: [{meta: '==='}] },
        somethingElse11: { outputExample: [] },
        somethingElse12: { example: false },
        somethingElse13: { example: -329.3 },
        somethingElse14: { example: {} },
        somethingElse15: { example: '*' },
        somethingElse16: { example: '->' },
        somethingElse17: { example: '===' },
        somethingElse18: { example: [{opts: '*'}] },
        somethingElse19: { example: [{fn: '->'}] },
        somethingElse20: { example: [{meta: '==='}] },
        somethingElse21: { example: [] },
        error: {}
      }
    });

    testDifferentUsages({
      exits: {
        success: { outputExample: 'foo' },
        error: { outputExample: '===' }
      }
    });

    testDifferentUsages({
      exits: {
        success: { outputExample: 'foo' },
        error: { example: '===' }
      }
    });

    testDifferentUsages({
      exits: {
        success: { example: 'foo' },
        error: { outputExample: '===' }
      }
    });


    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // Then finish up with a few more tests to ensure the underlying runtime type
    // coercion is working properly and respecting the `outputExample` as the exemplar
    // that gets passed in to `rttc.coerce()`:
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    describe('when there is runtime output', function() {
      testDifferentUsages(
        { exits: { success: { outputExample: 'foo' } } },
        // If the following runtime value is returned through the success exit FROM INSIDE the machine `fn`:
        'Butter sandwich',
        // ...then the following runtime value should be received on the OUTSIDE:
        'Butter sandwich'
      );

      testDifferentUsages(
        { exits: { success: { outputExample: 123 } } },
        // If the following runtime value is returned through the success exit FROM INSIDE the machine `fn`:
        'Butter sandwich',
        // ...then the following runtime value should be received on the OUTSIDE:
        0
      );

      testDifferentUsages(
        { exits: { success: { outputExample: 123 } } },
        // If the following runtime value is returned through the success exit FROM INSIDE the machine `fn`:
        undefined,
        // ...then the following runtime value should be received on the OUTSIDE:
        0
      );

      testDifferentUsages(
        { exits: { success: { outputExample: 'foo' } } },
        // If the following runtime value is returned through the success exit FROM INSIDE the machine `fn`:
        undefined,
        // ...then the following runtime value should be received on the OUTSIDE:
        ''
      );

      testDifferentUsages(
        { exits: { success: { outputExample: '*' } } },
        // If the following runtime value is returned through the success exit FROM INSIDE the machine `fn`:
        undefined,
        // ...then the following runtime value should be received on the OUTSIDE:
        null
      );

      testDifferentUsages(
        { exits: { success: { outputExample: '===' } } },
        // If the following runtime value is returned through the success exit FROM INSIDE the machine `fn`:
        undefined,
        // ...then the following runtime value should be received on the OUTSIDE:
        null
      );

      testDifferentUsages(
        { exits: { success: { outputExample: '===' } } },
        // If the following runtime value is returned through the success exit FROM INSIDE the machine `fn`:
        SOME_REGEXP,
        // ...then the following runtime value should be received on the OUTSIDE:
        SOME_REGEXP,
        true
      );

      testDifferentUsages(
        { exits: { success: { outputExample: ['==='] } } },
        // If the following runtime value is returned through the success exit FROM INSIDE the machine `fn`:
        undefined,
        // ...then the following runtime value should be received on the OUTSIDE:
        []
      );

      testDifferentUsages(
        { exits: { success: { outputExample: ['*'] } } },
        // If the following runtime value is returned through the success exit FROM INSIDE the machine `fn`:
        [null],
        // ...then the following runtime value should be received on the OUTSIDE:
        [null]
      );

      testDifferentUsages(
        { exits: { success: { outputExample: [] } } },
        // If the following runtime value is returned through the success exit FROM INSIDE the machine `fn`:
        [null],
        // ...then the following runtime value should be received on the OUTSIDE:
        [null]
      );

      testDifferentUsages(
        { exits: { success: { outputExample: [] } } },
        // If the following runtime value is returned through the success exit FROM INSIDE the machine `fn`:
        undefined,
        // ...then the following runtime value should be received on the OUTSIDE:
        []
      );

      testDifferentUsages(
        { exits: { success: { outputExample: ['*'] } } },
        // If the following runtime value is returned through the success exit FROM INSIDE the machine `fn`:
        SOME_REGEXP,
        // ...then the following runtime value should be received on the OUTSIDE:
        []
      );

      testDifferentUsages(
        { exits: { success: { outputExample: ['*'] } } },
        // If the following runtime value is returned through the success exit FROM INSIDE the machine `fn`:
        [ SOME_REGEXP ],
        // ...then the following runtime value should be received on the OUTSIDE:
        [ '/^Sandwich/gi' ] // << testing JSON stringification
      );

      testDifferentUsages(
        { exits: { success: { outputExample: [] } } },
        // If the following runtime value is returned through the success exit FROM INSIDE the machine `fn`:
        [ SOME_REGEXP ],
        // ...then the following runtime value should be received on the OUTSIDE:
        [ '/^Sandwich/gi' ] // << testing JSON stringification
      );

      // testDifferentUsages(
      //   { exits: { success: { outputExample: [] } } },
      //   // If the following runtime value is returned through the success exit FROM INSIDE the machine `fn`:
      //   [ ERSTWHILE_PARTICLE ],
      //   // ...then the following runtime value should be received on the OUTSIDE:
      //   [ ITERATOR_SAFE_VERSION_OF_ERSTWHILE_PARTICLE ] // << testing JSON stringification
      // );

      // testDifferentUsages(
      //   { exits: { success: { outputExample: ['==='] } } },
      //   // If the following runtime value is returned through the success exit FROM INSIDE the machine `fn`:
      //   [ SOME_REGEXP ],
      //   // ...then the following runtime value should be received on the OUTSIDE:
      //   [ SOME_REGEXP ],
      //   true // .... welll, sort of-- need to do a strict equality check only on the array items...
      // );

      // testDifferentUsages(
      //   { exits: { success: { outputExample: ['==='] } } },
      //   // If the following runtime value is returned through the success exit FROM INSIDE the machine `fn`:
      //   [ ERSTWHILE_PARTICLE ],
      //   // ...then the following runtime value should be received on the OUTSIDE:
      //   [ ERSTWHILE_PARTICLE ],
      //   true // .... welll, sort of-- need to do a strict equality check only on the array items...
      // );

      testDifferentUsages(
        { exits: { success: { outputExample: '===' } } },
        // If the following runtime value is returned through the success exit FROM INSIDE the machine `fn`:
        SOME_ARBITRARY_FUNCTION,
        // ...then the following runtime value should be received on the OUTSIDE:
        SOME_ARBITRARY_FUNCTION,
        true
      );

      testDifferentUsages(
        { exits: { success: { outputExample: '===' } } },
        // If the following runtime value is returned through the success exit FROM INSIDE the machine `fn`:
        ERSTWHILE_PARTICLE,
        // ...then the following runtime value should be received on the OUTSIDE:
        ERSTWHILE_PARTICLE,
        true
      );

      // testDifferentUsages(
      //   { exits: { success: { outputExample: '*' } } },
      //   // If the following runtime value is returned through the success exit FROM INSIDE the machine `fn`:
      //   ERSTWHILE_PARTICLE,
      //   // ...then the following runtime value should be received on the OUTSIDE:
      //   ITERATOR_SAFE_VERSION_OF_ERSTWHILE_PARTICLE
      // );

      testDifferentUsages(
        { exits: { success: { outputExample: [{meta: '==='}] } } },
        // If the following runtime value is returned through the success exit FROM INSIDE the machine `fn`:
        SOME_ARBITRARY_FUNCTION,
        // ...then the following runtime value should be received on the OUTSIDE:
        []
      );

      testDifferentUsages(
        { exits: { success: { outputExample: [{meta: '==='}] } } },
        // If the following runtime value is returned through the success exit FROM INSIDE the machine `fn`:
        [{meta: SOME_ARBITRARY_FUNCTION, foo: 12412, bar: 35132}],
        // ...then the following runtime value should be received on the OUTSIDE:
        [{meta: SOME_ARBITRARY_FUNCTION}]
      );

      testDifferentUsages(
        {
          exits: {
            success: { outputExample: 'foo' },
            somethingElse: { outputExample: true },
            somethingElse2: { outputExample: false },
            somethingElse3: { outputExample: -329.3 },
            somethingElse4: { outputExample: {} },
            somethingElse5: { outputExample: '*' },
            somethingElse6: { outputExample: '->' },
            somethingElse7: { outputExample: '===' },
            somethingElse8: { outputExample: [{opts: '*'}] },
            somethingElse9: { outputExample: [{fn: '->'}] },
            somethingElse10: { outputExample: [{meta: '==='}] },
            somethingElse11: { outputExample: [] },
            somethingElse12: { example: false },
            somethingElse13: { example: -329.3 },
            somethingElse14: { example: {} },
            somethingElse15: { example: '*' },
            somethingElse16: { example: '->' },
            somethingElse17: { example: '===' },
            somethingElse18: { example: [{opts: '*'}] },
            somethingElse19: { example: [{fn: '->'}] },
            somethingElse20: { example: [{meta: '==='}] },
            somethingElse21: { example: [] },
            error: {}
          }
        },
        // If the following runtime value is returned through the success exit FROM INSIDE the machine `fn`:
        'Butter sandwich',
        // ...then the following runtime value should be received on the OUTSIDE:
        'Butter sandwich'
      );

      testDifferentUsages(
        {
          exits: {
            success: { outputExample: 'foo' },
            somethingElse: { outputExample: true },
            somethingElse2: { outputExample: false },
            somethingElse3: { outputExample: -329.3 },
            somethingElse4: { outputExample: {} },
            somethingElse5: { outputExample: '*' },
            somethingElse6: { outputExample: '->' },
            somethingElse7: { outputExample: '===' },
            somethingElse8: { outputExample: [{opts: '*'}] },
            somethingElse9: { outputExample: [{fn: '->'}] },
            somethingElse10: { outputExample: [{meta: '==='}] },
            somethingElse11: { outputExample: [] },
            somethingElse12: { example: false },
            somethingElse13: { example: -329.3 },
            somethingElse14: { example: {} },
            somethingElse15: { example: '*' },
            somethingElse16: { example: '->' },
            somethingElse17: { example: '===' },
            somethingElse18: { example: [{opts: '*'}] },
            somethingElse19: { example: [{fn: '->'}] },
            somethingElse20: { example: [{meta: '==='}] },
            somethingElse21: { example: [] },
            error: {}
          }
        },
        // If the following runtime value is returned through the success exit FROM INSIDE the machine `fn`:
        undefined,
        // ...then the following runtime value should be received on the OUTSIDE:
        ''
      );

      testDifferentUsages(
        {
          exits: {
            success: { outputExample: 123 },
            error: { outputExample: '===' }
          }
        },
        // If the following runtime value is returned through the success exit FROM INSIDE the machine `fn`:
        undefined,
        // ...then the following runtime value should be received on the OUTSIDE:
        0
      );

      testDifferentUsages(
        {
          exits: {
            success: { outputExample: 123 },
            error: { example: 'foo' }
          }
        },
        // If the following runtime value is returned through the success exit FROM INSIDE the machine `fn`:
        999,
        // ...then the following runtime value should be received on the OUTSIDE:
        999
      );

      testDifferentUsages(
        {
          exits: {
            success: { example: 123 },
            error: { outputExample: 'foo' }
          }
        },
        // If the following runtime value is returned through the success exit FROM INSIDE the machine `fn`:
        999,
        // ...then the following runtime value should be received on the OUTSIDE:
        999
      );
    }); // </when there is runtime output>
  }); // </with success exit defined, with an `outputExample`>


});























/**
 * This helper tests different usages of the specified machine def.
 * NOTE: The provided machine def SHOULD NOT specify a `fn` or `inputs`!
 *
 * Machine def should call its error exit when the `foo` input is set to
 * the string: "error"
 *
 * @param  {===} machine - the machine def
 * @param  {===?} runtimeValueToReturn - the runtime value that the machine's `fn` will return through the success exit.
 * @param  {===?} expectedOutputIfSuccessExitIsCalled - the expected output if the success exit is called.  Will be compared using Node's native `assert.deepEqual()`.
 * @param  {Boolean} useStrictEq - if set to true, then a strict equality check (`assert.strictEqual()`) will be used instead of `assert.deepEqual()`
 */
function testDifferentUsages (machine, runtimeValueToReturn, expectedOutputIfSuccessExitIsCalled, useStrictEq) {

  if (machine.fn || machine.inputs) {
    throw new Error('Test is invalid-- please do not provide a `fn` or `inputs` to this test helper.');
  }
  machine.inputs = {
    foo: {
      example: 'foo bar'
    }
  };
  machine.fn = function (inputs, exits, deps) {
    if (inputs.foo === 'error') {
      exits('ERROR!');
    }
    else {
      if (!_.isUndefined(runtimeValueToReturn)) {
        exits(undefined, runtimeValueToReturn);
      }
      else {
        exits();
      }
    }
  };


  ////////////////////////////////////////////////////////////////////
  // Trying to `.exec()` a machine with no callbacks
  ////////////////////////////////////////////////////////////////////
  it('should throw an error when when `fn` calls `exits()` and no callbacks are bound', function(done) {
    assert.throws(function (){
      M.build(machine)
      .configure({
        foo: 'hello'
      })
      .exec();
    });
    return done();
  });

  it('should throw an error when when `fn` calls `exits("ERROR!")` and no callbacks are bound', function(done) {
    assert.throws(function (){
      M.build(machine)
      .configure({
        foo: 'error'
      })
      .exec();
    });
    return done();
  });



  ////////////////////////////////////////////////////////////////////
  // Binding exit callbacks with second argument to .configure()
  ////////////////////////////////////////////////////////////////////
  it('should call the success exit when `fn` calls `exits()` and callbacks are bound using second argument to `configure()`', function(done) {
    M.build(machine)
    .configure({
      foo: 'hello'
    }, {
      success: function(resultMaybe) {
        // Verify the output, if expected output was provided to this test helper.
        if (!_.isUndefined(expectedOutputIfSuccessExitIsCalled)) {
          if (useStrictEq) {
            try { assert.strictEqual(resultMaybe, expectedOutputIfSuccessExitIsCalled); }
            catch (e) { return done(e); }
          }
          else {
            try { assert.deepEqual(resultMaybe, expectedOutputIfSuccessExitIsCalled); }
            catch (e) { return done(e); }
          }
        }
        return done();
      },
      error: function(err) {
        return done(new Error('Should NOT have called the error exit!'));
      }
    })
    .exec();
  });

  it('should call the error exit when `fn` calls `exits("ERROR!")` and callbacks are bound using second argument to `configure()`', function(done) {
    M.build(machine)
    .configure({
      foo: 'error'
    }, {
      success: function() {
        done(new Error('Should NOT have called the success exit!'));
      },
      error: function(err) {
        assert(err, 'expected `'+err+'` to be truthy');
        return done();
      }
    })
    .exec();
  });

  it('should call the error exit when `fn` calls `exits()` and ONLY an `error` callback is bound using second argument to `configure()`', function(done) {
    M.build(machine)
    .configure({
      foo: 'hello'
    }, {
      error: function(err) { return done(); }
    })
    .exec();
  });

  it('should call the error exit when `fn` calls `exits("ERROR!")` and ONLY an `error` callback is bound using second argument to `configure()`', function(done) {
    M.build(machine)
    .configure({
      foo: 'error'
    }, {
      error: function(err) { return done(); }
    })
    .exec();
  });

  it('should throw an error when no `error` callback is bound using second argument to `configure()`', function(done) {
    assert.throws(function (){
      M.build(machine)
      .configure({
        foo: 'hello'
      }, {
        success: function() {
          return done(new Error('Should have thrown, and not called any exit!'));
        }
      })
      .exec();
    });
    done();
  });


  ////////////////////////////////////////////////////////////////////
  // Binding Node callback with second argument to .configure()
  ////////////////////////////////////////////////////////////////////
  it('should call the success exit when `fn` calls `exits()` and a single Node callback is bound using second argument to `configure()`', function(done) {
    M.build(machine)
    .configure({
      foo: 'hello'
    }, function (err, resultMaybe){
      if (err) {
        return done(new Error('`err` should NOT have been set!'));
      }

      // Verify the output, if expected output was provided to this test helper.
      if (!_.isUndefined(expectedOutputIfSuccessExitIsCalled)) {
        // If the expected output cannot be stringified, then use a strict equality check.
        var useStrictEq;
        try { JSON.stringify(expectedOutputIfSuccessExitIsCalled); }
        catch (ignored) { useStrictEq = true; }
        if (useStrictEq) {
          try { assert.strictEqual(resultMaybe, expectedOutputIfSuccessExitIsCalled); }
          catch (e) { return done(e); }
        }
        else {
          try { assert.deepEqual(resultMaybe, expectedOutputIfSuccessExitIsCalled); }
          catch (e) { return done(e); }
        }
      }

      return done();
    })
    .exec();
  });

  it('should call the error exit when `fn` calls `exits("ERROR!")` and a single Node callback is bound using second argument to `configure()`', function(done) {
    M.build(machine)
    .configure({
      foo: 'error'
    },function (err){
      if (err) {
        return done();
      }
      return done(new Error('`err` should have been set!'));
    })
    .exec();
  });

  ////////////////////////////////////////////////////////////////////
  // Binding exit callbacks with .exec()
  ////////////////////////////////////////////////////////////////////
  it('should call the success exit when `fn` calls `exits()` and callbacks are bound using .exec()', function(done) {
    M.build(machine)
    .configure({
      foo: 'hello'
    }).exec({
      success: function(resultMaybe) {
        // Verify the output, if expected output was provided to this test helper.
        if (!_.isUndefined(expectedOutputIfSuccessExitIsCalled)) {
          if (useStrictEq) {
            try { assert.strictEqual(resultMaybe, expectedOutputIfSuccessExitIsCalled); }
            catch (e) { return done(e); }
          }
          else {
            try { assert.deepEqual(resultMaybe, expectedOutputIfSuccessExitIsCalled); }
            catch (e) { return done(e); }
          }
        }

        return done();
      },
      error: function(err) { return done(new Error('Should NOT have called the error exit!'));}
    });
  });

  it('should call the error exit when `fn` calls `exits("ERROR!")` and callbacks are bound using .exec()', function(done) {
    M.build(machine)
    .configure({
      foo: 'error'
    }).exec({
      success: function() { return done(new Error('Should NOT have called the success exit!'));},
      error: function(err) {
        assert(err, 'expected `'+err+'` to be truthy');
        return done();
      }
    });
  });

  it('should call the error exit when `fn` calls `exits()` and ONLY an `error` callback is bound using .exec()', function(done) {
    M.build(machine)
    .configure({
      foo: 'hello'
    }).exec({
      error: function(err) { return done(); }
    });
  });

  it('should call the error exit when `fn` calls `exits("ERROR!")` and ONLY an `error` callback is bound using .exec()', function(done) {
    M.build(machine)
    .configure({
      foo: 'error'
    }).exec({
      error: function(err) { return done(); }
    });
  });

  it('should throw an error when no `error` callback is bound using .exec()', function(done) {
    assert.throws(function (){
      M.build(machine)
      .configure({
        foo: 'hello'
      }).exec({
        success: function() {
          return done(new Error('Should have thrown, and not called any exit!'));
        }
      });
    });
    done();
  });

  ////////////////////////////////////////////////////////////////////
  // Binding Node callback with .exec()
  ////////////////////////////////////////////////////////////////////
  it('should call the success exit when `fn` calls `exits()` and a single Node callback is bound using .exec()', function(done) {
    M.build(machine)
    .configure({
      foo: 'hello'
    })
    .exec(function (err, resultMaybe){
      if (err) {
        return done(new Error('`err` should NOT have been set!'));
      }

      // Verify the output, if expected output was provided to this test helper.
      if (!_.isUndefined(expectedOutputIfSuccessExitIsCalled)) {
        // If the expected output cannot be stringified, then use a strict equality check.
        var useStrictEq;
        try { JSON.stringify(expectedOutputIfSuccessExitIsCalled); }
        catch (ignored) { useStrictEq = true; }
        if (useStrictEq) {
          try { assert.strictEqual(resultMaybe, expectedOutputIfSuccessExitIsCalled); }
          catch (e) { return done(e); }
        }
        else {
          try { assert.deepEqual(resultMaybe, expectedOutputIfSuccessExitIsCalled); }
          catch (e) { return done(e); }
        }
      }

      return done();
    });
  });

  it('should call the error exit when `fn` calls `exits("ERROR!")` and a single Node callback is bound using .exec()', function(done) {
    M.build(machine)
    .configure({
      foo: 'error'
    }).exec(function (err){
      if (err) {
        return done();
      }
      return done(new Error('`err` should have been set!'));
    });
  });

  ////////////////////////////////////////////////////////////////////
  // Binding exit callbacks with .configure()
  ////////////////////////////////////////////////////////////////////
  it('should call the success exit when `fn` calls `exits()` and callbacks are bound using .configure()', function(done) {
    M.build(machine)
    .configure({
      foo: 'hello'
    }, {
      success: function(resultMaybe) {
        // Verify the output, if expected output was provided to this test helper.
        if (!_.isUndefined(expectedOutputIfSuccessExitIsCalled)) {
          if (useStrictEq) {
            try { assert.strictEqual(resultMaybe, expectedOutputIfSuccessExitIsCalled); }
            catch (e) { return done(e); }
          }
          else {
            try { assert.deepEqual(resultMaybe, expectedOutputIfSuccessExitIsCalled); }
            catch (e) { return done(e); }
          }
        }

        return done();
      },
      error: function(err) { return done(new Error('Should NOT have called the error exit!')); }
    })
    .exec();
  });

  it('should call the error exit when `fn` calls `exits("ERROR!")` and callbacks are bound using .configure()', function(done) {
    M.build(machine)
    .configure({
      foo: 'error'
    }, {
      success: function() { return done(new Error('Should NOT have called the success exit!')); },
      error: function(err) {
        assert(err, 'expected `'+err+'` to be truthy');
        return done();
      }
    })
    .exec();
  });

  it('should call the error exit when `fn` calls `exits()` and ONLY an `error` callback is bound using .configure()', function(done) {
    M.build(machine)
    .configure({
      foo: 'hello'
    }, {
      error: function(err) { return done(); }
    })
    .exec();
  });

  it('should call the error exit when `fn` calls `exits("ERROR!")` and ONLY an `error` callback is bound using .configure()', function(done) {
    M.build(machine)
    .configure({
      foo: 'error'
    }, {
      error: function(err) { return done(); }
    })
    .exec();
  });

  it('should throw an error when no `error` callback is bound using .configure()', function(done) {
    assert.throws(function (){
      M.build(machine)
      .configure({
        foo: 'hello'
      }, {
        success: function() {
          return done(new Error('Should have thrown, and not called any exit!'));
        }
      })
      .exec();
    });

    return done();
  });

  ////////////////////////////////////////////////////////////////////
  // Binding Node callback with configure()
  ////////////////////////////////////////////////////////////////////
  it('should call the success exit when `fn` calls `exits()` and a single Node callback is bound using .configure()', function(done) {
    M.build(machine)
    .configure({
      foo: 'hello'
    }, function (err, resultMaybe){
      if (err) {
        return done(new Error('`err` should NOT have been set!'));
      }

      // Verify the output, if expected output was provided to this test helper.
      if (!_.isUndefined(expectedOutputIfSuccessExitIsCalled)) {
        // If the expected output cannot be stringified, then use a strict equality check.
        var useStrictEq;
        try { JSON.stringify(expectedOutputIfSuccessExitIsCalled); }
        catch (ignored) { useStrictEq = true; }
        if (useStrictEq) {
          try { assert.strictEqual(resultMaybe, expectedOutputIfSuccessExitIsCalled); }
          catch (e) { return done(e); }
        }
        else {
          try { assert.deepEqual(resultMaybe, expectedOutputIfSuccessExitIsCalled); }
          catch (e) { return done(e); }
        }
      }

      return done();
    })
    .exec();
  });

  it('should call the error exit when `fn` calls `exits("ERROR!")` and a single Node callback is bound using .configure()', function(done) {
    M.build(machine)
    .configure({
      foo: 'error'
    }, function (err){
      if (err) {
        return done();
      }
      return done(new Error('`err` should have been set!'));
    })
    .exec();
  });
}
