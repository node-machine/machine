/**
 * Module dependencies
 */
var Machine = require('../');




xdescribe('maxRecursion', function (){


  describe('by default', function (){

    var machineInstance;
    before(function (){
      machineInstance = Machine.build(function horribleEndlesslyRecursingMachine(inputs, exits, env){
        var recursiveMachine = env.thisMachine();
        // console.log('Calling self.  Max recursion:', recursiveMachine.maxRecursion);
        // console.log('Current recursion depth:', recursiveMachine._recursiveDepth);
        recursiveMachine.exec({
          error: function (err){
            return exits.error(err);
          },
          success: function (){
            return exits.success();
          }
        });
      });
    });

    it('should prevent "maximum call stack exceeded" errors by default', function (done){

      machineInstance().exec({
        error: function (err) {
          if (err.code === 'E_MAX_RECURSION') {
            return done();
          }
          return done(new Error('Expecting Error instance w/ `code` === "E_MAX_RECURSION", but instead got this error (code:'+err.code+'): '+err.stack));
        },
        success: function (){
          return done(new Error('wtf'));
        }
      });

    });

  });

});
