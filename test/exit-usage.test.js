var assert = require('assert');
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


});










/**
 * This helper tests different usages of the specified machine def.
 * NOTE: The provided machine def SHOULD NOT specify a `fn` or `inputs`!
 *
 * Machine def should call its error exit when the `foo` input is set to
 * the string: "error"
 *
 * @param  {[type]} machine - the machine def
 */
function testDifferentUsages (machine) {

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
    } else {
      exits();
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
    done();
  });

  it('should throw an error when when `fn` calls `exits("ERROR!")` and no callbacks are bound', function(done) {
    assert.throws(function (){
      M.build(machine)
      .configure({
        foo: 'error'
      })
      .exec();
    });
    done();
  });



  ////////////////////////////////////////////////////////////////////
  // Binding exit callbacks with second argument to .configure()
  ////////////////////////////////////////////////////////////////////
  it('should call the success exit when `fn` calls `exits()` and callbacks are bound using second argument to `configure()`', function(done) {
    M.build(machine)
    .configure({
      foo: 'hello'
    }, {
      success: function() {done();},
      error: function(err) {done(new Error('Should NOT have called the error exit!'));}
    })
    .exec();
  });

  it('should call the error exit when `fn` calls `exits("ERROR!")` and callbacks are bound using second argument to `configure()`', function(done) {
    M.build(machine)
    .configure({
      foo: 'error'
    }, {
      "success": function() {done(new Error('Should NOT have called the success exit!'));},
      "error": function(err) {assert(err, 'expected `'+err+'` to be truthy');done();}
    })
    .exec();
  });

  it('should call the error exit when `fn` calls `exits()` and ONLY an `error` callback is bound using second argument to `configure()`', function(done) {
    M.build(machine)
    .configure({
      foo: 'hello'
    }, {
      error: function(err) {done();}
    })
    .exec();
  });

  it('should call the error exit when `fn` calls `exits("ERROR!")` and ONLY an `error` callback is bound using second argument to `configure()`', function(done) {
    M.build(machine)
    .configure({
      foo: 'error'
    }, {
      error: function(err) {done();}
    })
    .exec();
  });

  it('should throw an error when no `error` callback is bound using second argument to `configure()`', function(done) {
    assert.throws(function (){
      M.build(machine)
      .configure({
        foo: 'hello'
      }, {
        "success": function() {
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
    }, function (err){
      if (err) {
        return done(new Error('`err` should NOT have been set!'));
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
      success: function() {done();},
      error: function(err) {done(new Error('Should NOT have called the error exit!'));}
    });
  });

  it('should call the error exit when `fn` calls `exits("ERROR!")` and callbacks are bound using .exec()', function(done) {
    M.build(machine)
    .configure({
      foo: 'error'
    }).exec({
      "success": function() {done(new Error('Should NOT have called the success exit!'));},
      "error": function(err) {assert(err, 'expected `'+err+'` to be truthy');done();}
    });
  });

  it('should call the error exit when `fn` calls `exits()` and ONLY an `error` callback is bound using .exec()', function(done) {
    M.build(machine)
    .configure({
      foo: 'hello'
    }).exec({
      error: function(err) {done();}
    });
  });

  it('should call the error exit when `fn` calls `exits("ERROR!")` and ONLY an `error` callback is bound using .exec()', function(done) {
    M.build(machine)
    .configure({
      foo: 'error'
    }).exec({
      error: function(err) {done();}
    });
  });

  it('should throw an error when no `error` callback is bound using .exec()', function(done) {
    assert.throws(function (){
      M.build(machine)
      .configure({
        foo: 'hello'
      }).exec({
        "success": function() {
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
    .exec(function (err){
      if (err) {
        return done(new Error('`err` should NOT have been set!'));
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
  // Binding exit callbacks with .setExits()
  ////////////////////////////////////////////////////////////////////
  it('should call the success exit when `fn` calls `exits()` and callbacks are bound using .setExits()', function(done) {
    M.build(machine)
    .configure({
      foo: 'hello'
    }).setExits({
      success: function() {done();},
      error: function(err) {done(new Error('Should NOT have called the error exit!'));}
    })
    .exec();
  });

  it('should call the error exit when `fn` calls `exits("ERROR!")` and callbacks are bound using .setExits()', function(done) {
    M.build(machine)
    .configure({
      foo: 'error'
    }).setExits({
      "success": function() {done(new Error('Should NOT have called the success exit!'));},
      "error": function(err) {assert(err, 'expected `'+err+'` to be truthy');done();}
    })
    .exec();
  });

  it('should call the error exit when `fn` calls `exits()` and ONLY an `error` callback is bound using .setExits()', function(done) {
    M.build(machine)
    .configure({
      foo: 'hello'
    }).setExits({
      error: function(err) {done();}
    })
    .exec();
  });

  it('should call the error exit when `fn` calls `exits("ERROR!")` and ONLY an `error` callback is bound using .setExits()', function(done) {
    M.build(machine)
    .configure({
      foo: 'error'
    }).setExits({
      error: function(err) {done();}
    })
    .exec();
  });

  it('should throw an error when no `error` callback is bound using .setExits()', function(done) {
    assert.throws(function (){
      M.build(machine)
      .configure({
        foo: 'hello'
      }).setExits({
        success: function() {
          return done(new Error('Should have thrown, and not called any exit!'));
        }
      })
      .exec();
    });
    done();
  });

  ////////////////////////////////////////////////////////////////////
  // Binding Node callback with .setExits()
  ////////////////////////////////////////////////////////////////////
  it('should call the success exit when `fn` calls `exits()` and a single Node callback is bound using .setExits()', function(done) {
    M.build(machine)
    .configure({
      foo: 'hello'
    })
    .setExits(function (err){
      if (err) {
        return done(new Error('`err` should NOT have been set!'));
      }
      return done();
    })
    .exec();
  });

  it('should call the error exit when `fn` calls `exits("ERROR!")` and a single Node callback is bound using .setExits()', function(done) {
    M.build(machine)
    .configure({
      foo: 'error'
    }).setExits(function (err){
      if (err) {
        return done();
      }
      return done(new Error('`err` should have been set!'));
    })
    .exec();
  });
}
