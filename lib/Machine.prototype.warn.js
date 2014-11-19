/**
 * Trigger a warning on this machine.
 *
 * Uses configured `onWarn` function, or by default, logs
 * to `console.error`.
 *
 * @chainable
 */

module.exports = function Machine_prototype_warn () {

  /**
   * Default `onWarn` handler
   * @logs {String,String,...}
   */
  (this.onWarn||function _defaultWarnHandler(/*...*/){
    console.error.apply(console, Array.prototype.slice.call(arguments));
  }).apply(this, Array.prototype.slice.call(arguments));

  return this;
};
