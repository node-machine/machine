/**
 * Module dependencies
 */

// N/A



/**
 * getIsProduction()
 *
 * Make a guess (`isProduction`) as to whether or not we're dealing with a production environment.
 *
 * @returns {Boolean}
 */

module.exports = function getIsProduction(){
  var _isProductionNodeEnv = typeof process !== 'undefined' && process.env.NODE_ENV === 'production';// eslint-disable-line no-undef
  var _isProductionWindow = typeof window !== 'undefined' && window.environment === 'production';// eslint-disable-line no-undef
  return _isProductionNodeEnv || _isProductionWindow;
};
