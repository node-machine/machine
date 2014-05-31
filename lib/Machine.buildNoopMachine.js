
/**
 * Machine.buildNoopMachine()
 *
 * A static factory method which returns an anonymous machine whose only
 * purpose is to call its success exit.
 *
 * @return {Machine}
 */
module.exports = function MachineºbuildNoopMachine() {
  var Machine = this;
  return Machine.build({
    id: '_noop',
    fn: function (inputs,exits,dependencies) {
      exits.success();
    }
  });
};
