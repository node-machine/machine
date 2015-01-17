/**
 * Module dependencies
 */

var util = require('util');
var _ = require('lodash');
var Machine = require('../../');



module.exports = function testExitCoercion(options, cb){
  var _inputsInFn;
  var machine = Machine.build({
    inputs: {},
    exits: {
      error: {},
      success: (function _determineExitDefinition(){
        var def = {};
        if (!_.isUndefined(options.example)) {
          def.example = options.example;
        }
        if (!_.isUndefined(options.getExample)) {
          def.getExample = options.getExample;
        }
        if (!_.isUndefined(options.void)) {
          def.void = options.void;
        }
        return def;
      })()
    },
    fn: function (inputs, exits) {
      exits(null, options.actual);
    }
  })
  .exec(function (err, result){
    if (err) return cb(new Error('Unexpected error:'+require('util').inspect(err, false, null)));

    // validate against expected output
    if (!_.isEqual(result, options.result)){
      return cb(new Error('Unexpected result; got:' + util.inspect(result,false, null)));
    }
    return cb();
  });
};
