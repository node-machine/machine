/**
 * Module dependencies
 */

var util = require('util');
var runBenchmarks = require('../util/run-benchmarks.helper');
var Machine = require('../../');


//  ╔╗ ╔═╗╔╗╔╔═╗╦ ╦╔╦╗╔═╗╦═╗╦╔═╔═╗
//  ╠╩╗║╣ ║║║║  ╠═╣║║║╠═╣╠╦╝╠╩╗╚═╗
//  ╚═╝╚═╝╝╚╝╚═╝╩ ╩╩ ╩╩ ╩╩╚═╩ ╩╚═╝
describe('benchmark :: Machine.build()', function (){
  // Set "timeout" and "slow" thresholds incredibly high
  // to avoid running into issues.
  this.slow(240000);
  this.timeout(240000);


  //  ╔═╗╦═╗ ╦╔╦╗╦ ╦╦═╗╔═╗╔═╗
  //  ╠╣ ║╔╩╦╝ ║ ║ ║╠╦╝║╣ ╚═╗
  //  ╚  ╩╩ ╚═ ╩ ╚═╝╩╚═╚═╝╚═╝

  var USERS_EXEMPLAR = [
    {
      name: 'Rover McGuff',
      age: 3183158,
      confirmedSpecies: {
        scientificName: 'canus unicornicus',
        streetName: 'ankle wraith'
      },
      friends: [
        {
          id: 'a83b3-a33819e-293193ba0',
          friendshipLvl: 4,
          profile: {
            name: 'Dolores McGuff',
            age: 3183158,
            confirmedSpecies: {
              scientificName: 'canus unicornicus',
              streetName: 'ankle wraith'
            }
          }
        }
      ]
    }
  ];
  var SPECIES_EXEMPLAR = [
    {
      scientificName: 'canus unicornicus',
      streetName: 'ankle wraith'
    }
  ];




  it('should be performant enough', function (done){

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

    runBenchmarks('Machine.build()', [

      function sanity_check(next){
        // Do nothing.
        return next();
      },

      function build_very_simple_machine(next){
        var m = Machine.build({
          friendlyName: 'Do something very simple',
          fn: function (inputs, exits) { return exits.success(); }
        });
        return next();
      },

      function build_machine_with_inputs_and_exits_but_nothing_crazy(next){
        var m = Machine.build({
          friendlyName: 'Do something normal',
          inputs: {
            flavor: { example: 'stuff', required: true },
            qty: { example: 38, defaultsTo: 1 },
            foo: { example: 'stuff', required: true },
            bar: { example: 'stuff', required: true },
          },
          exits: {
            success: { outputExample: 'stuff' },
            foo: { outputExample: 'stuff' },
            bar: { outputExample: 'stuff' },
            uhOh: {
              outputExample: ['things']
            }
          },
          fn: function (inputs, exits) { return exits.success(); }
        });
        return next();
      },

      function build_machine_with_inputs_and_exits_that_have_big_ole_exemplars(next){
        var m = Machine.build({
          friendlyName: 'Do something that demands these exemplars',
          inputs: {
            users: { example: USERS_EXEMPLAR, required: true },
            availableSpecies: { example: SPECIES_EXEMPLAR, defaultsTo: [] },
            foo: { example: USERS_EXEMPLAR, required: true },
            bar: { example: USERS_EXEMPLAR, required: true }
          },
          exits: {
            success: { outputExample: USERS_EXEMPLAR },
            foo: { outputExample: USERS_EXEMPLAR },
            bar: { outputExample: USERS_EXEMPLAR },
            uhOh: { outputExample: [{ x: 32, y: 49, z: -238, t: 1464292613806 }] }
          },
          fn: function (inputs, exits) { return exits.success(); }
        });
        return next();
      },


      function build_machine_with_crazy_numbers_of_inputs_and_exits(next){
        var m = Machine.build({
          description: 'Do something that demands a crap ton of inputs and exits',
          inputs: {
            one: { example: 'stuff', required: true },
            two: { example: 'stuff', required: true },
            three: { example: 'stuff', required: true },
            four: { example: 'stuff', required: true },
            five: { example: 'stuff', required: true },
            six: { example: 'stuff', required: true },
            seven: { example: 'stuff', required: true },
            eight: { example: 'stuff', required: true },
            nine: { example: 'stuff', required: true },
            ten: { example: 'stuff', required: true },
            eleven: { example: 'stuff', required: true },
            twelve: { example: 'stuff', required: true },
            thirteen: { example: 'stuff', required: true },
            fourteen: { example: 'stuff', required: true },
            fifteen: { example: 'stuff', required: true },
            sixteen: { example: 'stuff', required: true },
            seventeen: { example: 'stuff', required: true },
            eighteen: { example: 'stuff', required: true },
            nineteen: { example: 'stuff', required: true },
            twenty: { example: 'stuff', required: true },
          },
          exits: {
            success: { outputExample: 'stuff' },
            one: { outputExample: 'stuff' },
            two: { outputExample: 'stuff' },
            three: { outputExample: 'stuff' },
            four: { outputExample: 'stuff' },
            five: { outputExample: 'stuff' },
            six: { outputExample: 'stuff' },
            seven: { outputExample: 'stuff' },
            eight: { outputExample: 'stuff' },
            nine: { outputExample: 'stuff' },
            ten: { outputExample: 'stuff' },
            eleven: { outputExample: 'stuff' },
            twelve: { outputExample: 'stuff' },
            thirteen: { outputExample: 'stuff' },
            fourteen: { outputExample: 'stuff' },
            fifteen: { outputExample: 'stuff' },
            sixteen: { outputExample: 'stuff' },
            seventeen: { outputExample: 'stuff' },
            eighteen: { outputExample: 'stuff' },
          },
          fn: function (inputs, exits) { return exits.success(); }
        });
        return next();
      },


      function build_machine_with_crazy_numbers_of_inputs_and_exits_and_is_cacheable(next){
        var m = Machine.build({
          description: 'Do something that demands a crap ton of inputs and exits and is cacheable',
          sideEffects: 'cacheable',
          inputs: {
            one: { example: 'stuff', required: true },
            two: { example: 'stuff', required: true },
            three: { example: 'stuff', required: true },
            four: { example: 'stuff', required: true },
            five: { example: 'stuff', required: true },
            six: { example: 'stuff', required: true },
            seven: { example: 'stuff', required: true },
            eight: { example: 'stuff', required: true },
            nine: { example: 'stuff', required: true },
            ten: { example: 'stuff', required: true },
            eleven: { example: 'stuff', required: true },
            twelve: { example: 'stuff', required: true },
            thirteen: { example: 'stuff', required: true },
            fourteen: { example: 'stuff', required: true },
            fifteen: { example: 'stuff', required: true },
            sixteen: { example: 'stuff', required: true },
            seventeen: { example: 'stuff', required: true },
            eighteen: { example: 'stuff', required: true },
            nineteen: { example: 'stuff', required: true },
            twenty: { example: 'stuff', required: true },
          },
          exits: {
            success: { outputExample: 'stuff' },
            one: { outputExample: 'stuff' },
            two: { outputExample: 'stuff' },
            three: { outputExample: 'stuff' },
            four: { outputExample: 'stuff' },
            five: { outputExample: 'stuff' },
            six: { outputExample: 'stuff' },
            seven: { outputExample: 'stuff' },
            eight: { outputExample: 'stuff' },
            nine: { outputExample: 'stuff' },
            ten: { outputExample: 'stuff' },
            eleven: { outputExample: 'stuff' },
            twelve: { outputExample: 'stuff' },
            thirteen: { outputExample: 'stuff' },
            fourteen: { outputExample: 'stuff' },
            fifteen: { outputExample: 'stuff' },
            sixteen: { outputExample: 'stuff' },
            seventeen: { outputExample: 'stuff' },
            eighteen: { outputExample: 'stuff' },
          },
          fn: function (inputs, exits) { return exits.success(); }
        });
        return next();
      },


      function build_machine_with_crazy_numbers_of_inputs_and_exits_with_huge_exemplars(next){
        var m = Machine.build({
          description: 'Do something that demands a crap ton of inputs and exits where all of them have ref exemplars',
          sideEffects: 'cacheable',
          inputs: {
            one: { example: USERS_EXEMPLAR, required: true },
            two: { example: USERS_EXEMPLAR, required: true },
            three: { example: USERS_EXEMPLAR, required: true },
            four: { example: USERS_EXEMPLAR, required: true },
            five: { example: USERS_EXEMPLAR, required: true },
            six: { example: USERS_EXEMPLAR, required: true },
            seven: { example: USERS_EXEMPLAR, required: true },
            eight: { example: USERS_EXEMPLAR, required: true },
            nine: { example: USERS_EXEMPLAR, required: true },
            ten: { example: USERS_EXEMPLAR, required: true },
            eleven: { example: USERS_EXEMPLAR, required: true },
            twelve: { example: USERS_EXEMPLAR, required: true },
            thirteen: { example: USERS_EXEMPLAR, required: true },
            fourteen: { example: USERS_EXEMPLAR, required: true },
            fifteen: { example: USERS_EXEMPLAR, required: true },
            sixteen: { example: USERS_EXEMPLAR, required: true },
            seventeen: { example: USERS_EXEMPLAR, required: true },
            eighteen: { example: USERS_EXEMPLAR, required: true },
            nineteen: { example: USERS_EXEMPLAR, required: true },
            twenty: { example: USERS_EXEMPLAR, required: true },
          },
          exits: {
            success: { outputExample: USERS_EXEMPLAR },
            one: { outputExample: USERS_EXEMPLAR },
            two: { outputExample: USERS_EXEMPLAR },
            three: { outputExample: USERS_EXEMPLAR },
            four: { outputExample: USERS_EXEMPLAR },
            five: { outputExample: USERS_EXEMPLAR },
            six: { outputExample: USERS_EXEMPLAR },
            seven: { outputExample: USERS_EXEMPLAR },
            eight: { outputExample: USERS_EXEMPLAR },
            nine: { outputExample: USERS_EXEMPLAR },
            ten: { outputExample: USERS_EXEMPLAR },
            eleven: { outputExample: USERS_EXEMPLAR },
            twelve: { outputExample: USERS_EXEMPLAR },
            thirteen: { outputExample: USERS_EXEMPLAR },
            fourteen: { outputExample: USERS_EXEMPLAR },
            fifteen: { outputExample: USERS_EXEMPLAR },
            sixteen: { outputExample: USERS_EXEMPLAR },
            seventeen: { outputExample: USERS_EXEMPLAR },
            eighteen: { outputExample: USERS_EXEMPLAR },
          },
          fn: function (inputs, exits) { return exits.success(); }
        });
        return next();
      },


      function build_machine_with_crazy_numbers_of_inputs_and_exits_with_ref_exemplars(next){
        var m = Machine.build({
          description: 'Do something that demands a crap ton of inputs and exits where all of them have ref exemplars',
          sideEffects: 'cacheable',
          inputs: {
            one: { example: '===', required: true },
            two: { example: '===', required: true },
            three: { example: '===', required: true },
            four: { example: '===', required: true },
            five: { example: '===', required: true },
            six: { example: '===', required: true },
            seven: { example: '===', required: true },
            eight: { example: '===', required: true },
            nine: { example: '===', required: true },
            ten: { example: '===', required: true },
            eleven: { example: '===', required: true },
            twelve: { example: '===', required: true },
            thirteen: { example: '===', required: true },
            fourteen: { example: '===', required: true },
            fifteen: { example: '===', required: true },
            sixteen: { example: '===', required: true },
            seventeen: { example: '===', required: true },
            eighteen: { example: '===', required: true },
            nineteen: { example: '===', required: true },
            twenty: { example: '===', required: true },
          },
          exits: {
            success: { outputExample: '===' },
            one: { outputExample: '===' },
            two: { outputExample: '===' },
            three: { outputExample: '===' },
            four: { outputExample: '===' },
            five: { outputExample: '===' },
            six: { outputExample: '===' },
            seven: { outputExample: '===' },
            eight: { outputExample: '===' },
            nine: { outputExample: '===' },
            ten: { outputExample: '===' },
            eleven: { outputExample: '===' },
            twelve: { outputExample: '===' },
            thirteen: { outputExample: '===' },
            fourteen: { outputExample: '===' },
            fifteen: { outputExample: '===' },
            sixteen: { outputExample: '===' },
            seventeen: { outputExample: '===' },
            eighteen: { outputExample: '===' },
          },
          fn: function (inputs, exits) { return exits.success(); }
        });
        return next();
      },

    ], done);

  });//</should be performant enough>

});
