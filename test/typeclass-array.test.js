var assert = require('assert');
var M = require('../lib/Machine.constructor');


//        ████████╗██╗   ██╗██████╗ ███████╗ ██████╗██╗      █████╗ ███████╗███████╗
//  ▄ ██╗▄╚══██╔══╝╚██╗ ██╔╝██╔══██╗██╔════╝██╔════╝██║     ██╔══██╗██╔════╝██╔════╝▄ ██╗▄
//   ████╗   ██║    ╚████╔╝ ██████╔╝█████╗  ██║     ██║     ███████║███████╗███████╗ ████╗
//  ▀╚██╔▀   ██║     ╚██╔╝  ██╔═══╝ ██╔══╝  ██║     ██║     ██╔══██║╚════██║╚════██║▀╚██╔▀
//    ╚═╝    ██║      ██║   ██║     ███████╗╚██████╗███████╗██║  ██║███████║███████║  ╚═╝
//           ╚═╝      ╚═╝   ╚═╝     ╚══════╝ ╚═════╝╚══════╝╚═╝  ╚═╝╚══════╝╚══════╝
//
//  ██╗███████╗    ██████╗ ███████╗██████╗ ██████╗ ███████╗ ██████╗ █████╗ ████████╗███████╗██████╗ ██╗
//  ██║██╔════╝    ██╔══██╗██╔════╝██╔══██╗██╔══██╗██╔════╝██╔════╝██╔══██╗╚══██╔══╝██╔════╝██╔══██╗██║
//  ██║███████╗    ██║  ██║█████╗  ██████╔╝██████╔╝█████╗  ██║     ███████║   ██║   █████╗  ██║  ██║██║
//  ██║╚════██║    ██║  ██║██╔══╝  ██╔═══╝ ██╔══██╗██╔══╝  ██║     ██╔══██║   ██║   ██╔══╝  ██║  ██║╚═╝
//  ██║███████║    ██████╔╝███████╗██║     ██║  ██║███████╗╚██████╗██║  ██║   ██║   ███████╗██████╔╝██╗
//  ╚═╝╚══════╝    ╚═════╝ ╚══════╝╚═╝     ╚═╝  ╚═╝╚══════╝ ╚═════╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═════╝ ╚═╝
//
describe('Machine inputs typeclass array', function() {

  var machine = {
    inputs: {
      foo: {
        typeclass: 'array'
      }
    },

    exits: {
      success: {},
      error: {}
    },

    fn: function (inputs, exits, deps) {
      exits();
    }
  };


  ////////////////////////////////
  // Valid
  ////////////////////////////////

  it('should run with an array of dictionaries where each dictionary is the same', function(done) {
    M.build(machine)
    .configure({
      foo: [{ bar: 'baz' }, { bar: 'foo' }]
    })
    .exec(function(err, result) {
      if(err) { return done(err); }
      done();
    });
  });

  it('should run with an empty array', function(done) {
    M.build(machine)
    .configure({
      foo: []
    })
    .exec(function(err, result) {
      if(err) { return done(err); }
      done();
    });
  });


  ////////////////////////////////
  // Invalid
  ////////////////////////////////

  // NOTE:
  // This functionality was temporarily disabled because it adds a lot of code, and can slow
  // things down for large arrays of big dictionaries with large arrays of more big dictionaries, etc.
  // In the future, perhaps this particular validation could be toggled on or off via configuration.
  //
  // ~Mike
  // Jan 16, 2015
  //
  // ----UPDATE-----
  // In general, `typeclass` has been deprecated for several machine versions now.
  // It will be removed very soon.
  //
  // That said, homeogeneous array validations are fully implemented in RTTC.
  // However, an exemplar of `['*']` will NOT validate that every item is a string--
  // rather it validates that every item is JSON-serializable.  If an exemplar of `['foo']`
  // is specified, then all items will be validated as strings, etc.  To allow an array
  // of literally ANYTHING (completely heterogeous), use `['===']` -- but be aware that
  // array items will be passed through by reference, and no cloning or sanitization will
  // be performed (useful for when you have an array of streams/functions/literally anything).
  //
  // ~Mike
  // Sep 17, 2016

  // it('should not run with an array of dictionaries where each dictionary is NOT the same', function(done) {
  //   M.build(machine)
  //   .configure({
  //     foo: [{ bar: 'baz' }, { foo: 'bar' }]
  //   })
  //   .exec(function(err, result) {
  //     assert(err, 'should not have allowed heterogeneous array in a typeclass:array input');
  //     done();
  //   });
  // });

});
