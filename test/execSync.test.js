var assert = require('assert');
var Machine = require('../');


describe('Machine.prototype.execSync()', function (){

  it('should throw when called on a machine that does not declare sync:true', function (){
    try {
      Machine.build(machineFixtures[0]).execSync();
    }
    catch (e) {
      assert.equal(e.code,'E_USAGE');
      return;
    }

    // Should never make it here
    assert(false, 'Should have thrown an error');
  });


  it('should return the expected value when called on a configured machine that triggers its success exit', function (){
    var result = Machine.build(machineFixtures[1]).execSync();
    assert.equal(result,'stuff');
  });

  it('should throw an Error when called on a configured machine that triggers any non-success exit and sends back an Error instance', function (){
    var m = Machine.build(machineFixtures[2]);
    m.configure({value: 'hi'});
    assert.throws(function (){
      m.execSync();
    });
  });

  it('should throw an Error when called on a configured machine that triggers any non-success exit and sends back a string', function (){
    var m = Machine.build(machineFixtures[2]);
    m.configure({value: 'hi'});
    assert.throws(function (){
      m.execSync();
    });
  });

  it('should throw an Error when called on a configured machine that triggers any non-success exit and sends back a boolean', function (){
    var m = Machine.build(machineFixtures[2]);
    m.configure({value: true});
    assert.throws(function (){
      m.execSync();
    });
  });

  it('should throw an Error when called on a configured machine that triggers any non-success exit and sends back a number', function (){
    var m = Machine.build(machineFixtures[2]);
    m.configure({value: -234.2});
    assert.throws(function (){
      m.execSync();
    });
  });

  it('should throw an Error when called on a configured machine that triggers any non-success exit and sends back an array', function (){
    var m = Machine.build(machineFixtures[2]);
    m.configure({value: ['stuff', 'and', 'things']});
    assert.throws(function (){
      m.execSync();
    });
  });

  it('should throw an Error when called on a configured machine that triggers any non-success exit and sends back an object', function (){
    var m = Machine.build(machineFixtures[2]);
    m.configure({value: {
      email: 'ricketorsomething@stark.io'
    }});
    assert.throws(function (){
      m.execSync();
    });
  });

});



var machineFixtures = [

  // (0)
  // Standard asynchronous machine
  {
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
    fn: function (inputs, exits) {
      exits.success('stuff');
    }
  },
  // (1)
  // Same machine as above, but with sync:true
  {
    sync: true,
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
    fn: function (inputs, exits) {
      exits.success('stuff');
    }
  },
  // (2)
  // Sync machine which calls a non-success exit with whatever
  // was passed into the `value` input.
  {
    sync: true,
    inputs: {
      value: {
        typeclass: '*'
      }
    },
    exits: {
      success: {
        example: 'hello'
      },
      someOtherExit: {
        getExample: function (inputs){
          return inputs.value;
        }
      },
      error: {
        example: 'world'
      }
    },
    fn: function (inputs, exits) {
      exits.someOtherExit(inputs.value);
    }
  },
  // (3)
  // Sync machine which calls a non-success exit with a new Error.
  {
    sync: true,
    inputs: {
      value: {
        typeclass: '*'
      }
    },
    exits: {
      success: {
        example: 'hello'
      },
      someOtherExit: {
        getExample: function (inputs){
          return inputs.value;
        }
      },
      error: {
        example: 'world'
      }
    },
    fn: function (inputs, exits) {
      exits.someOtherExit(new Error('deliberate error'));
    }
  }
];
