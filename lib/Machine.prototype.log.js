/**
 * Trigger a log on this machine.
 *
 * Uses configured `onLog` function, or by default, logs
 * to `console.log`.
 *
 * @chainable
 */

module.exports = function Machine_prototype_log () {

  /**
   * Default `onLog` handler
   * @logs {String,String,...}
   */
  (this.onLog||function _defaultLogHandler(/*...*/){
    console.log.apply(console, Array.prototype.slice.call(arguments));
  }).apply(this, Array.prototype.slice.call(arguments));

  return this;
};
