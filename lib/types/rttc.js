/**
 * Run time type checking
 */

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
  }

};
