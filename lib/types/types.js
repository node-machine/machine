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
      if(_.isBoolean(v)) return v;
      if(v === 'true') return true;
      if(v === 'false') return false;
      if(v === 1) return true;
      if(v === 0) return false;
      if(v === '1') return true;
      if(v === '0') return false;

      throw new Error('E_runtimeInputTypeCoercionError');
    },
    base: false
  },

  // Defined
  defined: {
    is: function(v) {
      return !( type.nan.is(v) || type.undefined.is(v) || type.null.is(v) );
    },
    to: function(v) {
      return (type.defined.is(v)) ? v : true;
    }
  },

  // Integer
  'int': {
    is: function(v) { return (v == v + 0 && v == ~~v); },
    to: function(v) {
      var value = parseInt(v, 10);
      if (!isNaN(value)) return value;
      return 1;
    },
    base: 0
  },

  // String
  str: {
    is: _.isString,
    to: function(v) {

      if(_.isString(v)) return v;

      if(v instanceof Function) {
        throw new Error('E_runtimeInputTypeCoercionError');
      }

      if(_.isDate(v)) {
        throw new Error('E_runtimeInputTypeCoercionError');
      }

      if(v instanceof Function) {
        throw new Error('E_runtimeInputTypeCoercionError');
      }

      if(v instanceof Object) {
        throw new Error('E_runtimeInputTypeCoercionError');
      }

      if(v instanceof Array) {
        throw new Error('E_runtimeInputTypeCoercionError');
      }

      if(v === Infinity) {
        throw new Error('E_runtimeInputTypeCoercionError');
      }

      if(v === NaN) {
        throw new Error('E_runtimeInputTypeCoercionError');
      }

      if(v === null) {
        throw new Error('E_runtimeInputTypeCoercionError');
      }

      if(type.defined.is(v)) return String(v);
      return '';
    },
    base: ''
  },

  // Object
  obj: {
    is: function(v) {
      return _.isObject(v) && !type.arr.is(v);
    },
    to: function(v) {
      return {};
    },
    base: {}
  },

  // Array
  arr: {
    is: _.isArray,
    to: function(v) {
      return _.toArray(v);
    },
    base: []
  },

  // Date
  'date': {
    is: _.isDate,
    to: function(v) {
      return new Date(v);
    },
    base: new Date()
  },

  // Numeric
  'number': {
    is: function(v) {
      return _.isNumber(v) && !type.nan.is(parseFloat(v));
    },
    to: function(v) {

      // Check for Infinity
      if(v === Infinity) {
        throw new Error('E_runtimeInputTypeCoercionError');
      }

      if(type.number.is(v)) return v;
      if(type.bool.is(v)) return v ? 1 : 0;
      if(type.str.is(v)) {

        // Check for Infinity
        if(v === 'Infinity') {
          throw new Error('E_runtimeInputTypeCoercionError');
        }

        var num = v * 1;
        if(!_.isNumber(num)) {
          throw new Error('E_runtimeInputTypeCoercionError');
        }

        return (num === 0 && !v.match(/^0+$/)) ? 0 : num;
      }

      throw new Error('E_runtimeInputTypeCoercionError');
    },
    base: 0
  },

};

module.exports = type;
