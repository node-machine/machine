module.exports = {
  friendlyName: 'Do something normal, with quite a few complex exemplars',
  inputs: {
    users: { example: require('./USERS_EXEMPLAR.fixture'), required: true },
    availableSpecies: { example: require('./SPECIES_EXEMPLAR.fixture'), defaultsTo: [] },
    foo: { example: require('./USERS_EXEMPLAR.fixture'), required: true },
    bar: { example: require('./USERS_EXEMPLAR.fixture'), required: true }
  },
  exits: {
    success: { outputExample: require('./USERS_EXEMPLAR.fixture') },
    foo: { outputExample: require('./USERS_EXEMPLAR.fixture') },
    bar: { outputExample: require('./USERS_EXEMPLAR.fixture') },
    uhOh: { outputExample: [{ x: 32, y: 49, z: -238, t: 1464292613806 }] }
  },
  fn: function (inputs, exits) { return exits.success(); }
};
