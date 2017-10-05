/**
 * Module dependencies
 */

// N/A



/**
 * getIsProductionWithoutDebug()
 *
 * Make a guess (`isProduction`) as to whether or not we're dealing with a production environment.
 *
 * > Note that if this is being run from a browser environment, or if the DEBUG environment var is truthy,
 * > this always returns as `false`.  (This is to allow for easier debugging in production environments.)
 *
 * @returns {Boolean}
 */

module.exports = function getIsProductionWithoutDebug(){
  var _isDebugNodeEnv = typeof process !== 'undefined' && process.env.DEBUG;// eslint-disable-line no-undef
  var _isProductionNodeEnv = typeof process !== 'undefined' && process.env.NODE_ENV === 'production';// eslint-disable-line no-undef
  var _isProductionWindow = typeof window !== 'undefined' && window.environment === 'production';// eslint-disable-line no-undef
  return (_isProductionNodeEnv || _isProductionWindow) && !_isDebugNodeEnv;
};
