module.exports = {
  friendlyName: 'Do something normal',
  inputs: {
    flavor: { example: 'stuff', required: true },
    qty: { example: 38, defaultsTo: 1 },
    foo: { example: 'stuff', required: true },
    bar: { example: 'stuff', required: true },
  },
  exits: {
    success: { outputExample: 'stuff' },
    foo: { outputExample: 'stuff' },
    bar: { outputExample: 'stuff' },
    uhOh: {
      outputExample: ['things']
    }
  },
  fn: function (inputs, exits) { return exits.success(); }
};
