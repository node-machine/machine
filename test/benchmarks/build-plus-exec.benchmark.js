// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// NOTE:
// Commented out this file because it's not as telling
// as looking at the methods' performance individually.
// (And it adds a bunch of time to the benchmark test run...)
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -







// /**
//  * Module dependencies
//  */

// var runBenchmarks = require('../util/run-benchmarks.helper');
// var Machine = require('../../');

// /* eslint-disable no-unused-vars, camelcase */
// // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// // ^^because the snake_case makes test output more readable when working with
// // the benchmark.js lib, and the unused vars are there on purpose (to help
// // make sure that nothing gets optimized away by V8).
// // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

// //  ╔═╗╦═╗ ╦╔╦╗╦ ╦╦═╗╔═╗╔═╗
// //  ╠╣ ║╔╩╦╝ ║ ║ ║╠╦╝║╣ ╚═╗
// //  ╚  ╩╩ ╚═ ╩ ╚═╝╩╚═╚═╝╚═╝
// var DO_SOMETHING_VERY_SIMPLE = require('./private/do-something-very-simple.fixture');
// var DO_SOMETHING_NORMAL = require('./private/do-something-normal.fixture');
// var DO_SOMETHING_NORMAL_WITH_COMPLEX_EXEMPLARS = require('./private/do-something-normal-with-complex-exemplars.fixture');
// var DO_SOMETHING_INSANE_WITH_MANY_BASIC_EXEMPLARS = require('./private/do-something-insane-with-many-basic-exemplars.fixture');
// var DO_SOMETHING_INSANE_BUT_CACHEABLE_WITH_MANY_BASIC_EXEMPLARS = require('./private/do-something-insane-but-cacheable-with-many-basic-exemplars.fixture');
// var DO_SOMETHING_INSANE_WITH_MANY_COMPLEX_EXEMPLARS = require('./private/do-something-insane-with-many-complex-exemplars.fixture');
// var DO_SOMETHING_INSANE_WITH_MANY_REF_EXEMPLARS = require('./private/do-something-insane-with-many-ref-exemplars.fixture');

// var SAMPLE_USERS = require('./private/sample-users.fixture');
// var SAMPLE_SPECIES = require('./private/sample-species.fixture');
// var SAMPLE_MANY_BASIC_ARGINS = require('./private/sample-many-basic-argins.fixture');
// var SAMPLE_MANY_COMPLEX_ARGINS = require('./private/sample-many-complex-argins.fixture');

// //  ╔╗ ╔═╗╔╗╔╔═╗╦ ╦╔╦╗╔═╗╦═╗╦╔═╔═╗
// //  ╠╩╗║╣ ║║║║  ╠═╣║║║╠═╣╠╦╝╠╩╗╚═╗
// //  ╚═╝╚═╝╝╚╝╚═╝╩ ╩╩ ╩╩ ╩╩╚═╩ ╩╚═╝
// describe('benchmark :: Machine.build() + .exec()', function (){
//   // Set "timeout" and "slow" thresholds incredibly high
//   // to avoid running into issues.
//   this.slow(240000);
//   this.timeout(240000);


//   it('should be performant enough', function (done){

//     runBenchmarks('.build() + .exec()', [

//       function sanity_check(next){
//         // Do nothing.
//         return next();
//       },

//       function build_and_exec_very_simple_machine(next){
//         var m = Machine.build(DO_SOMETHING_VERY_SIMPLE);
//         m({}).exec(next);
//       },

//       function build_and_exec_machine_with_inputs_and_exits_but_nothing_crazy(next){
//         var m = Machine.build(DO_SOMETHING_NORMAL);
//         m({
//           flavor: 'Sadness',
//           qty: 1000,
//           foo: 'wha',
//           bar: 'huh?'
//         }).exec(next);
//       },

//       function build_and_exec_machine_with_inputs_and_exits_that_have_big_ole_exemplars(next){
//         var m = Machine.build(DO_SOMETHING_NORMAL_WITH_COMPLEX_EXEMPLARS);
//         m({
//           // Note:
//           // > We just abritarily use samples from the exemplars as argmts so this
//           // > benchmark is easier to read.
//           users: SAMPLE_USERS,
//           availableSpecies: SAMPLE_SPECIES,
//           foo: SAMPLE_USERS,
//           bar: SAMPLE_USERS
//         }).exec(next);
//       },


//       function build_and_exec_machine_with_crazy_numbers_of_inputs_and_exits(next){
//         var m = Machine.build(DO_SOMETHING_INSANE_WITH_MANY_BASIC_EXEMPLARS);
//         m(SAMPLE_MANY_BASIC_ARGINS).exec(next);
//       },


//       function build_and_exec_machine_with_crazy_numbers_of_inputs_and_exits_and_is_cacheable(next){
//         var m = Machine.build(DO_SOMETHING_INSANE_BUT_CACHEABLE_WITH_MANY_BASIC_EXEMPLARS);
//         m(SAMPLE_MANY_BASIC_ARGINS).exec(next);
//       },


//       function build_and_exec_machine_with_crazy_numbers_of_inputs_and_exits_with_huge_exemplars(next){
//         var m = Machine.build(DO_SOMETHING_INSANE_WITH_MANY_COMPLEX_EXEMPLARS);
//         m(SAMPLE_MANY_COMPLEX_ARGINS).exec(next);
//       },


//       function build_and_exec_machine_with_crazy_numbers_of_inputs_and_exits_with_ref_exemplars(next){
//         var m = Machine.build(DO_SOMETHING_INSANE_WITH_MANY_REF_EXEMPLARS);
//         m(SAMPLE_MANY_COMPLEX_ARGINS).exec(next);
//       },

//     ], done);

//   });//</should be performant enough>

// });
