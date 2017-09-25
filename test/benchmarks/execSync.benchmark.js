/**
 * Module dependencies
 */

var _ = require('@sailshq/lodash');
var rttc = require('rttc');
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
// > Note that we extend all of the test machine defs with `sync: true`--
// > a necessary step, given the nature of this particular benchmark.
var DO_SOMETHING_VERY_SIMPLE = _.extend({sync: true}, require('./private/do-something-very-simple.fixture'));
var DO_SOMETHING_NORMAL = _.extend({sync: true}, require('./private/do-something-normal.fixture'));
var DO_SOMETHING_NORMAL_WITH_COMPLEX_EXEMPLARS = _.extend({sync: true}, require('./private/do-something-normal-with-complex-exemplars.fixture'));
var DO_SOMETHING_INSANE_WITH_MANY_BASIC_EXEMPLARS = _.extend({sync: true}, require('./private/do-something-insane-with-many-basic-exemplars.fixture'));
var DO_SOMETHING_INSANE_BUT_CACHEABLE_WITH_MANY_BASIC_EXEMPLARS = _.extend({sync: true}, require('./private/do-something-insane-but-cacheable-with-many-basic-exemplars.fixture'));
var DO_SOMETHING_INSANE_WITH_MANY_COMPLEX_EXEMPLARS = _.extend({sync: true}, require('./private/do-something-insane-with-many-complex-exemplars.fixture'));
var DO_SOMETHING_INSANE_WITH_MANY_REF_EXEMPLARS = _.extend({sync: true}, require('./private/do-something-insane-with-many-ref-exemplars.fixture'));

var SAMPLE_USERS = require('./private/sample-users.fixture');
var SAMPLE_SPECIES = require('./private/sample-species.fixture');


//  ╔╗ ╔═╗╔╗╔╔═╗╦ ╦╔╦╗╔═╗╦═╗╦╔═╔═╗
//  ╠╩╗║╣ ║║║║  ╠═╣║║║╠═╣╠╦╝╠╩╗╚═╗
//  ╚═╝╚═╝╝╚╝╚═╝╩ ╩╩ ╩╩ ╩╩╚═╩ ╩╚═╝
describe('benchmark :: Machine.build() + Machine.prototype.execSync()', function (){
  // Set "timeout" and "slow" thresholds incredibly high
  // to avoid running into issues.
  this.slow(240000);
  this.timeout(240000);



  it('should be performant enough', function (done){

    runBenchmarks('Machine.prototype.execSync()', [

      function sanity_check(next){
        // Do nothing.
        return next();
      },

      function execSync_very_simple_machine(next){
        var m = Machine.build(DO_SOMETHING_VERY_SIMPLE);
        m({}).execSync();
        return next();
      },

      function execSync_machine_with_inputs_and_exits_but_nothing_crazy(next){
        var m = Machine.build(DO_SOMETHING_NORMAL);
        m({
          flavor: 'Sadness',
          qty: 1000,
          foo: 'wha',
          bar: 'huh?'
        }).execSync();
        return next();
      },

      function execSync_machine_with_inputs_and_exits_that_have_big_ole_exemplars(next){
        var m = Machine.build(DO_SOMETHING_NORMAL_WITH_COMPLEX_EXEMPLARS);
        m({
          // Note:
          // > We just abritarily use samples from the exemplars as argmts so this
          // > benchmark is easier to read.
          users: SAMPLE_USERS,
          availableSpecies: SAMPLE_SPECIES,
          foo: SAMPLE_USERS,
          bar: SAMPLE_USERS
        }).execSync();
        return next();
      },


      function execSync_machine_with_crazy_numbers_of_inputs_and_exits(next){
        var m = Machine.build(DO_SOMETHING_INSANE_WITH_MANY_BASIC_EXEMPLARS);
        m({
          one: 'testing stuff',
          two: 'testing stuff',
          three: 'testing stuff',
          four: 'testing stuff',
          five: 'testing stuff',
          six: 'testing stuff',
          seven: 'testing stuff',
          eight: 'testing stuff',
          nine: 'testing stuff',
          ten: 'testing stuff',
          eleven: 'testing stuff',
          twelve: 'testing stuff',
          thirteen: 'testing stuff',
          fourteen: 'testing stuff',
          fifteen: 'testing stuff',
          sixteen: 'testing stuff',
          seventeen: 'testing stuff',
          eighteen: 'testing stuff',
          nineteen: 'testing stuff',
          twenty: 'testing stuff',
        }).execSync();
        return next();
      },


      function execSync_machine_with_crazy_numbers_of_inputs_and_exits_and_is_cacheable(next){
        var m = Machine.build(DO_SOMETHING_INSANE_BUT_CACHEABLE_WITH_MANY_BASIC_EXEMPLARS);
        m({
          one: 'testing stuff',
          two: 'testing stuff',
          three: 'testing stuff',
          four: 'testing stuff',
          five: 'testing stuff',
          six: 'testing stuff',
          seven: 'testing stuff',
          eight: 'testing stuff',
          nine: 'testing stuff',
          ten: 'testing stuff',
          eleven: 'testing stuff',
          twelve: 'testing stuff',
          thirteen: 'testing stuff',
          fourteen: 'testing stuff',
          fifteen: 'testing stuff',
          sixteen: 'testing stuff',
          seventeen: 'testing stuff',
          eighteen: 'testing stuff',
          nineteen: 'testing stuff',
          twenty: 'testing stuff',
        }).execSync();
        return next();
      },


      function execSync_machine_with_crazy_numbers_of_inputs_and_exits_with_huge_exemplars(next){
        var m = Machine.build(DO_SOMETHING_INSANE_WITH_MANY_COMPLEX_EXEMPLARS);
        m({
          // Note:
          // > We just abritarily use samples from the exemplars as argmts so this
          // > benchmark is easier to read.
          one: SAMPLE_USERS,
          two: SAMPLE_USERS,
          three: SAMPLE_USERS,
          four: SAMPLE_USERS,
          five: SAMPLE_USERS,
          six: SAMPLE_USERS,
          seven: SAMPLE_USERS,
          eight: SAMPLE_USERS,
          nine: SAMPLE_USERS,
          ten: SAMPLE_USERS,
          eleven: SAMPLE_USERS,
          twelve: SAMPLE_USERS,
          thirteen: SAMPLE_USERS,
          fourteen: SAMPLE_USERS,
          fifteen: SAMPLE_USERS,
          sixteen: SAMPLE_USERS,
          seventeen: SAMPLE_USERS,
          eighteen: SAMPLE_USERS,
          nineteen: SAMPLE_USERS,
          twenty: SAMPLE_USERS,
        }).execSync();
        return next();
      },


      function execSync_machine_with_crazy_numbers_of_inputs_and_exits_with_ref_exemplars(next){
        var m = Machine.build(DO_SOMETHING_INSANE_WITH_MANY_REF_EXEMPLARS);
        m({
          // Note:
          // > We just abritarily use samples from the exemplars as argmts so this
          // > benchmark is easier to read.
          one: SAMPLE_USERS,
          two: SAMPLE_USERS,
          three: SAMPLE_USERS,
          four: SAMPLE_USERS,
          five: SAMPLE_USERS,
          six: SAMPLE_USERS,
          seven: SAMPLE_USERS,
          eight: SAMPLE_USERS,
          nine: SAMPLE_USERS,
          ten: SAMPLE_USERS,
          eleven: SAMPLE_USERS,
          twelve: SAMPLE_USERS,
          thirteen: SAMPLE_USERS,
          fourteen: SAMPLE_USERS,
          fifteen: SAMPLE_USERS,
          sixteen: SAMPLE_USERS,
          seventeen: SAMPLE_USERS,
          eighteen: SAMPLE_USERS,
          nineteen: SAMPLE_USERS,
          twenty: SAMPLE_USERS,
        }).execSync();
        return next();
      },

    ], done);

  });//</should be performant enough>

});
