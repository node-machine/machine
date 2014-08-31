/**
 * Provide cache settings.
 * @param  {Object} cacheSettings
 * @chainable
 */

module.exports = function Machineºprototypeºcache (cacheSettings) {
  this._cacheSettings = _.extend(this._cacheSettings||{}, _.cloneDeep(cacheSettings));
  return this;
};
