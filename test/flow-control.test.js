/**
 * Module dependencies
 */
var util = require('util');
var assert = require('assert');
var Machine = require('../');



describe('flow control & artificial delay', function (){


  describe('given a machine with an asynchronous implementation', function () {

    describe('that declares itself synchronous', function () {
      var NM_DEF_FIXTURE = {
        sync: true,
        inputs: {},
        fn: function (inputs, exits){
          var sum = 1;
          setTimeout(function (){
            sum++;
            return exits.success(sum);
          }, 50);
        }
      };
      describe('calling .execSync()', function () {
        it('should throw a predictable error', function (){
          try {
            Machine.build(NM_DEF_FIXTURE).execSync();
          } catch (e) {
            // console.log('->',e);
            assert.equal(e.code,'E_MACHINE_INCONSISTENT');
            return;
          }//-•

          throw new Error('Expected an error, but instead it was successful.');
        });//</it>
      });//</describe :: calling .execSync()>
      describe('calling .exec()', function () {
        // FUTURE: make this cause an error instead of working-- eg. make this test pass:
        // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
        it.skip('should throw a predictable error', function (done){
          Machine.build(NM_DEF_FIXTURE).exec(function (err){
            if (err) {
              // console.log('->',err);
              try {
                assert.equal(err.code,'E_MACHINE_INCONSISTENT');
              } catch (e) { return done(e); }
              return done();
            }
            return done(new Error('Expected an error, but instead it was successful.'));
          });//<.exec()>
        });//</it>
        // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
      });//</describe :: calling .exec()>
    });//</describe :: that declares itself synchronous>

    describe('that DOES NOT declare itself synchronous', function () {
      var NM_DEF_FIXTURE = {
        inputs: {},
        fn: function (inputs, exits){
          var sum = 1;
          setTimeout(function (){
            sum++;
            return exits.success(sum);
          }, 50);
        }
      };
      describe('calling .execSync()', function () {
        it('should throw a predictable error', function (){
          try {
            Machine.build(NM_DEF_FIXTURE).execSync();
          } catch (e) {
            // console.log('->',e);
            assert.equal(e.code,'E_USAGE');
            return;
          }//-•

          throw new Error('Expected an error, but instead it was successful.');
        });//</it>
      });//</describe :: calling .execSync()>
      describe('calling .exec()', function () {
        it('should succeed, and should yield before triggering callback', function (done){

          var didYield;
          Machine.build(NM_DEF_FIXTURE).exec(function (err){
            if (err) { return done(err); }

            try {
              assert(didYield, new Error('Should have "yielded"!'));
            } catch (e) { return done(e); }

            return done();
          });//<.exec()>
          didYield = true;

        });//</it>
      });//</describe :: calling .exec()>
    });//</describe :: that DOES NOT declare itself synchronous>

  });//</describe :: given a machine with an asynchronous implementation>


  describe('given a machine with a synchronous implementation', function () {

    describe('that declares itself synchronous', function () {
      var NM_DEF_FIXTURE = {
        sync: true,
        inputs: {},
        fn: function (inputs, exits){
          var sum = 1+1;
          return exits.success(sum);
        }
      };
      describe('calling .execSync()', function () {
        it('should succeed', function (){
          Machine.build(NM_DEF_FIXTURE).execSync();
        });//</it>
      });//</describe :: calling .execSync()>
      describe('calling .exec()', function () {
        it('should succeed, and should yield before triggering callback', function (done){

          var didYield;
          Machine.build(NM_DEF_FIXTURE).exec(function (err){
            if (err) { return done(err); }

            try {
              assert(didYield, new Error('Should have "yielded"!'));
            } catch (e) { return done(e); }

            return done();
          });//<.exec()>
          didYield = true;

        });//</it>
      });//</describe :: calling .exec()>
    });//</describe :: that declares itself synchronous>

    describe('that DOES NOT declare itself synchronous', function () {
      var NM_DEF_FIXTURE = {
        inputs: {},
        fn: function (inputs, exits){
          var sum = 1+1;
          return exits.success(sum);
        }
      };
      describe('calling .execSync()', function () {
        it('should throw a predictable error', function (){
          try {
            Machine.build(NM_DEF_FIXTURE).execSync();
          } catch (e) {
            // console.log('->',e);
            assert.equal(e.code,'E_USAGE');
            return;
          }//-•

          throw new Error('Expected an error, but instead it was successful.');
        });//</it>
      });//</describe :: calling .execSync()>
      describe('calling .exec()', function () {
        it('should succeed, and should yield before triggering callback', function (done){

          var didYield;
          Machine.build(NM_DEF_FIXTURE).exec(function (err){
            if (err) { return done(err); }

            try {
              assert(didYield, new Error('Should have "yielded"!'));
            } catch (e) { return done(e); }

            return done();
          });//<.exec()>
          didYield = true;

        });//</it>
      });//</describe :: calling .exec()>
    });//</describe :: that DOES NOT declare itself synchronous>

  });//</describe :: given a machine with a synchronous implementation>


});//</describe :: flow control & artificial delay>

