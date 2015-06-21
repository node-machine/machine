/**
 * Module dependencies
 */
var Machine = require('../');




describe('timeout', function (){

  describe('machine that never triggers its exits', function (){

    describe('with timeout configured for 1 second', function (){
      var machineInstance;
      before(function (){
        machineInstance = Machine.build({
          timeout: 1000,
          fn: function machineThatNeverTriggersItsExits(inputs, exits, env){
            // beep
          }
        });
      });

      it('should call its error exit with a timeout error', function (done){
        machineInstance().exec({
          error: function (err) {
            if (err.code === 'E_TIMEOUT') {
              return done();
            }
            return done(new Error('Expecting Error instance w/ `code` === "E_TIMEOUT", but instead got this error (code:'+err.code+'): '+err.stack));
          },
          success: function (){
            return done(new Error('wtf'));
          }
        });
      });

    });
  });

});
