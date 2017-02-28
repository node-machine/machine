/**
 * Module dependenices
 */

var _ = require('@sailshq/lodash');


/**
 * `Machine.prototype.demuxSync()`
 *
 * Run this machine's `fn`, then return `true` if it worked.  Otherwise, return `false`.
 *
 *
 * @optional {String} exitName
 *           The name of the exit to expect. (i.e. for which this function will return `true`)
 *           Defaults to "success".
 *
 * @returns {Boolean} `true` if machine triggers the desired exit, `false` otherwise.
 * @throws {E_USAGE} If `demuxSync()` cannot be used (i.e. because this machine does not declare `sync: true`)
 *
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * > Warning: this function is experimental and its usage may change!
 * >
 * > (To check for current usage in other core utilities / experimental tooling,
 * >  see https://github.com/search?utf8=%E2%9C%93&q=demuxSync+user%3Abalderdashy+user%3Asailsjs+user%3Anode-machine+user%3Atreelinehq+user%3Amikermcneil&type=Code&ref=searchresults)
 */
module.exports = function demuxSync(exitName){

  try {
    this.execSync();
  }
  catch (e) {
    switch (e.exit) {
      case 'error':
      case undefined:
        switch (e.code) {
          case 'E_USAGE': throw e;
          default:
            // If `code` is not explicitly recognized as any kind of internal error
            // about generic usage (userland code's fault) or a malformed definition
            // (machine impl code's fault), then we can just assume this is some
            // miscellaneous runtime error that was thrown from the machine's error
            // exit.
        }
        break;

      default:
        // Otherwise, this machine exited through some miscellaneous exit,
        // so we don't have to negotiate the error any further.
    }
  }

  // Desired exit defaults to `success`.
  if (_.isUndefined(exitName)) {
    exitName = 'success';
  }
  else {
    if (!_.isString(exitName)) {
      throw new Error('Invalid usage of `.demuxSync()`: if an argument is provided, it must be a string (the name of an exit)');
    }
    if ( ! _.contains(_.keys(this.exits), exitName) ){
      throw new Error('Invalid usage of `.demuxSync()`: provided exit name must match a known exit of this machine');
    }
  }
  return (this._exited === exitName);

};
