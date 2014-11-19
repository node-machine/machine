
/**
 * Machine.buildHaltMachine()
 *
 * A static factory method which returns an anonymous machine whose only
 * purpose is to call its error exit with the specified `errorMsg`.
 *
 * @optional {*} error
 *                 • defaults to an Error object indicating that an unexpected
 *                   error occurred
 *
 * @return {Machine}
 */
module.exports = function Machine_buildHaltMachine (error) {
  var Machine = this;

  error = error || (function buildDefaultHaltError(){
    var DEFAULT_HALT_ERROR = new Error();
    DEFAULT_HALT_ERROR.code = 'E_MACHINE_HALT';
    DEFAULT_HALT_ERROR.message = 'Executed a halt machine';
    return DEFAULT_HALT_ERROR;
  })();

  return Machine.build({
    identity: '_halt',
    fn: function (inputs,exits,dependencies) {
      exits.error(error);
    }
  });
};
