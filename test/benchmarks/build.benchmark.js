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

var DO_SOMETHING_VERY_SIMPLE = require('./private/do-something-very-simple.fixture');
var DO_SOMETHING_NORMAL = require('./private/do-something-normal.fixture');
var DO_SOMETHING_NORMAL_WITH_COMPLEX_EXEMPLARS = require('./private/do-something-normal-with-complex-exemplars.fixture');
var DO_SOMETHING_INSANE_WITH_MANY_BASIC_EXEMPLARS = require('./private/do-something-insane-with-many-basic-exemplars.fixture');
var DO_SOMETHING_INSANE_BUT_CACHEABLE_WITH_MANY_BASIC_EXEMPLARS = require('./private/do-something-insane-but-cacheable-with-many-basic-exemplars.fixture');
var DO_SOMETHING_INSANE_WITH_MANY_COMPLEX_EXEMPLARS = require('./private/do-something-insane-with-many-complex-exemplars.fixture');
var DO_SOMETHING_INSANE_WITH_MANY_REF_EXEMPLARS = require('./private/do-something-insane-with-many-ref-exemplars.fixture');


//  ╔╗ ╔═╗╔╗╔╔═╗╦ ╦╔╦╗╔═╗╦═╗╦╔═╔═╗
//  ╠╩╗║╣ ║║║║  ╠═╣║║║╠═╣╠╦╝╠╩╗╚═╗
//  ╚═╝╚═╝╝╚╝╚═╝╩ ╩╩ ╩╩ ╩╩╚═╩ ╩╚═╝
describe('benchmark :: Machine.build()', function (){
  // Set "timeout" and "slow" thresholds incredibly high
  // to avoid running into issues.
  this.slow(240000);
  this.timeout(240000);


  it('should be performant enough', function (done){

    // (Including this squid tentacle here just since this file is alphabetically first.)
    console.log(
    '                                   \n'+
    '   o                               \n'+
    '                                    \n'+
    '       •                            \n'+
    '      o                  .          \n'+
    '       •                •            \n'+
    '        •                •           \n'+
    '                •       o            \n'+
    '                            •        o\n'+
    ' o   •              •          o   •\n'+
    '      o              o         •    \n'+
    '  •  •      •       •      •    •    \n'+
    '           •      •              o  \n'+
    '  •    b e n c h m a r k s      •    \n'+
    '   •        •                        \n'+
    ' •                        ___  •    \n'+
    '    • o •    •      •    /o/•\\_   • \n'+
    '       •   •  o    •    /_/\\ o \\_ • \n'+
    '       o    O   •   o • •   \\ o .\\_    \n'+
    '          •       o  •       \\. O  \\   \n'+
    '');

    runBenchmarks('just Machine.build()', [

      function sanity_check(next){
        // Do nothing.
        return next();
      },

      function build_very_simple_machine(next){
        var m = Machine.build(DO_SOMETHING_VERY_SIMPLE);
        return next();
      },

      function build_machine_with_inputs_and_exits_but_nothing_crazy(next){
        var m = Machine.build(DO_SOMETHING_NORMAL);
        return next();
      },

      function build_machine_with_inputs_and_exits_that_have_big_ole_exemplars(next){
        var m = Machine.build(DO_SOMETHING_NORMAL_WITH_COMPLEX_EXEMPLARS);
        return next();
      },


      function build_machine_with_crazy_numbers_of_inputs_and_exits(next){
        var m = Machine.build(DO_SOMETHING_INSANE_WITH_MANY_BASIC_EXEMPLARS);
        return next();
      },


      function build_machine_with_crazy_numbers_of_inputs_and_exits_and_is_cacheable(next){
        var m = Machine.build(DO_SOMETHING_INSANE_BUT_CACHEABLE_WITH_MANY_BASIC_EXEMPLARS);
        return next();
      },


      function build_machine_with_crazy_numbers_of_inputs_and_exits_with_huge_exemplars(next){
        var m = Machine.build(DO_SOMETHING_INSANE_WITH_MANY_COMPLEX_EXEMPLARS);
        return next();
      },


      function build_machine_with_crazy_numbers_of_inputs_and_exits_with_ref_exemplars(next){
        var m = Machine.build(DO_SOMETHING_INSANE_WITH_MANY_REF_EXEMPLARS);
        return next();
      },

    ], done);

  });//</should be performant enough>

});
