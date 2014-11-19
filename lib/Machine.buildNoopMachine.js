
/**
 * Machine.buildNoopMachine()
 *
 * A static factory method which returns an anonymous machine whose only
 * purpose is to call its success exit.
 *
 * @return {Machine}
 */
module.exports = function Machine_buildNoopMachine() {
  var Machine = this;
  return Machine.build({
    identity: '_noop',
    fn: function (inputs,exits,dependencies) {
      exits.success();
    }
  });
};
