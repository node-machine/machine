var _ = require('@sailshq/lodash');
var DO_SOMETHING_INSANE_WITH_MANY_BASIC_EXEMPLARS = require('./do-something-insane-with-many-basic-exemplars.fixture');

module.exports = _.extend(
  { sideEffects: 'cacheable' },
  DO_SOMETHING_INSANE_WITH_MANY_BASIC_EXEMPLARS
);
