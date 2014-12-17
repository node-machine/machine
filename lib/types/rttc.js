/**
 * Run-time type checking. Given a set of typed inputs, ensure the run-time configured
 * inputs are valid.
 */


var _ = require('lodash');
var util = require('util');
var infer = require('./infer');
var types = require('./types');


var coerceValue = function(type, val, flags) {

  var coerceFlag = flags && flags.coerce || false;
  var baseTypeFlag = flags && flags.baseType || false;

  // Map types that are shorthand
  var to = type;
  if(type === 'string') to = 'str';
  if(type === 'boolean') to = 'bool';

  // WARNING: Will throw if the value can't be coerced
  if(!coerceFlag) return val;

  try {

    // If val === undefined lets throw and either error or use the base type
    if(val === undefined) {
      throw new Error('Undefined value');
    }

    val = types[to].to(val);
  }
  catch (e) {
    // If we want the base type for this input catch it here
    if(!baseTypeFlag) throw e;
    val = types[to].base && types[to].base();
  }

  return val;
};

/**
 * Given a tuple value, check it for primatives
 */

var checkTuple = function(type, val) {

  // Check for string
  if(type === 'string') {
    return types.str.is(val);
  }

  // Check for number
  if(type === 'number') {
    return types.number.is(val);
  }

  // Check for boolean
  if(type === 'boolean') {
    return types.bool.is(val);
  }

  return false;
};

/**
 * Given a definition and a values object, ensure our types match up/
 */

var rttc = function(def, val, options) {

  options = options || {};

  // Should the value be coerced into the proper type?
  var coerce = options.coerce || false;

  // If the value can't be coerced should we use the base of the type for the value?
  // ex: NaN gets set as 0
  var baseType = options.base || false;

  // Hold our errors and return them all at once
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

      _value = coerceValue(_input, _value, { coerce: coerce, baseType: baseType });
      var valid = checkTuple(_input, _value);
      if(!valid) {
        var err = new Error();
        err.code = 'E_INVALID_TYPE';
        err.message = 'Invalid input value '+ value;
        throw new Error(err);
      }

      value[key] = _value;
    });

    // Find the difference in the input and the value and remove any keys that
    // exist on the value but not on the input definition.
    var inputKeys = _.keys(input);
    var valueKeys = _.keys(value);
    var invalidKeys = _.difference(valueKeys, inputKeys);

    _.each(invalidKeys, function(key) {
      delete value[key];
    });

    return value;
  };

  // If we don't have an object then just check the tuple
  // If the input type isn't an object or array we can just do a simple type check
  if(!_.isPlainObject(def)) {
    val = coerceValue(def, val, { coerce: coerce, baseType: baseType });
    var valid = checkTuple(def, val);
    if(!valid) {
      var err = new Error();
      err.code = 'E_INVALID_TYPE';
      err.message = util.format(
        'An invalid value was specified. The value ' + val + ' was used \n' +
        'and doesn\'t match the specified type: ' + def
      );
      throw err;
    }

    return val;
  }

  // For each input, ensure the type is valid
  _.each(_.keys(def), function(inputName) {

    var input = def[inputName];
    var value = val[inputName];
    var err = new Error();

    // If the input has a valid flag on it, we don't need to use runtime type checking on
    // it because it has been run through a validate function.
    if(input && input.valid) {
      return;
    }

    // Check if the input is required and missing
    if(types.undefined.is(value)) {

      if (input.required) {
        err.code = 'E_REQUIRED_INPUT';
        err.message = util.format(
          'The input ' + inputName + ' is a required input and no value was specified.'
        );

        errors.push(err);
      }

      return;
    }

    // If the input is an array, parse it for each item
    if(_.isArray(input.type)) {
      if(value && !types.arr.is(value)) {
        err.code = 'E_INVALID_TYPE';
        err.message = util.format(
          'An invalid value was specified. The value ' + value + ' was used \n' +
          'and doesn\'t match the specified type: ' + input.type
        );

        errors.push(err);
        return;
      }

      // If the input is required and the value array is empty, it's an error
      if(input.required && value.length < 1) {
        err.code = 'E_REQUIRED_INPUT';
        err.message = util.format(
          'The input ' + inputName + ' is a required input and no value was specified.'
        );

        errors.push(err);
        return;
      }

      // if the input is a ['*'] this is a typeclass array and we can build a schema
      // based on the first item in the array.
      if(input.type[0] === '*') {
        var type = value.length ? value[0] : 'foo';

        // Infer the type
        var inferred = infer(type);
        input.type = [inferred];
      }

      _.each(value, function(item) {

        // Handle an array of objects
        if(types.obj.is(input.type[0])) {
          try {
            item = parseObject(input.type[0], item);
          }
          catch (err) {
            err.code = 'E_INVALID_TYPE';
            err.message = util.format(
              'An invalid value was specified. The value ' + item + ' was used \n' +
              'and doesn\'t match the specified type: ' + input.type[0]
            );

            errors.push(err);
            return;
          }
        }

        // Handle an array of primative values
        else {
          try {
            item = coerceValue(input.type[0], item, { coerce: coerce, baseType: baseType });
            var valid = checkTuple(input.type[0], item);
            if(!valid) {
              errors.push('Invalid type for input: ' + inputName);
              return;
            }
          }
          catch (e) {
            errors.push(e, inputName);
            return;
          }
        }
      });

      val[inputName] = value;
      return;
    }

    // if the input is an object, recursively parse it
    if(types.obj.is(input.type)) {

      // If the schema is an empty object any object values are allowed to validate
      if(!_.keys(input.type).length) {
        if(_.isPlainObject(value)) return val;
        errors.push('Invalid type for input: ' + inputName);
      }

      try {
        value = parseObject(input.type, value);
      }
      catch (e) {
        errors.push('Invalid type for input: ' + inputName);
        return;
      }

      val[inputName] = value;
      return;
    }

    // If the input type isn't an object or array we can just do a simple type check
    try {

      // If a value is optional and not required and we don't need a baseType then
      // we can just return the undefined value
      if(_.isUndefined(value) && !input.required && !baseType) {
        return;
      }

      value = coerceValue(input.type, value, { coerce: coerce, baseType: baseType });
      var valid = checkTuple(input.type, value);
      if(!valid) {
        errors.push('Invalid type for input: ' + inputName);
        return;
      }
    }
    catch (e) {
      errors.push(e, inputName);
      return;
    }

    val[inputName] = value;
    return;
  });

  if(errors.length) {
    var errs = new Error(errors);
    errs.code = 'E_INVALID_TYPE';
    throw errs;
  }

  // Remove keys not in the schema
  var diff = _.difference(_.keys(val), _.keys(def));
  _.each(diff, function(removeKey) {
    delete val[removeKey];
  });

  return val;
};

module.exports = rttc;
