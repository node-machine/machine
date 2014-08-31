
/**
 * [configure description]
 * @param  {[type]} configuredInputs [description]
 * @param  {[type]} configuredExits  [description]
 * @param  {[type]} configuredScope  [description]
 * @chainable
 */
module.exports = function Machineºprototypeºconfigure (configuredInputs, configuredExits, configuredScope) {
  if (configuredExits) {
    this.setExits(configuredExits);
  }
  if (configuredInputs) {
    this.setInputs(configuredInputs);
  }
  if (configuredScope) {
    this.setContexts(configuredScope);
  }
  return this;
};

