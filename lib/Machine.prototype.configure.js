/**
 * Module dependencies
 */

// N/A

/**
 * .configure()
 *
 * Configure a live machine instance with argins (runtime values for its inputs).
 *
 * @param  {Dictionary?} argins
 * @param  {Dictionary?} cbs
 * @param  {Dictionary?} envToSet
 *
 * @returns {LiveMachine}
 * @chainable
 */
module.exports = function Machine_prototype_configure (argins, cbs, envToSet) {
  if (cbs) {
    this.setExits(cbs);
  }
  if (argins) {
    this.setInputs(argins);
  }
  if (envToSet) {
    this.setEnv(envToSet);
  }
  return this;
};

