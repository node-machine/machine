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


  it('should return the expected value when called on a configured machine that triggers its defaultExit', function (){
    var result = Machine.build(machineFixtures[1]).execSync();
    assert.equal(result,'stuff');
  });
  it('should throw an Error when called on a configured machine that triggers any non-default exit and sends back an Error instance');
  it('should throw an Error when called on a configured machine that triggers any non-default exit and sends back a string');
  it('should throw an Error when called on a configured machine that triggers any non-default exit and sends back a boolean');
  it('should throw an Error when called on a configured machine that triggers any non-default exit and sends back a number');
  it('should throw an Error when called on a configured machine that triggers any non-default exit and sends back an array');
  it('should throw an Error when called on a configured machine that triggers any non-default exit and sends back an object');

});



var machineFixtures = [

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
    fn: function (inputs, exits, deps) {
      exits.success('stuff');
    }
  },
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
    fn: function (inputs, exits, deps) {
      exits.success('stuff');
    }
  }
];
