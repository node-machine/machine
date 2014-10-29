/**
 * Infer a primative type from an example.
 */

var _ = require('lodash');
var types = require('./types');

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


/**
 * Recursively parse an object to set tuple types
 *
 * @param {Object} obj
 */

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


/**
 * Given an example, parse it to infer it's primitive type
 */

var infer = function(example) {

  // If the example isn't an object or array we can run through the primatives and see
  // if any match.
  if(!types.obj.is(example) && !types.arr.is(example)) {
    return checkTuple(example);
  }

  // If the example is an array, figure out what to do. For now just check that it's an array
  if(types.arr.is(example)) {
    return 'array';
  }

  // Otherwise parse the objec
  return parseObject(example);

};

module.exports = infer;
