/**
 * Module dependencies
 */
var Machine = require('../');




describe('timeout', function (){

  describe('machine that never triggers its exits', function (){
    describe('with timeout configured for 0.25 seconds', function (){
      var machineInstance;
      before(function (){
        machineInstance = Machine.build({
          timeout: 250,
          fn: function machineThatNeverTriggersItsExits(inputs, exits, env){
            // beep
          }
        });
      });

      it('should call its error exit with a timeout error', function (done){
        machineInstance().exec({
          error: function (err) {
            if (err.code === 'E_MACHINE_TIMEOUT') {
              return done();
            }
            return done(new Error('Expecting Error instance w/ `code` === "E_MACHINE_TIMEOUT", but instead got this error (code:'+err.code+'): '+err.stack));
          },
          success: function (){
            return done(new Error('wtf'));
          }
        });
      });
    });
  });


  describe('machine that triggers its exits after 0.5 seconds', function (){
    describe('with timeout configured for 0.25 seconds', function (){
      var machineInstance;
      before(function (){
        machineInstance = Machine.build({
          timeout: 250,
          fn: function machineThatNeverTriggersItsExits(inputs, exits, env){
            setTimeout(function (){
              return exits.success();
            }, 500);
          }
        });
      });

      it('should call its error exit with a timeout error', function (done){
        machineInstance().exec({
          error: function (err) {
            if (err.code === 'E_MACHINE_TIMEOUT') {
              return done();
            }
            return done(new Error('Expecting Error instance w/ `code` === "E_MACHINE_TIMEOUT", but instead got this error (code:'+err.code+'): '+err.stack));
          },
          success: function (){
            return done(new Error('Should not have called the success exit (should have been prevented by timeout alarm)'));
          }
        });
      });
    });
  });

});
