var assert = require('assert');
var Machine = require('../lib/Machine.constructor');

describe('Machine exit coercion', function() {

  it('should pass through expected data', function(done) {

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


  it('should coerce string to number', function(done) {

    Machine.build({
      inputs: {},
      exits: {
        success: {
          example: 4
        }
      },
      fn: function (inputs, exits, deps) {
        exits.success('whatever');
      }
    }).exec(function(err, result) {
      if(err) return done(err);
      assert.strictEqual(result,0);
      done();
    });
  });


  it('should coerce boolean to number', function(done) {

    Machine.build({
      inputs: {},
      exits: {
        success: {
          example: 4
        }
      },
      fn: function (inputs, exits, deps) {
        exits.success(true);
      }
    }).exec(function(err, result) {
      if(err) return done(err);
      assert.strictEqual(result,1);
      done();
    });
  });


  it('should coerce undefined to example ({})', function(done) {

    Machine.build({
      inputs: {},
      exits: {
        success: {
          example: {}
        }
      },
      fn: function (inputs, exits, deps) {
        exits.success();
      }
    }).exec(function(err, result) {
      if(err) return done(err);
      assert.deepEqual(result,{});
      done();
    });
  });

  it('should coerce undefined to example ([])', function(done) {

    Machine.build({
      inputs: {},
      exits: {
        success: {
          example: []
        }
      },
      fn: function (inputs, exits, deps) {
        exits.success();
      }
    }).exec(function(err, result) {
      if(err) return done(err);
      assert.deepEqual(result,[]);
      done();
    });
  });

  it('should coerce null to example ([])', function(done) {

    Machine.build({
      inputs: {},
      exits: {
        success: {
          example: []
        }
      },
      fn: function (inputs, exits, deps) {
        exits.success(null);
      }
    }).exec(function(err, result) {
      if(err) return done(err);
      assert.deepEqual(result,[]);
      done();
    });
  });

  it('should coerce 0 to example ([])', function(done) {

    Machine.build({
      inputs: {},
      exits: {
        success: {
          example: []
        }
      },
      fn: function (inputs, exits, deps) {
        exits.success(0);
      }
    }).exec(function(err, result) {
      if(err) return done(err);
      assert.deepEqual(result,[]);
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
