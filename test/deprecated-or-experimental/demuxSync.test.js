var assert = require('assert');
var Machine = require('../');


describe('Machine.prototype.demuxSync()', function (){

  describe('with no arguments', function (){
    it('should throw when called on a machine that does not declare sync:true', function (){
      try {
        Machine.build(machineFixtures[0]).demuxSync();
      }
      catch (e) {
        assert.equal(e.code,'E_USAGE');
        return;
      }

      // Should never make it here
      assert(false, 'Should have thrown an error');
    });


    it('should return `true` when called on a configured machine that triggers its success exit', function (){
      var result = Machine.build(machineFixtures[1]).demuxSync();
      assert.equal(result,true);
    });

    it('should return `false` when called on a configured machine that triggers any non-success exit and sends back an Error instance', function (){
      var m = Machine.build(machineFixtures[2]);
      m.configure({value: 'hi'});
      assert.equal(m.demuxSync(), false);
    });

    it('should return `false` when called on a configured machine that triggers any non-success exit and sends back a string', function (){
      var m = Machine.build(machineFixtures[2]);
      m.configure({value: 'hi'});
      assert.equal(m.demuxSync(), false);
    });

    it('should return `false` when called on a configured machine that triggers any non-success exit and sends back a boolean', function (){
      var m = Machine.build(machineFixtures[2]);
      m.configure({value: true});
      assert.equal(m.demuxSync(), false);
    });

    it('should return `false` when called on a configured machine that triggers any non-success exit and sends back a number', function (){
      var m = Machine.build(machineFixtures[2]);
      m.configure({value: -234.2});
      assert.equal(m.demuxSync(), false);
    });

    it('should return `false` when called on a configured machine that triggers any non-success exit and sends back an array', function (){
      var m = Machine.build(machineFixtures[2]);
      m.configure({value: ['stuff', 'and', 'things']});
      assert.equal(m.demuxSync(), false);
    });

    it('should return `false` when called on a configured machine that triggers any non-success exit and sends back an object', function (){
      var m = Machine.build(machineFixtures[2]);
      m.configure({value: {
        email: 'ricketorsomething@stark.io'
      }});
      assert.equal(m.demuxSync(), false);
    });
  });


  describe('with custom exit name specified', function (){
    it('should return `true` when called on a configured machine that triggers the specified exit', function (){
      var result = Machine.build(machineFixtures[2]).demuxSync('someOtherExit');
      assert.equal(result,true);
    });

    it('should return `false` when called on a configured machine that triggers any other exit', function (){
      var result = Machine.build(machineFixtures[1]).demuxSync('someOtherExit');
      assert.equal(result,false);
    });

    it('should throw if the exit name passed to `.demuxSync()` does not match a known exit', function (){
      assert.throws(function (){
        Machine.build(machineFixtures[1]).demuxSync('someFakeExitThatDoesntActuallyExist');
      });
    });
  });


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
    fn: function (inputs, exits) {
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
      someOtherExit: {},
      error: {
        example: 'world'
      }
    },
    fn: function (inputs, exits) {
      exits.success('stuff');
    }
  },
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
