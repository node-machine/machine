/**
 * `machine`
 *
 * @type {Dictionary}
 */

module.exports = {

  // Methods:
  // =====================================================================================================================
  buildCallableMachine: require('./lib/build-callable-machine'),
  loadAndBuildCallableMachines: require('./lib/load-and-build-callable-machines'),

  // Compatibility:
  // =====================================================================================================================
  build: function(){
    console.warn('WARNING: As of v15, `buildCallableMachine()` should be used instead.  (Adjusting for you this time...)');
    module.exports.buildCallableMachine.apply(undefined, arguments);
  },
  pack: function(options){
    console.warn('WARNING: As of v15, `loadAndBuildCallableMachines()` should be used instead.  (Adjusting for you this time...)');
    module.exports.loadAndBuildCallableMachines(options);
  }
};
