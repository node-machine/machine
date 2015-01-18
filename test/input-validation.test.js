/**
 * Module dependencies
 */

var util = require('util');
var _ = require('lodash');
var testInputValidation = require('./helpers/test-input-validation.helper');
var Readable = require('stream').Readable;



describe('input validation/coercion', function (){

  var INPUT_TEST_SUITE = [


    ////////////////////////////////////////////
    // STRINGS
    ////////////////////////////////////////////

    { example: 'foo', actual: 'bar', result: 'bar' },
    { example: 'foo', actual: '', result: '' },

    { example: 'foo', actual: 0, result: '0' },
    { example: 'foo', actual: 1, result: '1' },
    { example: 'foo', actual: -1.1, result: '-1.1' },

    { example: 'foo', actual: true, result: 'true' },
    { example: 'foo', actual: false, result: 'false' },

    { example: 'foo', actual: {}, error: true },
    { example: 'foo', actual: {foo:'bar'}, error: true },
    { example: 'foo', actual: {foo:{bar:{baz:{}}}}, error: true },
    { example: 'foo', actual: {foo:['bar']}, error: true },
    { example: 'foo', actual: {foo:{bar:{baz:[{}]}}}, error: true },

    { example: 'foo', actual: [], error: true },
    { example: 'foo', actual: ['asdf'], error: true },
    { example: 'foo', actual: [''], error: true },
    { example: 'foo', actual: [235], error: true },
    { example: 'foo', actual: [false], error: true },
    { example: 'foo', actual: [{}], error: true },
    { example: 'foo', actual: [{foo:'bar'}], error: true },

    { example: 'foo', actual: undefined, result: undefined },

    { example: 'foo', actual: NaN, error: true },
    { example: 'foo', actual: Infinity, error: true },
    { example: 'foo', actual: -Infinity, error: true },
    { example: 'foo', actual: null, error: true },

    { example: 'foo', actual: /some regexp/, error: true },
    { example: 'foo', actual: function(){}, error: true },
    { example: 'foo', actual: new Date('November 5, 1605'), result: '1605-11-05T07:00:00.000Z' },
    { example: 'foo', actual: new Readable(), error: true },
    { example: 'foo', actual: new Buffer('asdf'), error: true },
    { example: 'foo', actual: new Error('asdf'), error: true },

    ////////////////////////////////////////////
    // NUMBERS
    ////////////////////////////////////////////

    { example: 123, actual: 'bar', error: true },
    { example: 123, actual: '', error: true },
    { example: 123, actual: '0', result: 0 },
    { example: 123, actual: '1', result: 1 },
    { example: 123, actual: '-1.1', result: -1.1 },
    { example: 123, actual: 'NaN', error: true },
    { example: 123, actual: 'undefined', error: true },
    { example: 123, actual: 'null', error: true },
    { example: 123, actual: '-Infinity', error: true },
    { example: 123, actual: 'Infinity', error: true },

    { example: 123, actual: 0, result: 0 },
    { example: 123, actual: 1, result: 1 },
    { example: 123, actual: -1.1, result: -1.1 },

    { example: 123, actual: true, result: 1 },
    { example: 123, actual: false, result: 0 },

    { example: 123, actual: {}, error: true },
    { example: 123, actual: {foo:'bar'}, error: true },
    { example: 123, actual: {foo:{bar:{baz:{}}}}, error: true },
    { example: 123, actual: {foo:['bar']}, error: true },
    { example: 123, actual: {foo:{bar:{baz:[{}]}}}, error: true },

    { example: 123, actual: [], error: true },
    { example: 123, actual: ['asdf'], error: true },
    { example: 123, actual: [''], error: true },
    { example: 123, actual: [235], error: true },
    { example: 123, actual: [false], error: true },
    { example: 123, actual: [{}], error: true },
    { example: 123, actual: [{foo:'bar'}], error: true },

    { example: 123, actual: undefined, result: undefined },

    { example: 123, actual: NaN, error: true },
    { example: 123, actual: Infinity, error: true },
    { example: 123, actual: -Infinity, error: true },
    { example: 123, actual: null, error: true },

    { example: 123, actual: /some regexp/, error: true },
    { example: 123, actual: function(){}, error: true },
    { example: 123, actual: new Date('November 5, 1605'), error: true },
    { example: 123, actual: new Readable(), error: true },
    { example: 123, actual: new Buffer('asdf'), error: true },
    { example: 123, actual: new Error('asdf'), error: true },

    ////////////////////////////////////////////
    // BOOLEANS
    ////////////////////////////////////////////
    { example: true, actual: 'bar', error: true },
    { example: true, actual: '', error: true },
    { example: true, actual: '-1.1', error: true },
    { example: true, actual: 'NaN', error: true },
    { example: true, actual: 'undefined', error: true },
    { example: true, actual: 'null', error: true },
    { example: true, actual: '-Infinity', error: true },
    { example: true, actual: 'Infinity', error: true },
    { example: true, actual: 'true', result: true },
    { example: true, actual: 'false', result: false },
    { example: true, actual: '0', result: false },
    { example: true, actual: '1', result: true },

    { example: true, actual: 0, result: false },
    { example: true, actual: 1, result: true },
    { example: true, actual: -1.1, error: true },

    { example: true, actual: true, result: true },
    { example: true, actual: false, result: false },

    { example: true, actual: {}, error: true },
    { example: true, actual: {foo:'bar'}, error: true },
    { example: true, actual: {foo:{bar:{baz:{}}}}, error: true },
    { example: true, actual: {foo:['bar']}, error: true },
    { example: true, actual: {foo:{bar:{baz:[{}]}}}, error: true },

    { example: true, actual: [], error: true },
    { example: true, actual: ['asdf'], error: true },
    { example: true, actual: [''], error: true },
    { example: true, actual: [235], error: true },
    { example: true, actual: [false], error: true },
    { example: true, actual: [{}], error: true },
    { example: true, actual: [{foo:'bar'}], error: true },

    { example: true, actual: undefined, result: undefined },

    { example: true, actual: NaN, error: true },
    { example: true, actual: Infinity, error: true },
    { example: true, actual: -Infinity, error: true },
    { example: true, actual: null, error: true },

    { example: true, actual: /some regexp/, error: true },
    { example: true, actual: function(){}, error: true },
    { example: true, actual: new Date('November 5, 1605'), error: true },
    { example: true, actual: new Readable(), error: true },
    { example: true, actual: new Buffer('asdf'), error: true },
    { example: true, actual: new Error('asdf'), error: true },

    ////////////////////////////////////////////
    // DICTIONARIES
    ////////////////////////////////////////////

    { example: {}, actual: 'bar', error: true },
    { example: {}, actual: 123, error: true },
    { example: {}, actual: true, error: true },

    { example: {}, actual: {}, result: {} },
    { example: {}, actual: {foo:'bar'}, result: {foo:'bar'} },
    { example: {}, actual: {foo:{bar:{baz:{}}}}, result: {foo:{bar:{baz:{}}}} },
    { example: {}, actual: {foo:['bar']}, result: {foo:['bar']} },
    { example: {}, actual: {foo:{bar:{baz:[{}]}}}, result: {foo:{bar:{baz:[{}]}}} },

    { example: {}, actual: [], error: true },
    { example: {}, actual: ['asdf'], error: true },
    { example: {}, actual: [''], error: true },
    { example: {}, actual: [235], error: true },
    { example: {}, actual: [false], error: true },
    { example: {}, actual: [{}], error: true },
    { example: {}, actual: [{foo:'bar'}], error: true },

    { example: {}, actual: undefined, result: undefined },

    { example: {}, actual: NaN, error: true },
    { example: {}, actual: Infinity, error: true },
    { example: {}, actual: -Infinity, error: true },
    { example: {}, actual: null, error: true },

    { example: {}, actual: /some regexp/, result: {} },
    { example: {}, actual: function(){}, error: true },
    { example: {}, actual: new Date('November 5, 1605'), error: true },
    { example: {}, actual: new Readable(), result: {} },
    { example: {}, actual: new Buffer('asdf'), error: true },
    { example: {}, actual: new Error('asdf'), result: {} },  // TODO: consider enhancing this behavior to guarantee e.g. `.message` (string), `.stack` (string), `.code` (string), and `.status` (number).  Needs community discussion


    ////////////////////////////////////////////
    // ARRAYS
    ////////////////////////////////////////////

    { example: [], actual: 'bar', error: true },
    { example: [], actual: 123, error: true },
    { example: [], actual: true, error: true },

    { example: [], actual: {}, error: true },
    { example: [], actual: {foo:'bar'}, error: true },
    { example: [], actual: {foo:{bar:{baz:{}}}}, error: true },
    { example: [], actual: {foo:['bar']}, error: true },
    { example: [], actual: {foo:{bar:{baz:[{}]}}}, error: true },

    { example: [], actual: [], result: [] },
    { example: [], actual: ['asdf'], result: ['asdf'] },
    { example: [], actual: [''], result: [''] },
    { example: [], actual: [235], result: [235] },
    { example: [], actual: [false], result: [false] },
    { example: [], actual: [{}], result: [{}] },
    { example: [], actual: [{foo:'bar'}], result: [{foo: 'bar'}] },

    { example: [], actual: undefined, result: undefined },

    { example: [], actual: NaN, error: true },
    { example: [], actual: Infinity, error: true },
    { example: [], actual: -Infinity, error: true },
    { example: [], actual: null, error: true },

    { example: [], actual: /some regexp/, error: true },
    { example: [], actual: function(){}, error: true },
    { example: [], actual: new Date('November 5, 1605'), error: true },
    { example: [], actual: new Readable(), error: true }, // TODO: consider enhancing this behavior to concat the stream contents? Needs community discussion.
    { example: [], actual: new Buffer('asdf'), error: true },
    { example: [], actual: new Error('asdf'), error: true },

    ////////////////////////////////////////////
    // MISC
    ////////////////////////////////////////////

    { typeclass: '*', actual: 'bar', result: 'bar',  },
    { typeclass: '*', actual: '', result: '',  },
    { typeclass: '*', actual: '-1.1', result: '-1.1',  },
    { typeclass: '*', actual: 'NaN', result: 'NaN',  },
    { typeclass: '*', actual: 'undefined', result: 'undefined',  },
    { typeclass: '*', actual: 'null', result: 'null',  },
    { typeclass: '*', actual: '-Infinity', result: '-Infinity',  },
    { typeclass: '*', actual: 'Infinity', result: 'Infinity',  },
    { typeclass: '*', actual: 'true', result: 'true',  },
    { typeclass: '*', actual: 'false', result: 'false',  },
    { typeclass: '*', actual: '0', result: '0',  },
    { typeclass: '*', actual: '1', result: '1',  },

    { typeclass: '*', actual: 0, result: 0,  },
    { typeclass: '*', actual: 1, result: 1,  },
    { typeclass: '*', actual: -1.1, result: -1.1,  },

    { typeclass: '*', actual: true, result: true,  },
    { typeclass: '*', actual: false, result: false,  },

    { typeclass: '*', actual: {}, result: {},  },
    { typeclass: '*', actual: {foo:'bar'}, result: {foo:'bar'},  },
    { typeclass: '*', actual: {foo:{bar:{baz:{}}}}, result: {foo:{bar:{baz:{}}}},  },
    { typeclass: '*', actual: {foo:['bar']}, result: {foo:['bar']},  },
    { typeclass: '*', actual: {foo:{bar:{baz:[{}]}}}, result: {foo:{bar:{baz:[{}]}}},  },

    { typeclass: '*', actual: [], result: [],  },
    { typeclass: '*', actual: ['asdf'], result: ['asdf'],  },
    { typeclass: '*', actual: [''], result: [''],  },
    { typeclass: '*', actual: [235], result: [235],  },
    { typeclass: '*', actual: [false], result: [false],  },
    { typeclass: '*', actual: [{}], result: [{}],  },
    { typeclass: '*', actual: [{foo:'bar'}], result: [{foo:'bar'}],  },

    { typeclass: '*', actual: undefined, result: undefined,  },

    { typeclass: '*', actual: NaN, result: NaN,  },
    { typeclass: '*', actual: Infinity, result: Infinity,  },
    { typeclass: '*', actual: -Infinity, result: -Infinity,  },
    { typeclass: '*', actual: null, result: null,  },

    (function (){
      var regexp = /some regexp/;
      return { typeclass: '*', actual: regexp, result: regexp,  };
    })(),
    (function (){
      var fn = function (){};
      return { typeclass: '*', actual: fn, result: fn,  };
    })(),
    { typeclass: '*', actual: new Date('November 5, 1605'), result: new Date('November 5, 1605'),  },
    { typeclass: '*', actual: new Readable(), result: new Readable(),  },
    (function (){
      var buffer = new Buffer('asdf');
      return { typeclass: '*', actual: buffer, result: buffer  };
    })(),
    (function (){
      var err = new Error('asdf');
      return { typeclass: '*', actual: err, result: err,  };
    })()

  ];

  // Initially run all tests as-is.
  _.each(INPUT_TEST_SUITE, function runTest(test){


    // Inject extra test to try `example:{}` as `typeclass: 'dictionary'`
    if (_.isEqual(test.example, {})) {
      runTest({
        typeclass: 'dictionary',
        actual: test.actual,
        result: test.result,
        error: test.error
      });
    }
    // Inject extra test to try `example:[]` as `typeclass: 'array'`
    else if (_.isEqual(test.example, [])) {
      runTest({
        typeclass: 'array',
        actual: test.actual,
        result: test.result,
        error: test.error
      });
    }

    describeAndExecuteTest(test);
  });



  // Now loop through the entire suite again to inject extra tests
  // to ensure correct behavior when recursive examples/values are provided.
  _.each(INPUT_TEST_SUITE, function runTest(test){

    // if (!_.isUndefined(test.example)){
    //   // test one level of additional dictionary nesting
    //   runTest({
    //     example: { xtra: test.example },
    //     actual: { xtra: test.actual },
    //     result: { xtra: test.result }
    //   });
    // }
  });

});



// Set up mocha test:
function describeAndExecuteTest(test){
  var actualDisplayName = (_.isObject(test.actual)&&test.actual.constructor && test.actual.constructor.name !== 'Object' && test.actual.constructor.name !== 'Array')?test.actual.constructor.name:util.inspect(test.actual, false, null);

  describe((function _determineDescribeMsg(){
    var msg = '';
    if (test.required){
      msg += 'required input ';
    }
    else {
      msg += 'optional input ';
    }
    if (!_.isUndefined(test.example)) {
      msg += 'with a '+getDisplayType(test.example)+' example ('+util.inspect(test.example,false, null)+')';
    }
    else if (!_.isUndefined(test.typeclass)) {
      msg +='with typeclass: '+test.typeclass;
    }
    else {
      msg +='with neither an example nor typeclass';
    }

    return msg;
  })(), function suite (){
    if (test.error) {
      it(util.format('should error when %s is passed in', actualDisplayName), function (done){
        testInputValidation(test, done);
      });
      return;
    }
    else {
      it(util.format('should coerce %s', actualDisplayName, 'into '+util.inspect(test.result, false, null)+''), function (done){
        testInputValidation(test, done);
      });
    }
  });
}


/**
 * private helper fn
 * @param  {[type]} x [description]
 * @return {[type]}   [description]
 */
function getDisplayType(x){
  var displayType;
  displayType = typeof x;
  try {
    displayType = x.constructor.name;
  }
  catch (e){}
  return displayType;
}
