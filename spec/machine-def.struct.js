module.exports = {

  friendlyName: 'Do something',


  description: 'Do a thing (should be <=80 characters written in the imperative mood)',


  extendedDescription: 'Longer description. Markdown syntax supported.',


  moreInfoUrl: 'http://hello.com',


  sideEffects: 'idempotent', // either omit or set as "cacheable" or "idempotent"


  habitat: 'sails', // either omit or set as "request" or "sails"


  sync: true, // either omit or set as `true`


  inputs: {

    someInput: require('./input-def.struct')

  },


  exits: {

    someExit: require('./exit-def.struct')

  },


  fn: function (inputs, exits) {

    var _ = require('@sailshq/lodash');

    setTimeout(function (){

      try {

        var luckyNum = Math.random();
        if (luckyNum > 0.5) {
          throw new Error('whatever');
        }
        else if (luckyNum < 0.1) {
          // Exit `someExit` with no output.
          return exits.someExit();
          // > NOTE:
          // > To send back output, could have done:
          // > ```
          // > return exits.someExit(luckyNum);
          // > ```
          // > (^^but if so, we would need to define an `outputExample` in our `someExit` definition!)
        }

      } catch (e) { return exits.error(e); }

      // --• OK so if we made it here, `luckyNum` must be between 0.1 and 0.5 (exclusive).

      // Exit `success` with no output.
      return exits.success();
      // > NOTE:
      // > To send back output, could have done:
      // > ```
      // > return exits.success(luckyNum);
      // > ```
      // > (^^but if so, we would need to define `success` exit with an `outputExample`!)

    }, 500);//</setTimeout>
  }


};
