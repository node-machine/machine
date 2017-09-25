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
describe('benchmark :: just .exec()  (assuming machines have already been built)', function (){
  // Set "timeout" and "slow" thresholds incredibly high
  // to avoid running into issues.
  this.slow(240000);
  this.timeout(240000);


  it('should be performant enough', function (done){

    runBenchmarks('just .exec()', [

      function sanity_check(next){
        // Do nothing.
        return next();
      },

      function exec_very_simple_machine(next){
        doSomethingVerySimple({}).exec(next);
      },

      function exec_machine_with_inputs_and_exits_but_nothing_crazy(next){
        doSomethingNormal({
          flavor: 'Sadness',
          qty: 1000,
          foo: 'wha',
          bar: 'huh?'
        }).exec(next);
      },

      function exec_machine_with_inputs_and_exits_that_have_big_ole_exemplars(next){
        doSomethingNormalWithComplexExemplars({
          // Note:
          // > We just abritarily use samples from the exemplars as argmts so this
          // > benchmark is easier to read.
          users: SAMPLE_USERS,
          availableSpecies: SAMPLE_SPECIES,
          foo: SAMPLE_USERS,
          bar: SAMPLE_USERS
        }).exec(next);
      },


      function exec_machine_with_crazy_numbers_of_inputs_and_exits(next){
        doSomethingInsaneWithManyBasicExemplars(SAMPLE_MANY_BASIC_ARGINS).exec(next);
      },


      function exec_machine_with_crazy_numbers_of_inputs_and_exits_and_is_cacheable(next){
        doSomethingInsaneButCacheableWithManyBasicExemplars(SAMPLE_MANY_BASIC_ARGINS).exec(next);
      },


      function exec_machine_with_crazy_numbers_of_inputs_and_exits_with_huge_exemplars(next){
        doSomethingInsaneWithManyComplexExemplars(SAMPLE_MANY_COMPLEX_ARGINS).exec(next);
      },


      function exec_machine_with_crazy_numbers_of_inputs_and_exits_with_ref_exemplars(next){
        doSomethingInsaneWithManyRefExemplars(SAMPLE_MANY_COMPLEX_ARGINS).exec(next);
      },

    ], done);

  });//</should be performant enough>

});
