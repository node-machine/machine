/**
 * Module dependencies
 */

var _ = require('lodash');
var path = require('path');



/**
 * _searchChildModules()
 *
 * Given a parent module and the name of another module, introspect
 * the `children` property of that parent module to determine the
 * sub-module it required which is most likely to be the one indicated
 * by `subModuleName`.
 *
 * @param {Module} parentModule
 * @param {String} subModuleName
 *
 * @return {Module}
 *
 * @api private
 */
module.exports = function _searchChildModules (parentModule, subModuleName) {

  return _(parentModule.children).max(function rankEachModule (childModule) {
    var _machineLikenessRank = 0;

    // `childModule` is one of the sub-modules required by `parentModule`
    // at some point.

    // Guess the likelihood of this being the correct module
    // by splitting the `id` on slashes and building a certainty
    // score (a % percentage) based on how far to the right-hand-side
    // the `subModuleName` appears as a substring in `childModule.id`
    // (which is usually a path)
    _(path.dirname(childModule.id).split('/'))
    .reverse()
    .each(function (pathPart, i) {
      if (pathPart.match(subModuleName)) {
        _machineLikenessRank += 1.0/(i+1);
      }
      // console.log('(1.0/(i+1) :: ',(1.0/(i+1)));
      // console.log('(parentModule.children*1.0) :: ',(parentModule.children.length*1.0));
    });
    _machineLikenessRank *= 100*(1.0/parentModule.children.length);
    // console.log('I think it is %s% likely that "%s" is the machine you\'re looking for', _machineLikenessRank, childModule.id);
    return _machineLikenessRank;
  }).valueOf();
};
