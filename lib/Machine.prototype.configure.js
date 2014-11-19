
/**
 * [configure description]
 * @param  {[type]} configuredInputs [description]
 * @param  {[type]} configuredExits  [description]
 * @param  {[type]} configuredEnvironment  [description]
 * @chainable
 */
module.exports = function Machine_prototype_configure (configuredInputs, configuredExits, configuredEnvironment) {
  if (configuredExits) {
    this.setExits(configuredExits);
  }
  if (configuredInputs) {
    this.setInputs(configuredInputs);
  }
  if (configuredEnvironment) {
    this.setEnvironment(configuredEnvironment);
  }
  return this;
};

