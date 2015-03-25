/**
 * Module dependencies
 */

var _ = require('lodash');



/**
 * Provide cache settings.
 * @param  {Object} cacheSettings
 * @chainable
 */

module.exports = function Machine_prototype_cache (cacheSettings) {

  // Caching is only allowed on machines which explicitly identify themselves as cacheable.
  // Prevent .cache() usage in this case.
  if (!this.cacheable) {
    throw (function (){
      var _err = new Error('Cannot use `.cache()` with `'+this.identity+'` machine because it does not consider itself cacheable (i.e. `cacheable:true`)');
      _err.code = 'E_USAGE';
      _err.status = 400;
      return _err;
    })();
  }

  this._willCache = true;
  this._cacheSettings = _.extend(this._cacheSettings||{}, _.cloneDeep(cacheSettings));
  return this;
};
