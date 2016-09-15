/*
 * getFilepathFromStackEntry()
 *
 * Given a stack entry (as a string) return the filename
 * present in the entry.
 *
 */

module.exports = function(stackEntry) {
  var match = stackEntry.match(/at (?:(\S+)\s+(?:\[as [^\]]+\]\s+)?)?\(?(?:(.+?):(\d+):(\d+)|([^)]+))\)?/);
  if (match && match[2]) {return match[2];}
  return '';
};
