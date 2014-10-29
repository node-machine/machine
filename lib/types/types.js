/**
 * Basic type definitions.
 *
 * Roughly based on https://github.com/bishopZ/Typecast.js
 */

var _ = require('lodash');

// Helper functions
var value = function(v) {
  return function() { return v; };
};

var compare = function(v1) {
  return function(v2) { return v1 === v2; };
};


var type = {

  // NaN
  nan: {
    is: _.isNaN,
    to: value(NaN)
  },

  // Null
  'null': {
    is: _.isNull,
    to: value(null)
  },

  // Undefined
  'undefined': {
    is: _.isUndefined,
    to: value(undefined)
  },

  // Boolean
  bool: {
    is: _.isBoolean,
    to: function(v) {
      return (/^true$/i).test(v);
    }
  },

  // Defined
  defined: {
    is: function(v) {
      return !( type.nan(v) || type.undefined(v) || type.null(v) );
    },
    to: function(v) {
      return (type.def(v)) ? v : true;
    }
  },

  // Integer
  'int': {
    is: function(v) { return (v % 1 === 0); },
    to: function(v) {
      var value = parseInt(v, 10);
      if (!isNaN(value)) return value;
      return 1;
    },
  },

  // String
  str: {
    is: _.isString,
    to: function(v) {
      if(type.defined.is(v)) return String(v);
      return '';
    },
  },

  // Object
  obj: {
    is: function(v) {
      return _.isObject(v) && !type.arr.is(v);
    }
  },

  // Array
  arr: {
    is: _.isArray,
    to: function(v) {
      return _.toArray(v);
    },
  },

  // Date
  'date': {
    is: _.isDate,
    to: function(v) {
      return new Date(v);
    }
  },

  // Numeric
  'number': {
    is: function(v) {
      return _.isNumber(v) && !type.nan.is(parseFloat(v));
    },
    to: function(v) {
      if(type.num.is(v)) return v;
      if(type.bool.is(v)) return v ? 1 : 0;
      if(type.str.is(v)) {
        var num = v * 1 || 0;
        return (num === 0 && !v.match(/^0+$/)) ? 0 : num;
      }
      return 0;
    }
  },

};

module.exports = type;
