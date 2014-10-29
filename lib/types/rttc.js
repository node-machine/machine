/**
 * Run time type checking
 */

var _ = require('lodash');
var types = require('./types');

module.exports = {

  /**
   * Given a value and type, cast the value to the correct type.
   */

  cast: function(value, type) {

    var castType = types[type];

    if(!castType) {
      throw new Error('Invalid type definition');
    }

    return castType.to(value);
  },


  /**
   * Check to ensure a value is of a certain type
   */

  check: function(value, type) {

    var castType = types[type];

    if(!castType) {
      throw new Error('Invalid type definition');
    }

    return castType.is(value);
  },

  /**
   * Given an example attempt to infer the type or interface
   */

  infer: function(example) {

    /**
     * Given a tuple value, check it for primatives
     */

    var checkTuple = function(val) {

      var type;

      // Check for string
      if(types.str.is(val)) type = 'string';

      // Check for integer
      if(types.int.is(val)) type = 'integer';

      // Check for boolean
      if(types.bool.is(val)) type = 'boolean';

      return type;
    };

    // If the example isn't an object or array we can run through the primatives and see
    // if any match.
    if(!types.obj.is(example) && !types.arr.is(example)) {
      return checkTuple(example);
    }

    // If the example is an array, figure out what to do. For now just check that it's an array
    if(types.arr.is(example)) {
      return 'array';
    }

    // If the example is an object, recursively loop through it defining the types
    var parseObject = function(obj) {
      if(!types.obj.is(obj)) return;

      _.each(_.keys(obj), function(key) {
        var val = obj[key];
        var type;

        if(types.arr.is(val)) type = 'array';
        if(types.obj.is(val)) return parseObject(val);
        type = checkTuple(val);
        obj[key] = type;
      });

      return obj;
    };

    type = parseObject(example);
    return type;
  }

};
