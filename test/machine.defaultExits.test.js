var assert = require('assert');
var M = require('../lib/Machine.constructor');

describe('Default exits test', function() {


  describe('with defaultExit and catchallExit defined as custom exits', function() {

    var machine;
    before(function() {

      machine = {
          inputs: {
            foo: {
              example: 'foo bar'
            }
          },

          exits: {
            "then": {},
            "else": {}
          },

          defaultExit: "then",
          catchallExit: "else",

          fn: function (inputs, exits, deps) {
            if (inputs.foo == 'error') {
              exits("ERROR!");
            } else {
              exits();
            }
          }
        };

    });

    it('should call the default exit using exits()', function(done) {
      M.build(machine)
      .configure({
        foo: 'hello'
      }, {
        "then": function() {done();},
        "else": function(err) {assert(err);done();}
      })
      .exec();
    });

    it('should call the catchall exit using exits("ERROR!")', function(done) {
      M.build(machine)
      .configure({
        foo: 'error'
      }, {
        "then": function() {done();},
        "else": function(err) {assert(err, 'expected `'+err+'` to be truthy');done();}
      })
      .exec();
    });

  });

  describe('with catchallExit defined as custom exit, and no defaultExit', function() {

    var machine;
    before(function() {

      machine = {
          inputs: {
            foo: {
              example: 'foo bar'
            }
          },

          exits: {
            "then": {},
            "else": {}
          },

          catchallExit: "else",

          fn: function (inputs, exits, deps) {
            if (inputs.foo == 'error') {
              exits("ERROR!");
            } else {
              exits();
            }
          }
        };

    });

    it('should call the catchall exit using exits()', function(done) {
      M.build(machine)
      .configure({
        foo: 'hello'
      }, {
        "then": function() {done();},
        "else": function(err) {assert(!err);done();}
      })
      .exec();
    });


  });


});
