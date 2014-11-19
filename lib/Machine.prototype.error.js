
/**
 * Trigger an error on this machine.
 *
 * Uses configured `onError` function, or by default,
 * throws whatever was passed in.
 *
 * @chainable
 */

module.exports = function Machine_prototype_error() {

  /**
   * Default `onError` handler
   * @throws {Error}
   */
  (this.onError||function _defaultErrorHandler(err){
    throw err;
  }).apply(this, Array.prototype.slice.call(arguments));

  return this;
};
