/**
 * Module dependencies
 */

var _ = require('@sailshq/lodash');
var flaverr = require('./private/flaverr');


/**
 * `Machine.prototype.cache()`
 *
 * Provide cache settings.
 * @param  {Dictionary} cacheSettings
 * @chainable
 */

module.exports = function cache(cacheSettings) {

  // Caching is only allowed on machines which explicitly identify themselves as cacheable.
  // Prevent .cache() usage in this case.
  if (!this.cacheable) {
    throw flaverr('E_USAGE', new Error('Cannot use `.cache()` with `'+this.identity+'` machine because it does not consider itself cacheable (i.e. `cacheable:true`)'));
  }

  this._willCache = true;
  this._cacheSettings = _.extend(this._cacheSettings||{}, _.cloneDeep(cacheSettings));
  return this;
};
