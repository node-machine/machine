/**
 * Module dependencies
 */
var assert = require('assert');
var Machine = require('../');



//     ███████╗██╗  ██╗███████╗ ██████╗ ██╗██╗
//     ██╔════╝╚██╗██╔╝██╔════╝██╔════╝██╔╝╚██╗
//     █████╗   ╚███╔╝ █████╗  ██║     ██║  ██║
//     ██╔══╝   ██╔██╗ ██╔══╝  ██║     ██║  ██║
//  ██╗███████╗██╔╝ ██╗███████╗╚██████╗╚██╗██╔╝
//  ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝╚═╝
//
describe('Machine.prototype.exec()', function (){




  //  ██╗    ██╗██╗████████╗██╗  ██╗     █████╗ ██╗     ██╗
  //  ██║    ██║██║╚══██╔══╝██║  ██║    ██╔══██╗██║     ██║
  //  ██║ █╗ ██║██║   ██║   ███████║    ███████║██║     ██║
  //  ██║███╗██║██║   ██║   ██╔══██║    ██╔══██║██║     ██║
  //  ╚███╔███╔╝██║   ██║   ██║  ██║    ██║  ██║███████╗███████╗
  //   ╚══╝╚══╝ ╚═╝   ╚═╝   ╚═╝  ╚═╝    ╚═╝  ╚═╝╚══════╝╚══════╝
  //
  //  ██████╗ ███████╗ ██████╗ ██╗   ██╗██╗██████╗ ███████╗██████╗
  //  ██╔══██╗██╔════╝██╔═══██╗██║   ██║██║██╔══██╗██╔════╝██╔══██╗
  //  ██████╔╝█████╗  ██║   ██║██║   ██║██║██████╔╝█████╗  ██║  ██║
  //  ██╔══██╗██╔══╝  ██║▄▄ ██║██║   ██║██║██╔══██╗██╔══╝  ██║  ██║
  //  ██║  ██║███████╗╚██████╔╝╚██████╔╝██║██║  ██║███████╗██████╔╝
  //  ╚═╝  ╚═╝╚══════╝ ╚══▀▀═╝  ╚═════╝ ╚═╝╚═╝  ╚═╝╚══════╝╚═════╝
  //
  //   █████╗ ██████╗  ██████╗ ██╗███╗   ██╗███████╗
  //  ██╔══██╗██╔══██╗██╔════╝ ██║████╗  ██║██╔════╝
  //  ███████║██████╔╝██║  ███╗██║██╔██╗ ██║███████╗
  //  ██╔══██║██╔══██╗██║   ██║██║██║╚██╗██║╚════██║
  //  ██║  ██║██║  ██║╚██████╔╝██║██║ ╚████║███████║
  //  ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝╚═╝  ╚═══╝╚══════╝
  //
  //  ██████╗ ██████╗  ██████╗ ██╗   ██╗██╗██████╗ ███████╗██████╗
  //  ██╔══██╗██╔══██╗██╔═══██╗██║   ██║██║██╔══██╗██╔════╝██╔══██╗
  //  ██████╔╝██████╔╝██║   ██║██║   ██║██║██║  ██║█████╗  ██║  ██║
  //  ██╔═══╝ ██╔══██╗██║   ██║╚██╗ ██╔╝██║██║  ██║██╔══╝  ██║  ██║
  //  ██║     ██║  ██║╚██████╔╝ ╚████╔╝ ██║██████╔╝███████╗██████╔╝
  //  ╚═╝     ╚═╝  ╚═╝ ╚═════╝   ╚═══╝  ╚═╝╚═════╝ ╚══════╝╚═════╝
  //
  describe('when all required argins are provided', function () {

    var NM_DEF_FIXTURE = {
      inputs: {
        foo: { example: 'wat', required: true }
      },
      fn: function (inputs, exits){
        throw new Error('Surprise!  This one always fails.');
      }
    };

    describe('calling naked .exec()', function () {
      it('should not hang forever, go into an infinite loop, or crash the process -- instead, throw a predictable error', function (){
        var m = Machine.build(NM_DEF_FIXTURE);

        try {
          m({ foo: 'bar' }).exec();
        } catch (e) {
          // (Note: In past versions, this was indicated by a code of 'E_NO_ERROR_CALLBACK_CONFIGURED'.)
          if (e.name === 'UsageError') {
            return;
          }
          else { throw e; }
        }//</catch>
      });
    });//</describe :: calling naked .exec()>


    describe('calling .exec(cb)', function () {
      it('should trigger the callback with the appropriate error', function (done){
        var m = Machine.build(NM_DEF_FIXTURE);

        // Save a reference to the original machine instance for comparison below.
        var _origMachineInstance = m({ foo: 'bar' });

        try {
          _origMachineInstance.exec(function (err) {
            if (err) {
              // if (err.exit !== 'error') { return done(new Error('The error should have had a `exit` property set to `error`-- but instead, got `'+err.exit+'`.  Here\'s the whole stack:\n '+err.stack)); }
              // ^^ Not actually guaranteed-- and not officially part of the spec.  TODO: investigate this for next major version.
              if (!err.stack.match('Surprise!  This one always fails.')) { return done(new Error('Got the wrong error!  Here\'s the whole stack:\n '+err.stack)); }
              return done();
            }
            else { return done(new Error('There should have been an error provided to this callback!')); }
          });
        } catch (e) { return done(e); }

      });
    });//</describe :: calling .exec(cb)>


    describe('calling .exec(perExitCallbacks)', function () {
      describe('with an `error` callback provided', function () {
        it('should not hang forever, go into an infinite loop, or crash the process -- instead, throw a predictable UsageError', function (done){
          var m = Machine.build(NM_DEF_FIXTURE);

          // Save a reference to the original machine instance for comparison below.
          var _origMachineInstance = m({ foo: 'bar' });

          try {
            _origMachineInstance.exec({
              error: function (err) {
                return done(new Error('Should never have made it here'));
              },
              success: function (){
                return done(new Error('Should never have made it here'));
              }
            });
          } catch (e) {
            if (e.name === 'UsageError') { return done(); }
            return done(e);
          }
          return done(new Error('Should have thrown a UsageError'));
        });
      });//</describe :: with an `error` callback provided>

      describe('WITHOUT providing an `error` callback', function () {
        it('should not hang forever, go into an infinite loop, or crash the process -- instead, throw a predictable UsageError', function (done){
          var m = Machine.build(NM_DEF_FIXTURE);

          try {
            m({ foo: 'bar' }).exec({
              success: function (){
                return done(new Error('Should never have called this callback!'));
              }
            });
          } catch (e) {
            if (e.name === 'UsageError') { return done(); }
            return done(e);
          }
          return done(new Error('Should have thrown a UsageError'));
        });
      });//</describe :: WITHOUT providing an `error` callback>

    });//</describe :: calling .exec(perExitCallbacks)>

    describe('calling .switch(perExitCallbacks)', function () {
      describe('with an `error` callback provided', function () {
        it('should trigger the `error` callback', function (done){
          var m = Machine.build(NM_DEF_FIXTURE);

          // Save a reference to the original machine instance for comparison below.
          var _origMachineInstance = m({ foo: 'bar' });

          try {
            _origMachineInstance.switch({
              error: function (err) {
                if (err) {
                  // if (err.exit !== 'error') { return done(new Error('The error should have had a `exit` property set to `error`.  Here\'s the whole stack:\n '+err.stack)); }
                  // ^^ Not actually guaranteed-- and not officially part of the spec.  TODO: investigate this for next major version.
                  if (!err.stack.match('Surprise!  This one always fails.')) { return done(new Error('Got the wrong error!  Here\'s the whole stack:\n '+err.stack)); }
                  return done();
                }
                else { return done(new Error('There should have been an error provided to this callback!')); }
              },
              success: function (){
                return done(new Error('Should have called the `error` callback-- not this one!'));
              }
            });
          } catch (e) { return done(e); }

        });
      });//</describe :: with an `error` callback provided>

      describe('WITHOUT providing an `error` callback', function () {
        it('should not hang forever, go into an infinite loop, or crash the process -- instead, throw a predictable error', function (done){
          var m = Machine.build(NM_DEF_FIXTURE);

          try {
            m({ foo: 'bar' }).switch({
              success: function (){
                return done(new Error('Should never have called this callback!'));
              }
            });
          } catch (e) {
            // (Note: In past versions, this was indicated by a code of 'E_NO_ERROR_CALLBACK_CONFIGURED'.)
            if (e.name === 'UsageError') {
              return done();
            }
            else { return done(e); }
          }//</catch>

        });
      });//</describe :: WITHOUT providing an `error` callback>

    });//</describe :: calling .switch(perExitCallbacks)>


  });//</describe :: when all required argins are provided>







  //  ██╗    ██╗██╗████████╗██╗  ██╗
  //  ██║    ██║██║╚══██╔══╝██║  ██║
  //  ██║ █╗ ██║██║   ██║   ███████║
  //  ██║███╗██║██║   ██║   ██╔══██║
  //  ╚███╔███╔╝██║   ██║   ██║  ██║
  //   ╚══╝╚══╝ ╚═╝   ╚═╝   ╚═╝  ╚═╝
  //
  //  ██████╗ ███████╗ ██████╗ ██╗   ██╗██╗██████╗ ███████╗██████╗
  //  ██╔══██╗██╔════╝██╔═══██╗██║   ██║██║██╔══██╗██╔════╝██╔══██╗
  //  ██████╔╝█████╗  ██║   ██║██║   ██║██║██████╔╝█████╗  ██║  ██║
  //  ██╔══██╗██╔══╝  ██║▄▄ ██║██║   ██║██║██╔══██╗██╔══╝  ██║  ██║
  //  ██║  ██║███████╗╚██████╔╝╚██████╔╝██║██║  ██║███████╗██████╔╝
  //  ╚═╝  ╚═╝╚══════╝ ╚══▀▀═╝  ╚═════╝ ╚═╝╚═╝  ╚═╝╚══════╝╚═════╝
  //
  //   █████╗ ██████╗  ██████╗ ██╗███╗   ██╗███████╗
  //  ██╔══██╗██╔══██╗██╔════╝ ██║████╗  ██║██╔════╝
  //  ███████║██████╔╝██║  ███╗██║██╔██╗ ██║███████╗
  //  ██╔══██║██╔══██╗██║   ██║██║██║╚██╗██║╚════██║
  //  ██║  ██║██║  ██║╚██████╔╝██║██║ ╚████║███████║
  //  ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝╚═╝  ╚═══╝╚══════╝
  //
  //   ██████╗ ███╗   ███╗██╗████████╗████████╗███████╗██████╗
  //  ██╔═══██╗████╗ ████║██║╚══██╔══╝╚══██╔══╝██╔════╝██╔══██╗
  //  ██║   ██║██╔████╔██║██║   ██║      ██║   █████╗  ██║  ██║
  //  ██║   ██║██║╚██╔╝██║██║   ██║      ██║   ██╔══╝  ██║  ██║
  //  ╚██████╔╝██║ ╚═╝ ██║██║   ██║      ██║   ███████╗██████╔╝
  //   ╚═════╝ ╚═╝     ╚═╝╚═╝   ╚═╝      ╚═╝   ╚══════╝╚═════╝
  //
  describe('when argins are omitted for 1 or more required inputs', function () {

    var NM_DEF_FIXTURE = {
      inputs: {
        foo: { example: 'wat', required: true }
      },
      fn: function (inputs, exits){ return exits.success(); }
    };

    describe('calling naked .exec()', function () {
      it('should not hang forever, go into an infinite loop, or crash the process -- instead, throw a predictable error', function (){
        var m = Machine.build(NM_DEF_FIXTURE);

        try {
          m().exec();
        } catch (e) {
          // (Note: In past versions, this was indicated by a code of 'E_NO_ERROR_CALLBACK_CONFIGURED'.)
          if (e.name === 'UsageError') {
            return;
          }
          else { throw e; }
        }//</catch>
      });
    });//</describe :: calling naked .exec()>


    describe('calling .exec(cb)', function () {
      it('should trigger the callback with the appropriate error', function (done){
        var m = Machine.build(NM_DEF_FIXTURE);

        // Save a reference to the original machine instance for comparison below.
        var _origMachineInstance = m();

        try {
          _origMachineInstance.exec(function (err) {
            if (err) {
              if (err.code === 'E_INVALID_ARGINS') {
                if (err.machineInstance !== _origMachineInstance) { return done(new Error('The `E_INVALID_ARGINS` error should have had a `machineInstance` property which is the same reference as the original machine instance-- but instead, got: '+util.inspect(err.machineInstance, {depth: null}))); }
                else { return done(); }
              }
              else { return done(new Error('Error should have had `code: \'E_INVALID_ARGINS\', but instead, got: `'+err.code+'`.  Here is the stack:'+err.stack)); }
            }
            else { return done(new Error('There should have been a validation error provided to this callback!')); }
          });
        } catch (e) { return done(e); }

      });
    });//</describe :: calling .exec(cb)>


    describe('calling .exec(perExitCallbacks)', function () {
      describe('with an `error` callback provided', function () {
        it('should trigger the `error` callback', function (done){
          var m = Machine.build(NM_DEF_FIXTURE);

          // Save a reference to the original machine instance for comparison below.
          var _origMachineInstance = m();

          try {
            _origMachineInstance.exec({
              error: function (err) {
                if (err) {
                  if (err.code === 'E_INVALID_ARGINS') {
                    if (err.machineInstance !== _origMachineInstance) { return done(new Error('The `E_INVALID_ARGINS` error should have had a `machineInstance` property which is the same reference as the original machine instance-- but instead, got: '+util.inspect(err.machineInstance, {depth: null}))); }
                    else { return done(); }
                  }
                  else { return done(new Error('Error should have had `code: \'E_INVALID_ARGINS\', but instead, got: `'+err.code+'`.  Here is the stack:'+err.stack)); }
                }
                else { return done(new Error('There should have been a validation error provided to this callback!')); }
              },
              success: function (){
                return done(new Error('Should have called the `error` callback-- not this one!'));
              }
            });
          } catch (e) { return done(e); }

        });
      });//</describe :: with an `error` callback provided>

      describe('WITHOUT providing an `error` callback', function () {
        it('should not hang forever, go into an infinite loop, or crash the process -- instead, throw a predictable error', function (done){
          var m = Machine.build(NM_DEF_FIXTURE);

          try {
            m().exec({
              success: function (){
                return done(new Error('Should never have called this callback!'));
              }
            });
          } catch (e) {
            // (Note: In past versions, this was indicated by a code of 'E_NO_ERROR_CALLBACK_CONFIGURED'.)
            if (e.name === 'UsageError') {
              return done();
            }
            else { return done(e); }
          }//</catch>

        });
      });//</describe :: WITHOUT providing an `error` callback>

    });//</describe :: calling .exec(perExitCallbacks)>


  });//</describe :: when argins are omitted for 1 or more required inputs>

  //  ██╗    ██╗██╗████████╗██╗  ██╗    ███████╗███╗   ███╗██████╗ ████████╗██╗   ██╗
  //  ██║    ██║██║╚══██╔══╝██║  ██║    ██╔════╝████╗ ████║██╔══██╗╚══██╔══╝╚██╗ ██╔╝
  //  ██║ █╗ ██║██║   ██║   ███████║    █████╗  ██╔████╔██║██████╔╝   ██║    ╚████╔╝
  //  ██║███╗██║██║   ██║   ██╔══██║    ██╔══╝  ██║╚██╔╝██║██╔═══╝    ██║     ╚██╔╝
  //  ╚███╔███╔╝██║   ██║   ██║  ██║    ███████╗██║ ╚═╝ ██║██║        ██║      ██║
  //   ╚══╝╚══╝ ╚═╝   ╚═╝   ╚═╝  ╚═╝    ╚══════╝╚═╝     ╚═╝╚═╝        ╚═╝      ╚═╝
  //
  //  ███████╗████████╗██████╗ ██╗███╗   ██╗ ██████╗     ███████╗ ██████╗ ██████╗
  //  ██╔════╝╚══██╔══╝██╔══██╗██║████╗  ██║██╔════╝     ██╔════╝██╔═══██╗██╔══██╗
  //  ███████╗   ██║   ██████╔╝██║██╔██╗ ██║██║  ███╗    █████╗  ██║   ██║██████╔╝
  //  ╚════██║   ██║   ██╔══██╗██║██║╚██╗██║██║   ██║    ██╔══╝  ██║   ██║██╔══██╗
  //  ███████║   ██║   ██║  ██║██║██║ ╚████║╚██████╔╝    ██║     ╚██████╔╝██║  ██║
  //  ╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝ ╚═════╝     ╚═╝      ╚═════╝ ╚═╝  ╚═╝
  //
  //  ██████╗ ███████╗ ██████╗ ██╗   ██╗██╗██████╗ ███████╗██████╗
  //  ██╔══██╗██╔════╝██╔═══██╗██║   ██║██║██╔══██╗██╔════╝██╔══██╗
  //  ██████╔╝█████╗  ██║   ██║██║   ██║██║██████╔╝█████╗  ██║  ██║
  //  ██╔══██╗██╔══╝  ██║▄▄ ██║██║   ██║██║██╔══██╗██╔══╝  ██║  ██║
  //  ██║  ██║███████╗╚██████╔╝╚██████╔╝██║██║  ██║███████╗██████╔╝
  //  ╚═╝  ╚═╝╚══════╝ ╚══▀▀═╝  ╚═════╝ ╚═╝╚═╝  ╚═╝╚══════╝╚═════╝
  //
  //  ███████╗████████╗██████╗ ██╗███╗   ██╗ ██████╗     ██╗███╗   ██╗██████╗ ██╗   ██╗████████╗
  //  ██╔════╝╚══██╔══╝██╔══██╗██║████╗  ██║██╔════╝     ██║████╗  ██║██╔══██╗██║   ██║╚══██╔══╝
  //  ███████╗   ██║   ██████╔╝██║██╔██╗ ██║██║  ███╗    ██║██╔██╗ ██║██████╔╝██║   ██║   ██║
  //  ╚════██║   ██║   ██╔══██╗██║██║╚██╗██║██║   ██║    ██║██║╚██╗██║██╔═══╝ ██║   ██║   ██║
  //  ███████║   ██║   ██║  ██║██║██║ ╚████║╚██████╔╝    ██║██║ ╚████║██║     ╚██████╔╝   ██║
  //  ╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝ ╚═════╝     ╚═╝╚═╝  ╚═══╝╚═╝      ╚═════╝    ╚═╝
  //

  describe('when empty string is provided for a required string input', function () {

    var NM_DEF_FIXTURE = {
      inputs: {
        foo: { example: 'wat', required: true }
      },
      fn: function (inputs, exits){ return exits.success(); }
    };

    describe('calling naked .exec()', function () {
      it('should not hang forever, go into an infinite loop, or crash the process -- instead, throw a predictable error', function (){
        var m = Machine.build(NM_DEF_FIXTURE);

        try {
          m({foo: ''}).exec();
        } catch (e) {
          // (Note: In past versions, this was indicated by a code of 'E_NO_ERROR_CALLBACK_CONFIGURED'.)
          if (e.name === 'UsageError') {
            return;
          }
          else { throw e; }
        }//</catch>
      });
    });//</describe :: calling naked .exec()>


    describe('calling .exec(cb)', function () {
      it('should trigger the callback with the appropriate error', function (done){
        var m = Machine.build(NM_DEF_FIXTURE);

        // Save a reference to the original machine instance for comparison below.
        var _origMachineInstance = m({foo: ''});

        try {
          _origMachineInstance.exec(function (err) {
            if (err) {
              if (err.code === 'E_INVALID_ARGINS') {
                if (err.machineInstance !== _origMachineInstance) { return done(new Error('The `E_INVALID_ARGINS` error should have had a `machineInstance` property which is the same reference as the original machine instance-- but instead, got: '+util.inspect(err.machineInstance, {depth: null}))); }
                else { return done(); }
              }
              else { return done(new Error('Error should have had `code: \'E_INVALID_ARGINS\', but instead, got: `'+err.code+'`.  Here is the stack:'+err.stack)); }
            }
            else { return done(new Error('There should have been a validation error provided to this callback!')); }
          });
        } catch (e) { return done(e); }

      });
    });//</describe :: calling .exec(cb)>


    describe('calling .exec(perExitCallbacks)', function () {
      describe('with an `error` callback provided', function () {
        it('should trigger the `error` callback', function (done){
          var m = Machine.build(NM_DEF_FIXTURE);

          // Save a reference to the original machine instance for comparison below.
          var _origMachineInstance = m({foo: ''});

          try {
            _origMachineInstance.exec({
              error: function (err) {
                if (err) {
                  if (err.code === 'E_INVALID_ARGINS') {
                    if (err.machineInstance !== _origMachineInstance) { return done(new Error('The `E_INVALID_ARGINS` error should have had a `machineInstance` property which is the same reference as the original machine instance-- but instead, got: '+util.inspect(err.machineInstance, {depth: null}))); }
                    else { return done(); }
                  }
                  else { return done(new Error('Error should have had `code: \'E_INVALID_ARGINS\', but instead, got: `'+err.code+'`.  Here is the stack:'+err.stack)); }
                }
                else { return done(new Error('There should have been a validation error provided to this callback!')); }
              },
              success: function (){
                return done(new Error('Should have called the `error` callback-- not this one!'));
              }
            });
          } catch (e) { return done(e); }

        });
      });//</describe :: with an `error` callback provided>

      describe('WITHOUT providing an `error` callback', function () {
        it('should not hang forever, go into an infinite loop, or crash the process -- instead, throw a predictable error', function (done){
          var m = Machine.build(NM_DEF_FIXTURE);

          try {
            m({foo: ''}).exec({
              success: function (){
                return done(new Error('Should never have called this callback!'));
              }
            });
          } catch (e) {
            // (Note: In past versions, this was indicated by a code of 'E_NO_ERROR_CALLBACK_CONFIGURED'.)
            if (e.name === 'UsageError') {
              return done();
            }
            else { return done(e); }
          }//</catch>

        });
      });//</describe :: WITHOUT providing an `error` callback>

    });//</describe :: calling .exec(perExitCallbacks)>


  });//</describe :: when argins are omitted for 1 or more required inputs>

  //  ███╗   ██╗██╗   ██╗██╗     ██╗         ██╗   ██╗ █████╗ ██╗     ██╗   ██╗███████╗███████╗
  //  ████╗  ██║██║   ██║██║     ██║         ██║   ██║██╔══██╗██║     ██║   ██║██╔════╝██╔════╝
  //  ██╔██╗ ██║██║   ██║██║     ██║         ██║   ██║███████║██║     ██║   ██║█████╗  ███████╗
  //  ██║╚██╗██║██║   ██║██║     ██║         ╚██╗ ██╔╝██╔══██║██║     ██║   ██║██╔══╝  ╚════██║
  //  ██║ ╚████║╚██████╔╝███████╗███████╗     ╚████╔╝ ██║  ██║███████╗╚██████╔╝███████╗███████║
  //  ╚═╝  ╚═══╝ ╚═════╝ ╚══════╝╚══════╝      ╚═══╝  ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝╚══════╝
  //
  //  ██╗███╗   ██╗    ██╗███╗   ██╗██████╗ ██╗   ██╗████████╗███████╗
  //  ██║████╗  ██║    ██║████╗  ██║██╔══██╗██║   ██║╚══██╔══╝██╔════╝
  //  ██║██╔██╗ ██║    ██║██╔██╗ ██║██████╔╝██║   ██║   ██║   ███████╗
  //  ██║██║╚██╗██║    ██║██║╚██╗██║██╔═══╝ ██║   ██║   ██║   ╚════██║
  //  ██║██║ ╚████║    ██║██║ ╚████║██║     ╚██████╔╝   ██║   ███████║
  //  ╚═╝╚═╝  ╚═══╝    ╚═╝╚═╝  ╚═══╝╚═╝      ╚═════╝    ╚═╝   ╚══════╝
  //
  //  ██╗    ██╗██╗████████╗██╗  ██╗
  //  ██║    ██║██║╚══██╔══╝██║  ██║
  //  ██║ █╗ ██║██║   ██║   ███████║
  //  ██║███╗██║██║   ██║   ██╔══██║
  //  ╚███╔███╔╝██║   ██║   ██║  ██║
  //   ╚══╝╚══╝ ╚═╝   ╚═╝   ╚═╝  ╚═╝
  //
  //   █████╗ ██╗     ██╗      ██████╗ ██╗    ██╗███╗   ██╗██╗   ██╗██╗     ██╗
  //  ██╔══██╗██║     ██║     ██╔═══██╗██║    ██║████╗  ██║██║   ██║██║     ██║
  //  ███████║██║     ██║     ██║   ██║██║ █╗ ██║██╔██╗ ██║██║   ██║██║     ██║
  //  ██╔══██║██║     ██║     ██║   ██║██║███╗██║██║╚██╗██║██║   ██║██║     ██║
  //  ██║  ██║███████╗███████╗╚██████╔╝╚███╔███╔╝██║ ╚████║╚██████╔╝███████╗███████╗
  //  ╚═╝  ╚═╝╚══════╝╚══════╝ ╚═════╝  ╚══╝╚══╝ ╚═╝  ╚═══╝ ╚═════╝ ╚══════╝╚══════╝
  //

  describe('with null values in required inputs that have `allowNull: true`', function() {

    var NM_DEF_FIXTURE = {
      inputs: {
        str:  { example: 'wat', allowNull: true },
        num:  { example: 123, allowNull: true },
        bool: { example: true, allowNull: true }
      },
      fn: function (inputs, exits){ return exits.success(); }
    };

    describe('calling .exec(cb)', function () {
      it('should not trigger any errors', function (done){

        var m = Machine.build(NM_DEF_FIXTURE);
        m({str: null, num: null, bool: null}).exec(done);

      });
    });//</describe :: calling .exec(cb)>

  });

  //  ███╗   ██╗██╗   ██╗██╗     ██╗         ██╗   ██╗ █████╗ ██╗     ██╗   ██╗███████╗
  //  ████╗  ██║██║   ██║██║     ██║         ██║   ██║██╔══██╗██║     ██║   ██║██╔════╝
  //  ██╔██╗ ██║██║   ██║██║     ██║         ██║   ██║███████║██║     ██║   ██║█████╗
  //  ██║╚██╗██║██║   ██║██║     ██║         ╚██╗ ██╔╝██╔══██║██║     ██║   ██║██╔══╝
  //  ██║ ╚████║╚██████╔╝███████╗███████╗     ╚████╔╝ ██║  ██║███████╗╚██████╔╝███████╗
  //  ╚═╝  ╚═══╝ ╚═════╝ ╚══════╝╚══════╝      ╚═══╝  ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝
  //
  //  ██╗███╗   ██╗    ██████╗ ███████╗ ██████╗ ██╗   ██╗██╗██████╗ ███████╗██████╗
  //  ██║████╗  ██║    ██╔══██╗██╔════╝██╔═══██╗██║   ██║██║██╔══██╗██╔════╝██╔══██╗
  //  ██║██╔██╗ ██║    ██████╔╝█████╗  ██║   ██║██║   ██║██║██████╔╝█████╗  ██║  ██║
  //  ██║██║╚██╗██║    ██╔══██╗██╔══╝  ██║▄▄ ██║██║   ██║██║██╔══██╗██╔══╝  ██║  ██║
  //  ██║██║ ╚████║    ██║  ██║███████╗╚██████╔╝╚██████╔╝██║██║  ██║███████╗██████╔╝
  //  ╚═╝╚═╝  ╚═══╝    ╚═╝  ╚═╝╚══════╝ ╚══▀▀═╝  ╚═════╝ ╚═╝╚═╝  ╚═╝╚══════╝╚═════╝
  //
  //       ██╗███████╗ ██████╗ ███╗   ██╗    ██╗███╗   ██╗██████╗ ██╗   ██╗████████╗
  //       ██║██╔════╝██╔═══██╗████╗  ██║    ██║████╗  ██║██╔══██╗██║   ██║╚══██╔══╝
  //       ██║███████╗██║   ██║██╔██╗ ██║    ██║██╔██╗ ██║██████╔╝██║   ██║   ██║
  //  ██   ██║╚════██║██║   ██║██║╚██╗██║    ██║██║╚██╗██║██╔═══╝ ██║   ██║   ██║
  //  ╚█████╔╝███████║╚██████╔╝██║ ╚████║    ██║██║ ╚████║██║     ╚██████╔╝   ██║
  //   ╚════╝ ╚══════╝ ╚═════╝ ╚═╝  ╚═══╝    ╚═╝╚═╝  ╚═══╝╚═╝      ╚═════╝    ╚═╝
  //

  describe('with null value in required json input', function() {

    var NM_DEF_FIXTURE = {
      inputs: {
        foo: { example: '*', required: true }
      },
      fn: function (inputs, exits){ return exits.success(); }
    };

    describe('calling .exec(cb)', function () {
      it('should trigger the callback with the appropriate error', function (done){
        var m = Machine.build(NM_DEF_FIXTURE);

        // Save a reference to the original machine instance for comparison below.
        var _origMachineInstance = m({foo: null});

        try {
          _origMachineInstance.exec(function (err) {
            if (err) {
              if (err.code === 'E_INVALID_ARGINS') {
                if (err.machineInstance !== _origMachineInstance) { return done(new Error('The `E_INVALID_ARGINS` error should have had a `machineInstance` property which is the same reference as the original machine instance-- but instead, got: '+util.inspect(err.machineInstance, {depth: null}))); }
                else { return done(); }
              }
              else { return done(new Error('Error should have had `code: \'E_INVALID_ARGINS\', but instead, got: `'+err.code+'`.  Here is the stack:'+err.stack)); }
            }
            else { return done(new Error('There should have been a validation error provided to this callback!')); }
          });
        } catch (e) { return done(e); }

      });
    });//</describe :: calling .exec(cb)>
  });

  //  ███╗   ██╗██╗   ██╗██╗     ██╗         ██╗   ██╗ █████╗ ██╗     ██╗   ██╗███████╗
  //  ████╗  ██║██║   ██║██║     ██║         ██║   ██║██╔══██╗██║     ██║   ██║██╔════╝
  //  ██╔██╗ ██║██║   ██║██║     ██║         ██║   ██║███████║██║     ██║   ██║█████╗
  //  ██║╚██╗██║██║   ██║██║     ██║         ╚██╗ ██╔╝██╔══██║██║     ██║   ██║██╔══╝
  //  ██║ ╚████║╚██████╔╝███████╗███████╗     ╚████╔╝ ██║  ██║███████╗╚██████╔╝███████╗
  //  ╚═╝  ╚═══╝ ╚═════╝ ╚══════╝╚══════╝      ╚═══╝  ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝
  //
  //  ██╗███╗   ██╗    ██████╗ ███████╗ ██████╗ ██╗   ██╗██╗██████╗ ███████╗██████╗
  //  ██║████╗  ██║    ██╔══██╗██╔════╝██╔═══██╗██║   ██║██║██╔══██╗██╔════╝██╔══██╗
  //  ██║██╔██╗ ██║    ██████╔╝█████╗  ██║   ██║██║   ██║██║██████╔╝█████╗  ██║  ██║
  //  ██║██║╚██╗██║    ██╔══██╗██╔══╝  ██║▄▄ ██║██║   ██║██║██╔══██╗██╔══╝  ██║  ██║
  //  ██║██║ ╚████║    ██║  ██║███████╗╚██████╔╝╚██████╔╝██║██║  ██║███████╗██████╔╝
  //  ╚═╝╚═╝  ╚═══╝    ╚═╝  ╚═╝╚══════╝ ╚══▀▀═╝  ╚═════╝ ╚═╝╚═╝  ╚═╝╚══════╝╚═════╝
  //
  //  ██████╗ ███████╗███████╗    ██╗███╗   ██╗██████╗ ██╗   ██╗████████╗
  //  ██╔══██╗██╔════╝██╔════╝    ██║████╗  ██║██╔══██╗██║   ██║╚══██╔══╝
  //  ██████╔╝█████╗  █████╗      ██║██╔██╗ ██║██████╔╝██║   ██║   ██║
  //  ██╔══██╗██╔══╝  ██╔══╝      ██║██║╚██╗██║██╔═══╝ ██║   ██║   ██║
  //  ██║  ██║███████╗██║         ██║██║ ╚████║██║     ╚██████╔╝   ██║
  //  ╚═╝  ╚═╝╚══════╝╚═╝         ╚═╝╚═╝  ╚═══╝╚═╝      ╚═════╝    ╚═╝
  //

  describe('with null value in required ref input', function() {

    var NM_DEF_FIXTURE = {
      inputs: {
        foo: { example: '===', required: true }
      },
      fn: function (inputs, exits){ return exits.success(); }
    };

    describe('calling .exec(cb)', function () {
      it('should trigger the callback with the appropriate error', function (done){
        var m = Machine.build(NM_DEF_FIXTURE);

        // Save a reference to the original machine instance for comparison below.
        var _origMachineInstance = m({foo: null});

        try {
          _origMachineInstance.exec(function (err) {
            if (err) {
              if (err.code === 'E_INVALID_ARGINS') {
                if (err.machineInstance !== _origMachineInstance) { return done(new Error('The `E_INVALID_ARGINS` error should have had a `machineInstance` property which is the same reference as the original machine instance-- but instead, got: '+util.inspect(err.machineInstance, {depth: null}))); }
                else { return done(); }
              }
              else { return done(new Error('Error should have had `code: \'E_INVALID_ARGINS\', but instead, got: `'+err.code+'`.  Here is the stack:'+err.stack)); }
            }
            else { return done(new Error('There should have been a validation error provided to this callback!')); }
          });
        } catch (e) { return done(e); }

      });
    });//</describe :: calling .exec(cb)>
  });

});//</describe :: Machine.prototype.exec()>
