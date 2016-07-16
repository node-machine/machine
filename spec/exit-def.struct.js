module.exports = {
  friendlyName: 'Unrecognized flavors',
  description: 'Could not recognize one or more of the provided `flavorStrings`.', // >> A short explanation of what it means if the machine's `fn` calls this exit at runtime.  Written as a post-mortem analysis (past tense).
  extendedDescription: 'Some **markdown**.', // >> Like any other `extendedDescription`, supports markdown.
  moreInfoUrl: 'http://gummyworms.com/flavors',
  outputFriendlyName: 'Unrecognized flavors', // >> e.g. if var name would normally be `unrecognizedFlavors`
  outputDescription: 'A list of invalid gummy worm flavors.', // >> noun phrase
  example: '===' // >> an example schema describing the output (technically, an RTTC exemplar schema).  Omit this property to indicate no output.
};
