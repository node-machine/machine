var assert = require('assert');
var _ = require('@sailshq/lodash');
var M = require('../');

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
      if(err) { return done(err); }
      assert.strictEqual(result.code, 404);
      assert.strictEqual(result.status, 'not found');
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
            };
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
      if(err) { return done(err); }
      assert.strictEqual(result.code, 404);
      assert.strictEqual(result.status, 'not found');
      done();
    });
  });


  describe('if getExample() returns a multi-item array', function (){
    it('should use the first item of the array as the pattern', function(done) {

      M.build({
        inputs: { foo: { example: 'hello' } },
        exits: { success: {
          getExample: function(inputs, env) { return [true, 'asdf',1234]; }
        } },
        fn: function (inputs, exits, deps) {
          return exits.success(['some string', -43.5, true, 1, 0]);
        }
      })
      .configure({ foo: 'world' })
      .exec(function(err, result) {
        if(err) { return done(err); }
        assert.deepEqual(result, [false, false, true, true, false]);
        done();
      });
    });
  });

  describe('if getExample() returns a nested multi-item array', function (){
    it('should use the first item of the array as the pattern', function(done) {

      M.build({
        inputs: { foo: { example: 'hello' } },
        exits: { success: {
          getExample: function(inputs, env) { return {x: [true, 'asdf',1234]}; }
        } },
        fn: function (inputs, exits, deps) {
          return exits.success({x: ['some string', -43.5, true, 1, 0] });
        }
      })
      .configure({ foo: 'world' })
      .exec(function(err, result) {
        if(err) { return done(err); }
        assert.deepEqual(result, {x: [false, false, true, true, false]});
        done();
      });
    });
  });

  describe('if getExample() returns array w/ `null` item', function (){
    it('should strip the null item out of the example', function(done) {

      var nov5 = new Date('Thursday, November 5, 1605 GMT');

      M.build({
        inputs: { foo: { example: 'hello' } },
        exits: { success: {
          getExample: function(inputs, env) { return [null]; }
        } },
        fn: function (inputs, exits, deps) {
          return exits.success([nov5]);
        }
      })
      .configure({ foo: 'world' })
      .exec(function(err, result) {
        if(err) { return done(err); }
        assert(!_.isEqual(result[0], nov5), 'Should not treat example as [===] when getExample returns [null]! Expected Date reference to be coerced to a JSON string (since example should have been coerced to `[]`)');
        assert.strictEqual(result[0], '1605-11-05T00:00:00.000Z');
        done();
      });
    });
  });

  describe('if getExample() returns dictionary w/ `null` properties', function (){
    it('should strip them out of the example', function(done) {

      M.build({
        inputs: { foo: { example: 'hello' } },
        exits: { success: {
          getExample: function(inputs, env) { return {a: null, b: null, c: 'things', d: null}; }
        } },
        fn: function (inputs, exits, deps) {
          return exits.success({a:1,b:2,c:3,d:4});
        }
      })
      .configure({ foo: 'world' })
      .exec(function(err, result) {
        if(err) { return done(err); }
        assert.deepEqual(result, {c: '3'});
        done();
      });
    });
  });

  describe('if getExample() returns null', function (){
    it('should treat it as `undefined`/"===" and pass runtime output through by reference', function(done) {

      var someStream = new require('stream').Readable();

      M.build({
        inputs: { foo: { example: 'hello' } },
        exits: { success: {
          getExample: function(inputs, env) { return null; }
        } },
        fn: function (inputs, exits, deps) {
          return exits.success(someStream);
        }
      })
      .configure({
        foo: 'world'
      })
      .exec(function(err, result) {
        if(err) { return done(err); }
        assert.strictEqual(result, someStream);
        done();
      });
    });

  });

  describe('if getExample() returns undefined', function (){
    it('should treat it as "===" and pass runtime output through by reference', function(done) {

      var someStream = new require('stream').Readable();

      M.build({
        inputs: { foo: { example: 'hello' } },
        exits: { success: {
          getExample: function(inputs, env) { return null; }
        } },
        fn: function (inputs, exits, deps) {
          return exits.success(someStream);
        }
      })
      .configure({
        foo: 'world'
      })
      .exec(function(err, result) {
        if(err) { return done(err); }
        assert.strictEqual(result, someStream);
        done();
      });
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
      if(err) { return done(err); }
      assert.strictEqual(result.code, 0);
      assert.strictEqual(result.status, '');
      done();
    });
  });

});
