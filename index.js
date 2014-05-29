var Promise = require('bluebird')
module.exports = Machine

function Machine(fn) {
  return function () {
    return Promise.try(fn, Array.prototype.slice.call(arguments))
  }
}

Machine.Err = function (str) {
  return function (err) {
    return err && err.name === str
  }
}
