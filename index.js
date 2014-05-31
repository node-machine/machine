// Set default require context for loading machine definitions/dependencies
// (i.e. the module that required `node-machine`)

var Machine = require('./lib/Machine');
Machine._requireCtx = Machine._requireCtx || module.parent;
module.exports = Machine;
