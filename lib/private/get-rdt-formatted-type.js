/**
 * Module dependencies
 */

var _ = require('@sailshq/lodash');


/**
 * getRdtFormattedType()
 *
 * @param  {Ref} typeSchema
 * @return {String}            [the RTTC display type (i.e. RDT-formatted type) of the specified type schema]
 */

module.exports = function getRdtFormattedType(typeSchema) {
  if (_.isString(typeSchema)) {
    return typeSchema;
  }
  else {
    return _.isArray(typeSchema)?'array':'dictionary';
  }
};
