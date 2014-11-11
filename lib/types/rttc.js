/**
 * Run-time type checking. Given a set of typed inputs, ensure the run-time configured
 * inputs are valid.
 */


var _ = require('lodash');
var types = require('./types');

/**
 * Given a tuple value, check it for primatives
 */

var checkTuple = function(type, val, coerceFlag) {

  // WARNING: Will throw if the value can't be coerced
  var coerce = function(to) {
    if(!coerceFlag) return;
    val = types[to].to(val);
  }

  // Check for string
  if(type === 'string') {
    coerce('str');
    return types.str.is(val);
  }

  // Check for number
  if(type === 'number') {
    coerce('number');
    return types.number.is(val);
  }

  // Check for boolean
  if(type === 'boolean') {
    coerce('bool');
    return types.bool.is(val);
  }

  return false;
};

/**
 * Given a definition and a values object, ensure our types match up/
 */

var rttc = function(def, val, options) {

  options = options || {};
  var coerce = options.coerce || false;
  var errors = [];

  var parseObject = function(input, value) {
    _.each(_.keys(input), function(key) {
      var _input = input[key];
      var _value = value[key];

      // If the input is an object continue recursively parsing it
      if(types.obj.is(_input)) {
        parseObject(_input, _value);
        return;
      }

      var valid = checkTuple(_input, _value, coerce)
      if(!valid) {
        throw new Error('Invalid input value ', value);
      }

    });

    // Find the difference in the input and the value and remove any keys that
    // exist on the value but not on the input definition.
    var inputKeys = _.keys(input);
    var valueKeys = _.keys(value);
    var invalidKeys = _.difference(valueKeys, inputKeys);

    _.each(invalidKeys, function(key) {
      delete value[key];
    });
  };


  // For each input, ensure the type is valid
  _.each(_.keys(def), function(inputName) {
    var input = def[inputName];
    var value = val[inputName];

    // Check if the input is required and missing
    if(input.required && types.undefined.is(value)) {
      errors.push('Missing required input: ' + inputName);
      return;
    }

    // If type if not required and is undefined, return
    if(types.undefined.is(value)) {
      return;
    }

    // If the input is an array, parse it for each item
    if(_.isArray(input.type)) {
      if(value && !types.arr.is(value)) {
        errors.push('Invalid type for input: ' + inputName);
        return;
      }

      _.each(value, function(item) {
        try {
          parseObject(input.type[0], item);
          return;
        } catch (err) {
          errors.push('Invalid type for input: ' + inputName);
          return;
        }
      });

      return;
    }

    // If the input is an object, recursively parse it
    if(types.obj.is(input.type)) {

      try {
        parseObject(input.type, value);
        return;
      } catch (err) {
        errors.push('Invalid type for input: ' + inputName);
        return;
      }
    }

    // If the input type isn't an object or array we can just do a simple type check
    try {
      var valid = checkTuple(input.type, value, coerce)
      if(!valid) {
        errors.push('Invalid type for input: ' + inputName);
      }
      return;
    }
    catch (e) {
      errors.push(e, inputName);
      return;
    }

  });

  if(errors.length) {
    throw new Error(errors);
  }

};

module.exports = rttc;
