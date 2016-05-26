/**
 * Module dependencies
 */

var util = require('util');
var runBenchmarks = require('../helpers/run-benchmarks.helper');
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

  // n/a




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
            success: { example: 'stuff' },
            foo: { example: 'stuff' },
            bar: { example: 'stuff' },
            uhOh: {
              example: ['things']
            }
          },
          fn: function (inputs, exits) { return exits.success(); }
        });
        return next();
      },

      function build_machine_with_inputs_and_exits_that_have_big_ole_exemplars(next){
        var m = Machine.build({
          friendlyName: 'Do something normal',
          inputs: {
            users: {
              example: [
                {
                  name: 'Rover McGuff',
                  age: 3183158,
                  probableSpecies: 'Unicorn dog?',
                  friends: [ { id: 'a83b3-a33819e-293193ba0', friendshipLvl: 4 } ]
                }
              ],
              required: true
            },
            availableSpecies: {
              example: [
                {
                  scientificName: 'canus unicornicus',
                  streetName: 'ankle wraith'
                }
              ],
              defaultsTo: []
            },
            foo: {
              example: [
                {
                  name: 'Rover McGuff',
                  age: 3183158,
                  probableSpecies: 'Unicorn dog?',
                  friends: [ { id: 'a83b3-a33819e-293193ba0', friendshipLvl: 4 } ]
                }
              ],
              required: true
            },
            bar: {
              example: [
                {
                  name: 'Rover McGuff',
                  age: 3183158,
                  probableSpecies: 'Unicorn dog?',
                  friends: [ { id: 'a83b3-a33819e-293193ba0', friendshipLvl: 4 } ]
                }
              ],
              required: true
            }
          },
          exits: {
            success: {
              example: [
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
              ]
            },
            foo: {
              example: [
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
              ]
            },
            bar: {
              example: [
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
              ]
            },
            uhOh: {
              example: [{ x: 32, y: 49, z: -238, t: 1464292613806 }]
            }
          },
          fn: function (inputs, exits) { return exits.success(); }
        });
        return next();
      },

    ], done);

  });//</should be performant enough>

});
