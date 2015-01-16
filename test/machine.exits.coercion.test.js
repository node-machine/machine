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


  it('should coerce 0 to example ({})', function(done) {

    Machine.build({
      inputs: {},
      exits: {
        success: {
          example: {}
        }
      },
      fn: function (inputs, exits, deps) {
        exits.success(0);
      }
    }).exec(function(err, result) {
      if(err) return done(err);
      assert.deepEqual(result,{});
      done();
    });
  });

  it('should coerce 0 to example ({foo: ""})', function(done) {

    Machine.build({
      inputs: {},
      exits: {
        success: {
          example: {foo: 'bar'}
        }
      },
      fn: function (inputs, exits, deps) {
        exits.success(0);
      }
    }).exec(function(err, result) {
      if(err) return done(err);
      assert.deepEqual(result,{foo:''});
      done();
    });
  });

  it('should coerce 0 to example ({foo: [""], bar: {}})', function(done) {

    Machine.build({
      inputs: {},
      exits: {
        success: {
          example: {foo: ['stuff'], bar: {}}
        }
      },
      fn: function (inputs, exits, deps) {
        exits.success(0);
      }
    }).exec(function(err, result) {
      if(err) return done(err);
      assert.deepEqual(result,{foo:[''], bar: {}});
      done();
    });
  });

  it('should coerce 0 to example ({foo: [""], bar: {baz: 0}})', function(done) {

    Machine.build({
      inputs: {},
      exits: {
        success: {
          example: {foo: ['stuff'], bar: {baz: 12412}}
        }
      },
      fn: function (inputs, exits, deps) {
        exits.success(0);
      }
    }).exec(function(err, result) {
      if(err) return done(err);
      assert.deepEqual(result,{foo:[''], bar: {baz: 0}});
      done();
    });
  });

  it('should coerce 0 to example ({foo: [""], someArray: []})', function(done) {

    Machine.build({
      inputs: {},
      exits: {
        success: {
          example: {foo: ['stuff'], someArray: []}
        }
      },
      fn: function (inputs, exits, deps) {
        exits.success(0);
      }
    }).exec(function(err, result) {
      if(err) return done(err);
      assert.deepEqual(result,{foo:[''], someArray: []});
      done();
    });
  });

  it('should coerce 0 to example ({foo: [""], someArray: []}) with someArray in example => ["*"]', function(done) {

    Machine.build({
      inputs: {},
      exits: {
        success: {
          example: {foo: ['stuff'], someArray: ['*']}
        }
      },
      fn: function (inputs, exits, deps) {
        exits.success(0);
      }
    }).exec(function(err, result) {
      if(err) return done(err);
      assert.deepEqual(result,{foo:[''], someArray: []});
      done();
    });
  });

  it('should coerce `{foo: ["hi"], someArray: [1234]}` to `{foo: ["hi"], someArray: [1234]}` with someArray in example => ["*"]', function(done) {

    Machine.build({
      inputs: {},
      exits: {
        success: {
          example: {foo: ['stuff'], someArray: ['*']}
        }
      },
      fn: function (inputs, exits, deps) {
        exits.success({foo: ['hi'], someArray: [1234]});
      }
    }).exec(function(err, result) {
      if(err) return done(err);
      assert.deepEqual(result,{foo:['hi'], someArray: [1234]});
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

  it('should coerce 0 to example ([0])', function(done) {

    Machine.build({
      inputs: {},
      exits: {
        success: {
          example: [123]
        }
      },
      fn: function (inputs, exits, deps) {
        exits.success(0);
      }
    }).exec(function(err, result) {
      if(err) return done(err);
      assert.deepEqual(result,[0]);
      done();
    });
  });

  it('should coerce 0 to example ([""])', function(done) {

    Machine.build({
      inputs: {},
      exits: {
        success: {
          example: ['stuff']
        }
      },
      fn: function (inputs, exits, deps) {
        exits.success(0);
      }
    }).exec(function(err, result) {
      if(err) return done(err);
      assert.deepEqual(result,['']);
      done();
    });
  });

  it('should coerce 0 to example ([false])', function(done) {

    Machine.build({
      inputs: {},
      exits: {
        success: {
          example: [true]
        }
      },
      fn: function (inputs, exits, deps) {
        exits.success(0);
      }
    }).exec(function(err, result) {
      if(err) return done(err);
      assert.deepEqual(result,[false]);
      done();
    });
  });





});
