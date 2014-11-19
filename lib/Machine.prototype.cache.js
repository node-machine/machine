/**
 * Provide cache settings.
 * @param  {Object} cacheSettings
 * @chainable
 */

module.exports = function Machine_prototype_cache (cacheSettings) {
  this._cacheSettings = _.extend(this._cacheSettings||{}, _.cloneDeep(cacheSettings));
  return this;
};
