module.exports = {

  friendlyName: 'Do something',


  description: 'Do a thing (should be <=80 characters written in the imperative mood)',


  extendedDescription: 'Longer description. Markdown syntax supported.',


  cacheable: false,


  sync: true,


  idempotent: true,


  // The `typesafe` flag is disabled by default.  If a machine is `typesafe`,
  // that means it will run in "unsafe mode" (unless overridden in userland).
  //
  // That means:
  //  1. Its configured input values will not be cloned before exec()ing the fn.
  //  2. Its outputs will not be cloned before being passed back to the user.
  //
  // So if a machine sets this flag, it is guaranteeing that:
  //  1. The machine's `fn` will never throw in a callback, EVEN if a completely wrong
  //     input value is provided, or a required value is omitted. (TODO: reconsider--
  //     this is a pretty restrictive requirement. Could do some really cheap,
  //     surface-level validation of inputs when `typesafe` is enabled.  That would
  //     loosen this up a bit without any significant performance cost)
  //  2. The machine's `fn` will output values exactly according to the type schema
  //     inferred from its exit example.
  //  3. The machine does not mutate any of the provided input values inside its `fn`.
  //  4. The user has exclusive access to its outputs-- that is, they may be mutated
  //     by the user without causing any terrible side-effects.  That means they are
  //     either primitive values, or objects that were constructed within the `fn`
  //     itself, and are used nowhere else.
  typesafe: true,


  inputs: {
    someInput: require('./input-def.struct')
  },


  exits: {
    someExit: require('./exit-def.struct')
  },


  fn: function (inputs, exits) { /* ... */ }
};
