/**
 * Module dependencies
 */

var runBenchmarks = require('../util/run-benchmarks.helper');
var Machine = require('../../');

/* eslint-disable no-unused-vars, camelcase */
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// ^^because the snake_case makes test output more readable when working with
// the benchmark.js lib, and the unused vars are there on purpose (to help
// make sure that nothing gets optimized away by V8).
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

//  ╔═╗╦═╗ ╦╔╦╗╦ ╦╦═╗╔═╗╔═╗
//  ╠╣ ║╔╩╦╝ ║ ║ ║╠╦╝║╣ ╚═╗
//  ╚  ╩╩ ╚═ ╩ ╚═╝╩╚═╚═╝╚═╝
var doSomethingVerySimple = Machine.build(require('./private/do-something-very-simple.fixture'));
var doSomethingNormal = Machine.build(require('./private/do-something-normal.fixture'));
var doSomethingNormalWithComplexExemplars = Machine.build(require('./private/do-something-normal-with-complex-exemplars.fixture'));
var doSomethingInsaneWithManyBasicExemplars = Machine.build(require('./private/do-something-insane-with-many-basic-exemplars.fixture'));
var doSomethingInsaneButCacheableWithManyBasicExemplars = Machine.build(require('./private/do-something-insane-but-cacheable-with-many-basic-exemplars.fixture'));
var doSomethingInsaneWithManyComplexExemplars = Machine.build(require('./private/do-something-insane-with-many-complex-exemplars.fixture'));
var doSomethingInsaneWithManyRefExemplars = Machine.build(require('./private/do-something-insane-with-many-ref-exemplars.fixture'));

var SAMPLE_USERS = require('./private/sample-users.fixture');
var SAMPLE_SPECIES = require('./private/sample-species.fixture');
var SAMPLE_MANY_BASIC_ARGINS = require('./private/sample-many-basic-argins.fixture');
var SAMPLE_MANY_COMPLEX_ARGINS = require('./private/sample-many-complex-argins.fixture');

//  ╔╗ ╔═╗╔╗╔╔═╗╦ ╦╔╦╗╔═╗╦═╗╦╔═╔═╗
//  ╠╩╗║╣ ║║║║  ╠═╣║║║╠═╣╠╦╝╠╩╗╚═╗
//  ╚═╝╚═╝╝╚╝╚═╝╩ ╩╩ ╩╩ ╩╩╚═╩ ╩╚═╝
describe('benchmark :: just `await`  (assuming machines have already been built)', function(){
  // Set "timeout" and "slow" thresholds incredibly high
  // to avoid running into issues.
  this.slow(240000);
  this.timeout(240000);

  // Skip these tests if node version is too old.
  if ((+(process.version.match(/^v([0-9]+)\./)[1])) < 8) {
    return;
  }//•

  it('should be performant enough', function (done){

    runBenchmarks('just `await`', [

      async function sanity_check(next){
        // Do nothing.
        return next();
      },

      async function await_very_simple_machine(next){
        await doSomethingVerySimple({});
        return next();
      },

      async function await_machine_with_inputs_and_exits_but_nothing_crazy(next){
        await doSomethingNormal({
          flavor: 'Sadness',
          qty: 1000,
          foo: 'wha',
          bar: 'huh?'
        });
        return next();
      },

      async function await_machine_with_inputs_and_exits_that_have_big_ole_exemplars(next){
        await doSomethingNormalWithComplexExemplars({
          // Note:
          // > We just abritarily use samples from the exemplars as argmts so this
          // > benchmark is easier to read.
          users: SAMPLE_USERS,
          availableSpecies: SAMPLE_SPECIES,
          foo: SAMPLE_USERS,
          bar: SAMPLE_USERS
        });
        return next();
      },


      async function await_machine_with_crazy_numbers_of_inputs_and_exits(next){
        await doSomethingInsaneWithManyBasicExemplars(SAMPLE_MANY_BASIC_ARGINS);
        return next();
      },


      async function await_machine_with_crazy_numbers_of_inputs_and_exits_and_is_cacheable(next){
        await doSomethingInsaneButCacheableWithManyBasicExemplars(SAMPLE_MANY_BASIC_ARGINS);
        return next();
      },


      async function await_machine_with_crazy_numbers_of_inputs_and_exits_with_huge_exemplars(next){
        await doSomethingInsaneWithManyComplexExemplars(SAMPLE_MANY_COMPLEX_ARGINS);
        return next();
      },


      async function await_machine_with_crazy_numbers_of_inputs_and_exits_with_ref_exemplars(next){
        await doSomethingInsaneWithManyRefExemplars(SAMPLE_MANY_COMPLEX_ARGINS);
        return next();
      },


      // ================================================================================

      // async function sanity_check(next){
      //   (async function(){
      //     // Do nothing.
      //   })().then(function(){
      //     return next();
      //   }).catch(function(err){
      //     return next(err);
      //   });
      // },

      // function await_very_simple_machine(next){
      //   (async function(){
      //     await doSomethingVerySimple({});
      //   })().then(function(){
      //     return next();
      //   }).catch(function(err){
      //     return next(err);
      //   });
      // },

      // function await_machine_with_inputs_and_exits_but_nothing_crazy(next){
      //   (async function(){
      //     await doSomethingNormal({
      //       flavor: 'Sadness',
      //       qty: 1000,
      //       foo: 'wha',
      //       bar: 'huh?'
      //     });
      //   })().then(function(){
      //     return next();
      //   }).catch(function(err){
      //     return next(err);
      //   });
      // },

      // function await_machine_with_inputs_and_exits_that_have_big_ole_exemplars(next){
      //   (async function(){
      //     await doSomethingNormalWithComplexExemplars({
      //       // Note:
      //       // > We just abritarily use samples from the exemplars as argmts so this
      //       // > benchmark is easier to read.
      //       users: SAMPLE_USERS,
      //       availableSpecies: SAMPLE_SPECIES,
      //       foo: SAMPLE_USERS,
      //       bar: SAMPLE_USERS
      //     });
      //   })().then(function(){
      //     return next();
      //   }).catch(function(err){
      //     return next(err);
      //   });
      // },


      // function await_machine_with_crazy_numbers_of_inputs_and_exits(next){
      //   (async function(){
      //     await doSomethingInsaneWithManyBasicExemplars(SAMPLE_MANY_BASIC_ARGINS);
      //   })().then(function(){
      //     return next();
      //   }).catch(function(err){
      //     return next(err);
      //   });
      // },


      // function await_machine_with_crazy_numbers_of_inputs_and_exits_and_is_cacheable(next){
      //   (async function(){
      //     await doSomethingInsaneButCacheableWithManyBasicExemplars(SAMPLE_MANY_BASIC_ARGINS);
      //   })().then(function(){
      //     return next();
      //   }).catch(function(err){
      //     return next(err);
      //   });
      // },


      // function await_machine_with_crazy_numbers_of_inputs_and_exits_with_huge_exemplars(next){
      //   (async function(){
      //     await doSomethingInsaneWithManyComplexExemplars(SAMPLE_MANY_COMPLEX_ARGINS);
      //   })().then(function(){
      //     return next();
      //   }).catch(function(err){
      //     return next(err);
      //   });
      // },


      // function await_machine_with_crazy_numbers_of_inputs_and_exits_with_ref_exemplars(next){
      //   (async function(){
      //     await doSomethingInsaneWithManyRefExemplars(SAMPLE_MANY_COMPLEX_ARGINS);
      //   })().then(function(){
      //     return next();
      //   }).catch(function(err){
      //     return next(err);
      //   });
      // },

    ], done);

  });//</should be performant enough>

});
