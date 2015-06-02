module.exports = {

  friendlyName: 'Do something',


  description: 'Do a thing (should be <=80 characters written in the imperative mood)',


  extendedDescription: 'Longer description. Markdown syntax supported.',


  cacheable: false,


  sync: true,


  idempotent: true,


  typesafe: true,


  inputs: {
    someInput: require('./input-def.struct')
  },


  exits: {
    someExit: require('./exit-def.struct')
  },


  fn: function (inputs, exits) { /* ... */ }
};
