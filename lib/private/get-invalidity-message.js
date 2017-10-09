/**
 * Module dependencies
 */

var _ = require('@sailshq/lodash');
var rttc = require('rttc');
var getRdtFormattedType = require('./get-rdt-formatted-type');


/**
 * getInvalidityMessage()
 *
 * @param  {Ref} expectedTypeSchema
 * @param  {Ref} invalidData
 * @param  {Error} invalidityErrorFromRttc
 * @param  {String?} optionalDataLabel
 *
 * @return {String}
 *
 */
module.exports = function getInvalidityMessage(expectedTypeSchema, invalidData, invalidityErrorFromRttc, optionalDataLabel){

  var isExpectingArrayAndGotIt = _.isArray(invalidData)&&_.isArray(expectedTypeSchema);
  var isExpectingDictionaryAndGotIt = _.isObject(invalidData)&&!_.isArray(invalidData)&&_.isObject(expectedTypeSchema)&&!_.isArray(expectedTypeSchema);

  var originNounPhrase;
  if (optionalDataLabel) {
    originNounPhrase = ''+optionalDataLabel+''+(isExpectingArrayAndGotIt||isExpectingDictionaryAndGotIt?' '+rttc.getDisplayTypeLabel(getRdtFormattedType(expectedTypeSchema), {capitalization: 'fragment'}):'');
  }
  else {
    originNounPhrase = rttc.getDisplayType(invalidData);
  }

  return 'Invalid '+originNounPhrase+':\n  · ' + (
    _.without(_.map(invalidityErrorFromRttc.errors, function(subErr) {
      if (subErr.hops.length === 0) {
        var actualTopLvlType = rttc.inferDisplayType(rttc.coerceExemplar(subErr.actual));
        return (
          subErr.actual===undefined?
          'Expecting'
          :
          'Expecting'
        )+' '+rttc.getNounPhrase(getRdtFormattedType(subErr.expected), {determiner: 'a'})
        +(
          subErr.actual===undefined?
          '.'
          :
          ', but got '+(
            actualTopLvlType==='json'?
            'some other '+rttc.getNounPhrase(actualTopLvlType,{determiner: '', capitalization: 'fragment'})
            :
            rttc.getNounPhrase(actualTopLvlType,{determiner: 'a', capitalization: 'fragment'})
          )+'.'
        );
      }
      else {
        var parentHopsHash = subErr.hops.slice(0, -1).join('.');
        var parentSubErr = _.find(invalidityErrorFromRttc.errors, function(otherSubErr){
          return otherSubErr.hops.join('.') === parentHopsHash;
        });
        if (parentSubErr) { return ''; }

        var isArrayItem = !_.isNaN(+(subErr.hops.slice(-1)[0]));
        var expectedRdt = getRdtFormattedType(subErr.expected);
        var actualType = rttc.inferDisplayType(rttc.coerceExemplar(subErr.actual));
        return (
          isArrayItem?
          '@ `'+parentHopsHash+'['+(subErr.hops.slice(-1))+']`:  '
          :
          '@ `' + subErr.hops.join('.') + '`:  '
        )+''+
        (
          subErr.actual===undefined?
          'Missing property (expecting '+rttc.getNounPhrase(expectedRdt, {determiner:'a'})+')'
          :
          'Expecting '+(
            isArrayItem?
            'array to contain only '+rttc.getNounPhrase(expectedRdt, {plural: true, determiner:''})
            :
            ''+rttc.getNounPhrase(expectedRdt, {determiner:'a'})
          )
        )+''+
        (
          subErr.actual===undefined?
          '.'
          :
          ', but '+
          (
            isArrayItem?
            'at least one item is '+(
              actualType==='json'?
              'some other '+rttc.getNounPhrase(actualType,{determiner: '', capitalization: 'fragment'})
              :
              rttc.getNounPhrase(actualType,{determiner: 'a', capitalization: 'fragment'})
            )
            :
            'got '+(
              actualType==='json'?
              'some other '+rttc.getNounPhrase(actualType,{determiner: '', capitalization: 'fragment'})
              :
              rttc.getNounPhrase(actualType,{determiner: 'a', capitalization: 'fragment'})
            )
          )+'.'
        );
      }
    }), '').join('\n  · ')
  );

};
