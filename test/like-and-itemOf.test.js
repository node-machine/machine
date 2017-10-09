/**
 * Module dependencies
 */

var assert = require('assert');
var _ = require('@sailshq/lodash');
var Machine = require('../');
var testMachineWithMocha = require('test-machinepack-mocha').testMachineWithMocha;



describe('`like` and `itemOf`', function (){

  describe('using `like` in one of its exits', function (){
    testMachineWithMocha().machine(Machine.build({
      identity: 'test',
      inputs: { fullName: { example: 'Roger Rabbit' } },
      exits: { success: { like: 'fullName' } },
      fn: function (inputs, exits) { return exits.success(123); }
    }))
    .use({})
    .expect({
      outcome: 'success',
      output: '123'
    });

    describe('and referenced input is configured with an invalid (and incompatible) input value', function (){
      testMachineWithMocha().machine(Machine.build({
        identity: 'test',
        inputs: { fullName: { example: 'Roger Rabbit' } },
        exits: { success: { like: 'fullName' } },
        fn: function (inputs, exits) { return exits.success(123); }
      }))
      .use({ fullName: [] })
      .expect({
        outcome: 'error'
      });
    });

    it('should not .build() the machine if an input refers to another input w/ a `like` or `itemOf` instead of an example', function (){
      assert.throws(function (){
        Machine.build({
          identity: 'test',
          inputs: {
            fullName: { example: 'Roger Rabbit' },
            firstName: { like: 'fullName' },
          },
          exits: { success: { like: 'firstName' } },
          fn: function (inputs, exits) { return exits.error(); }
        });
      });

      assert.throws(function (){
        Machine.build({
          identity: 'test',
          inputs: {
            nameParts: { example: ['Roger'] },
            firstName: { itemOf: 'fullName' },
          },
          exits: { success: { like: 'firstName' } },
          fn: function (inputs, exits) { return exits.error(); }
        });
      });
    });
  });

  // No longer supported:
  // describe('using `like` in one of its inputs', function (){
  //   testMachineWithMocha().machine(Machine.build({
  //     identity: 'test',
  //     inputs: {
  //       fullName: { example: 'Roger Rabbit' },
  //       firstName: { like: 'fullName' }
  //     },
  //     exits: { success: { example: '===' } },
  //     fn: function (inputs, exits) { return exits.success(inputs.firstName); }
  //   }))
  //   .use({ firstName: 123 })
  //   .expect({
  //     outcome: 'success',
  //     output: '123'
  //   });

  //   describe('and referenced input is configured with an invalid (and incompatible) input value', function (){
  //     testMachineWithMocha().machine(Machine.build({
  //       identity: 'test',
  //       inputs: {
  //         fullName: { example: 'Roger Rabbit' },
  //         firstName: { like: 'fullName' }
  //       },
  //       exits: { success: { example: '===' } },
  //       fn: function (inputs, exits) { return exits.success(inputs.firstName); }
  //     }))
  //     .use({ firstName: 123, fullName: [] })
  //     .expect({
  //       outcome: 'error'
  //     });
  //   });


  //   it('should not .build() the machine if an input refers to itself', function (){
  //     assert.throws(function (){
  //       Machine.build({
  //         identity: 'test',
  //         inputs: {
  //           fullName: { example: 'Roger Rabbit' },
  //           firstName: { like: 'firstName' }
  //         },
  //         exits: { success: { example: '===' } },
  //         fn: function (inputs, exits) { return exits.error(); }
  //       });
  //     });
  //   });

  //   it('should not .build() the machine if an input refers to another input w/ a `like` or `itemOf` instead of an example', function (){
  //     assert.throws(function (){
  //       Machine.build({
  //         identity: 'test',
  //         inputs: {
  //           fullName: { example: 'Roger Rabbit' },
  //           lastName: { like: 'firstName' },
  //           firstName: { like: 'fullName' }
  //         },
  //         exits: { success: { example: '===' } },
  //         fn: function (inputs, exits) { return exits.error(); }
  //       });
  //     });

  //     assert.throws(function (){
  //       Machine.build({
  //         identity: 'test',
  //         inputs: {
  //           namePieces: { example: ['Roger'] },
  //           lastName: { itemOf: 'namePieces' },
  //           firstName: { like: 'lastName' }
  //         },
  //         exits: { success: { example: '===' } },
  //         fn: function (inputs, exits) { return exits.error(); }
  //       });
  //     });
  //   });

  // });

  describe('using `itemOf` in one of its exits', function (){
    testMachineWithMocha().machine(Machine.build({
      identity: 'test',
      inputs: {
        fullName: { example: ['Roger'] }
      },
      exits: { success: { itemOf: 'fullName' } },
      fn: function (inputs, exits) { return exits.success(123); }
    }))
    .use({})
    .expect({
      outcome: 'success',
      output: '123'
    });
  });

  describe('using `itemOf` in one of its inputs', function (){
    it('should no longer work!', function(){
      try {
        testMachineWithMocha().machine(Machine.build({
          identity: 'test',
          inputs: {
            fullName: { example: ['Roger'] },
            firstName: { itemOf: 'fullName' }
          },
          exits: { success: { example: '===' } },
          fn: function (inputs, exits) { return exits.success(inputs.firstName); }
        }))
        .use({ firstName: 123 })
        .expect({
          outcome: 'success',
          output: '123'
        });
      } catch (err) {
        if (err.name === 'ImplementationError') {
          // ok that's what we expected.
        }
        else  { throw err; }
      }
      throw new Error('should not have made it here');
    });
  });

  describe('using `like` in one of its contract\'s exits', function (){
    testMachineWithMocha().machine(Machine.build({
      identity: 'test',
      inputs: {
        fullName: { example: 'Roger' },
        getFullName: {
          example: '->',
          contract: {
            sync: true,
            exits: { success: { like: 'fullName' } }
          }
        }
      },
      exits: { success: { outputExample: '===' } },
      fn: function (inputs, exits) { return exits.success( inputs.getFullName().execSync() ); }
    }))
    .use({
      getFullName: function (unused, exits){
        exits.success(123);
      }
    })
    .expect({
      outcome: 'success',
      output: '123'
    });
  });

  describe('using `like` in one of its contract\'s inputs', function (){
    testMachineWithMocha().machine(Machine.build({
      identity: 'test',
      inputs: {
        fullName: { example: 'Roger' },
        getFullName: {
          example: '->',
          contract: {
            sync: true,
            inputs: { name: { like: 'fullName' } },
            exits: { success: { example: '===' } }
          }
        }
      },
      exits: { success: { example: '===' } },
      fn: function (inputs, exits) { return exits.success( inputs.getFullName({ name: 123 }).execSync() ); }
    }))
    .use({
      getFullName: function (inputs, exits){
        return exits.success(inputs.name);
      }
    })
    .expect({
      outcome: 'success',
      output: '123'
    });
  });

  describe('using `itemOf` in one of its contract\'s exits', function (){
    testMachineWithMocha().machine(Machine.build({
      identity: 'test',
      inputs: {
        fullName: { example: ['Roger'] },
        getFullName: {
          example: '->',
          contract: {
            sync: true,
            exits: { success: { itemOf: 'fullName' } }
          }
        }
      },
      exits: { success: { example: '===' } },
      fn: function (inputs, exits) { return exits.success( inputs.getFullName().execSync() ); }
    }))
    .use({
      getFullName: function (unused, exits){
        exits.success(123);
      }
    })
    .expect({
      outcome: 'success',
      output: '123'
    });
  });

  describe('using `itemOf` in one of its contract\'s inputs', function (){
    testMachineWithMocha().machine(Machine.build({
      identity: 'test',
      inputs: {
        fullName: { example: ['Roger'] },
        getFullName: {
          example: '->',
          contract: {
            sync: true,
            inputs: { name: { itemOf: 'fullName' } },
            exits: { success: { example: '===' } }
          }
        }
      },
      exits: { success: { example: '===' } },
      fn: function (inputs, exits) { return exits.success( inputs.getFullName({ name: 123 }).execSync() ); }
    }))
    .use({
      getFullName: function (inputs, exits){
        return exits.success(inputs.name);
      }
    })
    .expect({
      outcome: 'success',
      output: '123'
    });
  });

  describe('using `like` in one of its contract\'s inputs\' contract\'s exits', function (){
    testMachineWithMocha().machine(Machine.build({
      identity: 'test',
      inputs: {
        fullName: { example: 'Roger' },
        getFullName: {
          example: '->',
          contract: {
            sync: true,
            inputs: {
              toCompleteName: {
                example: '->',
                contract: {
                  sync: true,
                  exits: { success: { like: 'fullName' } }
                }
              }
            },
            exits: { success: { example: '===' } }
          }
        }
      },
      exits: { success: { example: '===' } },
      fn: function (inputs, exits) {
        return exits.success( inputs.getFullName({
          toCompleteName: function (unused, exits){
            return exits.success(123);
          }
        }).execSync() );
      }
    }))
    .use({
      getFullName: function (inputs, exits){
        return exits.success( inputs.toCompleteName().execSync() );
      }
    })
    .expect({
      outcome: 'success',
      output: '123'
    });
  });

  describe('using `like` in one of its contract\'s inputs\' contract\'s inputs', function (){
    testMachineWithMocha().machine(Machine.build({
      identity: 'test',
      inputs: {
        fullName: { example: 'Roger' },
        getFullName: {
          example: '->',
          contract: {
            sync: true,
            inputs: {
              toCompleteName: {
                example: '->',
                contract: {
                  sync: true,
                  inputs: { name: { like: 'fullName' } },
                  exits: { success: { example: '===' } }
                }
              }
            },
            exits: { success: { example: '===' } }
          }
        }
      },
      exits: { success: { example: '===' } },
      fn: function (inputs, exits) {
        return exits.success( inputs.getFullName({
          toCompleteName: function (inputs, exits){
            return exits.success(inputs.name);
          }
        }).execSync() );
      }
    }))
    .use({
      getFullName: function (inputs, exits){
        return exits.success( inputs.toCompleteName({name:123}).execSync() );
      }
    })
    .expect({
      outcome: 'success',
      output: '123'
    });
  });

  describe('using `itemOf` in one of its contract\'s inputs\' contract\'s exits', function (){
    testMachineWithMocha().machine(Machine.build({
      identity: 'test',
      inputs: {
        fullName: { example: ['Roger'] },
        getFullName: {
          example: '->',
          contract: {
            sync: true,
            inputs: {
              toCompleteName: {
                example: '->',
                contract: {
                  sync: true,
                  exits: { success: { itemOf: 'fullName' } }
                }
              }
            },
            exits: { success: { example: '===' } }
          }
        }
      },
      exits: { success: { example: '===' } },
      fn: function (inputs, exits) {
        return exits.success( inputs.getFullName({
          toCompleteName: function (unused, exits){
            return exits.success(123);
          }
        }).execSync() );
      }
    }))
    .use({
      getFullName: function (inputs, exits){
        return exits.success( inputs.toCompleteName().execSync() );
      }
    })
    .expect({
      outcome: 'success',
      output: '123'
    });
  });

  describe('using `itemOf` in one of its contract\'s inputs\' contract\'s inputs', function (){
    testMachineWithMocha().machine(Machine.build({
      identity: 'test',
      inputs: {
        fullName: { example: ['Roger'] },
        getFullName: {
          example: '->',
          contract: {
            sync: true,
            inputs: {
              toCompleteName: {
                example: '->',
                contract: {
                  sync: true,
                  inputs: { name: { itemOf: 'fullName' } },
                  exits: { success: { example: '===' } }
                }
              }
            },
            exits: { success: { example: '===' } }
          }
        }
      },
      exits: { success: { example: '===' } },
      fn: function (inputs, exits) {
        return exits.success( inputs.getFullName({
          toCompleteName: function (inputs, exits){
            return exits.success(inputs.name);
          }
        }).execSync() );
      }
    }))
    .use({
      getFullName: function (inputs, exits){
        return exits.success( inputs.toCompleteName({ name: 123 }).execSync() );
      }
    })
    .expect({
      outcome: 'success',
      output: '123'
    });
  });


});
