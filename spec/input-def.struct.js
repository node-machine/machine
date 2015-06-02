module.exports = {
  friendlyName: 'Some input',
  description: 'The brand of gummy worms.',
  extendedDescription: 'The provided value will be matched against all known gummy worm brands.  The match is case-insensitive, and tolerant of typos within Levenstein edit distance <= 2 (if ambiguous, prefers whichever brand comes first alphabetically)',
  moreInfoUrl: 'http://gummy-worms.org/common-brands?countries=all',
  whereToGet: {
    description: 'Look at the giant branding on the front of the package.  Copy and paste with your brain.',
    extendedDescription: 'If you don\'t have a package of gummy worms handy, this probably isn\'t the machine for you.  Check out the `order()` machine in this pack.',
    url: 'http://gummy-worms.org/how-to-check-your-brand'
  },
  example: 'haribo',
  required: true
};
