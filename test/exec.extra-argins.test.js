/**
 * Module dependencies
 */
var util = require('util');
var assert = require('assert');
var Machine = require('../');


//     ███████╗██╗  ██╗███████╗ ██████╗ ██╗██╗
//     ██╔════╝╚██╗██╔╝██╔════╝██╔════╝██╔╝╚██╗
//     █████╗   ╚███╔╝ █████╗  ██║     ██║  ██║
//     ██╔══╝   ██╔██╗ ██╔══╝  ██║     ██║  ██║
//  ██╗███████╗██╔╝ ██╗███████╗╚██████╗╚██╗██╔╝
//  ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝╚═╝
//
describe('Machine.prototype.exec()', function (){




  //  ██╗    ██╗██╗████████╗██╗  ██╗    ███████╗██╗  ██╗████████╗██████╗  █████╗
  //  ██║    ██║██║╚══██╔══╝██║  ██║    ██╔════╝╚██╗██╔╝╚══██╔══╝██╔══██╗██╔══██╗
  //  ██║ █╗ ██║██║   ██║   ███████║    █████╗   ╚███╔╝    ██║   ██████╔╝███████║
  //  ██║███╗██║██║   ██║   ██╔══██║    ██╔══╝   ██╔██╗    ██║   ██╔══██╗██╔══██║
  //  ╚███╔███╔╝██║   ██║   ██║  ██║    ███████╗██╔╝ ██╗   ██║   ██║  ██║██║  ██║
  //   ╚══╝╚══╝ ╚═╝   ╚═╝   ╚═╝  ╚═╝    ╚══════╝╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝
  //
  //   █████╗ ██████╗  ██████╗ ██╗███╗   ██╗███████╗
  //  ██╔══██╗██╔══██╗██╔════╝ ██║████╗  ██║██╔════╝
  //  ███████║██████╔╝██║  ███╗██║██╔██╗ ██║███████╗
  //  ██╔══██║██╔══██╗██║   ██║██║██║╚██╗██║╚════██║
  //  ██║  ██║██║  ██║╚██████╔╝██║██║ ╚████║███████║
  //  ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝╚═╝  ╚═══╝╚══════╝
  //
  //  ██████╗ ██████╗  ██████╗ ██╗   ██╗██╗██████╗ ███████╗██████╗
  //  ██╔══██╗██╔══██╗██╔═══██╗██║   ██║██║██╔══██╗██╔════╝██╔══██╗
  //  ██████╔╝██████╔╝██║   ██║██║   ██║██║██║  ██║█████╗  ██║  ██║
  //  ██╔═══╝ ██╔══██╗██║   ██║╚██╗ ██╔╝██║██║  ██║██╔══╝  ██║  ██║
  //  ██║     ██║  ██║╚██████╔╝ ╚████╔╝ ██║██████╔╝███████╗██████╔╝
  //  ╚═╝     ╚═╝  ╚═╝ ╚═════╝   ╚═══╝  ╚═╝╚═════╝ ╚══════╝╚═════╝
  //
  //
  describe('when extra configured argins are provided', function () {

    var NM_DEF_FIXTURE = {
      inputs: {
        foo: { example: 'wat', required: true }
      },
      fn: function (inputs, exits){
        exits.success();
      }
    };

    it('should throw a predictable error', function (){
      var m = Machine.build(NM_DEF_FIXTURE);

      try {
        m({ foo: 'bar', owl: 'hoot' }).exec(console.log);
      } catch (e) {
        if (e.code === 'E_USAGE') {
          return;
        }
        else { throw e; }
      }//</catch>
    });

  });//</describe :: when extra configured argins are provided>


  describe('when extra argins are provided with undefined values', function () {

    var NM_DEF_FIXTURE = {
      inputs: {
        foo: { example: 'wat', required: true }
      },
      fn: function (inputs, exits){
        exits.success('ok!');
      }
    };

    it('should throw a predictable error', function (){
      var m = Machine.build(NM_DEF_FIXTURE);
      var result;
      m({ foo: 'bar', owl: undefined }).exec(function(err, result){
        if (err) {throw new Error('Expected a successful run, but got: ' + util.inspect(err, {depth: null}));}
        assert.equal(result, 'ok!');
      });
    });

  });//</describe :: when extra configured argins are provided>


});//</describe :: Machine.prototype.exec()>
