var _ = require('@sailshq/lodash');
var DO_SOMETHING_INSANE_WITH_MANY_BASIC_EXEMPLARS = require('./do-something-instane-with-many-basic-exemplars');

module.exports = _.extend(
  { sideEffects: 'cacheable' },
  DO_SOMETHING_INSANE_WITH_MANY_BASIC_EXEMPLARS
);
