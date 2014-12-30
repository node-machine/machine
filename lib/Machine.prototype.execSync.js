/**
 * @returns {*} return value through machine's default exit
 */
module.exports = function (){
  this._runningSynchronously = true;

  return 'todo';
};
