/**
 * Module dependencies
 */

var util = require('util');
var _ = require('lodash');
var testExitCoercion = require('./helpers/test-exit-coercion.helper');
var Readable = require('stream').Readable;


describe('exit output coercion', function (){

  var EXIT_TEST_SUITE = [

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

    { example: 'foo', actual: {}, result: '' },
    { example: 'foo', actual: {foo:'bar'}, result: '' },
    { example: 'foo', actual: {foo:{bar:{baz:{}}}}, result: '' },
    { example: 'foo', actual: {foo:['bar']}, result: '' },
    { example: 'foo', actual: {foo:{bar:{baz:[{}]}}}, result: '' },

    { example: 'foo', actual: [], result: '' },
    { example: 'foo', actual: ['asdf'], result: '' },
    { example: 'foo', actual: [''], result: '' },
    { example: 'foo', actual: [235], result: '' },
    { example: 'foo', actual: [false], result: '' },
    { example: 'foo', actual: [{}], result: '' },
    { example: 'foo', actual: [{foo:'bar'}], result: '' },

    { example: 'foo', actual: undefined, result: '' },
    { example: 'foo', actual: NaN, result: '' },
    { example: 'foo', actual: Infinity, result: '' },
    { example: 'foo', actual: -Infinity, result: '' },
    { example: 'foo', actual: null, result: '' },

    { example: 'foo', actual: /some regexp/, result: '' },
    { example: 'foo', actual: function(){}, result: '' },
    { example: 'foo', actual: new Date('November 5, 1605 GMT'), result: '1605-11-05T00:00:00.000Z' },
    { example: 'foo', actual: new Readable(), result: '' }, // TODO: consider buffering into a string..?  needs community discussion
    { example: 'foo', actual: new Buffer('asdf'), result: '' }, // TODO: consider converting to string
    { example: 'foo', actual: new Error('asdf'), result: '' }, // TODO: consider converting to error stack trace

    ////////////////////////////////////////////
    // NUMBERS
    ////////////////////////////////////////////

    { example: 123, actual: 'bar', result: 0 },
    { example: 123, actual: '', result: 0 },
    { example: 123, actual: '0', result: 0 },
    { example: 123, actual: '1', result: 1 },
    { example: 123, actual: '-1.1', result: -1.1 },
    { example: 123, actual: 'NaN', result: 0 },
    { example: 123, actual: 'undefined', result: 0 },
    { example: 123, actual: 'null', result: 0 },
    { example: 123, actual: '-Infinity', result: 0 },
    { example: 123, actual: 'Infinity', result: 0 },

    { example: 123, actual: 0, result: 0 },
    { example: 123, actual: 1, result: 1 },
    { example: 123, actual: -1.1, result: -1.1 },

    { example: 123, actual: true, result: 1 },
    { example: 123, actual: false, result: 0 },

    { example: 123, actual: {}, result: 0 },
    { example: 123, actual: {foo:'bar'}, result: 0 },
    { example: 123, actual: {foo:{bar:{baz:{}}}}, result: 0 },
    { example: 123, actual: {foo:['bar']}, result: 0 },
    { example: 123, actual: {foo:{bar:{baz:[{}]}}}, result: 0 },

    { example: 123, actual: [], result: 0 },
    { example: 123, actual: ['asdf'], result: 0 },
    { example: 123, actual: [''], result: 0 },
    { example: 123, actual: [235], result: 0 },
    { example: 123, actual: [false], result: 0 },
    { example: 123, actual: [{}], result: 0 },
    { example: 123, actual: [{foo:'bar'}], result: 0 },

    { example: 123, actual: undefined, result: 0 },
    { example: 123, actual: NaN, result: 0 },
    { example: 123, actual: Infinity, result: 0 },
    { example: 123, actual: -Infinity, result: 0 },
    { example: 123, actual: null, result: 0 },

    { example: 123, actual: /some regexp/, result: 0 },
    { example: 123, actual: function(){}, result: 0 },
    { example: 123, actual: new Date('November 5, 1605 GMT'), result: 0 }, // TODO: consider enhancing this to return an epoch timestamp (number of miliseconds since Jan 1, 1970). In this case, would be: -11491606800000
    { example: 123, actual: new Readable(), result: 0 }, // TODO: ??? maybe num bytes read so far?
    { example: 123, actual: new Buffer('asdf'), result: 0 },  // TODO: ??? maybe size of the buffer in bytes?
    { example: 123, actual: new Error('asdf'), result: 0 }, // TODO: ??? maybe `.status`?

    ////////////////////////////////////////////
    // BOOLEANS
    ////////////////////////////////////////////
    { example: true, actual: 'bar', result: false },
    { example: true, actual: '', result: false },
    { example: true, actual: '-1.1', result: false },
    { example: true, actual: 'NaN', result: false },
    { example: true, actual: 'undefined', result: false },
    { example: true, actual: 'null', result: false },
    { example: true, actual: '-Infinity', result: false },
    { example: true, actual: 'Infinity', result: false },
    { example: true, actual: 'true', result: true },
    { example: true, actual: 'false', result: false },
    { example: true, actual: '0', result: false },
    { example: true, actual: '1', result: true },

    { example: true, actual: 0, result: false },
    { example: true, actual: 1, result: true },
    { example: true, actual: -1.1, result: false },

    { example: true, actual: true, result: true },
    { example: true, actual: false, result: false },

    { example: true, actual: {}, result: false },
    { example: true, actual: {foo:'bar'}, result: false },
    { example: true, actual: {foo:{bar:{baz:{}}}}, result: false },
    { example: true, actual: {foo:['bar']}, result: false },
    { example: true, actual: {foo:{bar:{baz:[{}]}}}, result: false },

    { example: true, actual: [], result: false },
    { example: true, actual: ['asdf'], result: false },
    { example: true, actual: [''], result: false },
    { example: true, actual: [235], result: false },
    { example: true, actual: [false], result: false },
    { example: true, actual: [{}], result: false },
    { example: true, actual: [{foo:'bar'}], result: false },

    { example: true, actual: undefined, result: false },
    { example: true, actual: NaN, result: false },
    { example: true, actual: Infinity, result: false },
    { example: true, actual: -Infinity, result: false },
    { example: true, actual: null, result: false },

    { example: true, actual: /some regexp/, result: false },
    { example: true, actual: function(){}, result: false },
    { example: true, actual: new Date('November 5, 1605 GMT'), result: false },
    { example: true, actual: new Readable(), result: false },
    { example: true, actual: new Buffer('asdf'), result: false },
    { example: true, actual: new Error('asdf'), result: false },

    ////////////////////////////////////////////
    // DICTIONARIES
    ////////////////////////////////////////////

    { example: {}, actual: 'bar', result: {} },
    { example: {}, actual: 123, result: {} },
    { example: {}, actual: true, result: {} },

    { example: {}, actual: {}, result: {} },
    { example: {}, actual: {foo:'bar'}, result: {foo:'bar'} },
    { example: {}, actual: {foo:{bar:{baz:{}}}}, result: {foo:{bar:{baz:{}}}} },
    { example: {}, actual: {foo:['bar']}, result: {foo:['bar']} },
    { example: {}, actual: {foo:{bar:{baz:[{}]}}}, result: {foo:{bar:{baz:[{}]}}} },

    { example: {}, actual: [], result: {} },
    { example: {}, actual: ['asdf'], result: {} },
    { example: {}, actual: [''], result: {} },
    { example: {}, actual: [235], result: {} },
    { example: {}, actual: [false], result: {} },
    { example: {}, actual: [{}], result: {} },
    { example: {}, actual: [{foo:'bar'}], result: {} },

    { example: {}, actual: undefined, result: {} },
    { example: {}, actual: NaN, result: {} },
    { example: {}, actual: Infinity, result: {} },
    { example: {}, actual: -Infinity, result: {} },
    { example: {}, actual: null, result: {} },

    { example: {}, actual: /some regexp/, result: {} },
    { example: {}, actual: function(){}, result: {} },
    { example: {}, actual: new Date('November 5, 1605 GMT'), result: {} },
    // Skip Readable stream tests for now since the enumerable properties vary between Node.js versions.
    // TODO: bring back support for this by explicitly filtering properties of streams in `.exec()`
    // { example: {}, actual: new Readable(), result: { _readableState: { highWaterMark: 16384, buffer: [], length: 0, pipes: null, pipesCount: 0, flowing: false, ended: false, endEmitted: false, reading: false, calledRead: false, sync: true, needReadable: false, emittedReadable: false, readableListening: false, objectMode: false, defaultEncoding: 'utf8', ranOut: false, awaitDrain: 0, readingMore: false, decoder: null, encoding: null }, readable: true, domain: null, _events: {}, _maxListeners: 10 } },

    { example: {}, actual: new Buffer('asdf'), result: {} },

    { example: {}, actual: new Error('asdf'), result: {} },  // TODO: consider enhancing this behavior to guarantee e.g. `.message` (string), `.stack` (string), `.code` (string), and `.status` (number).  Needs community discussion


    ////////////////////////////////////////////
    // ARRAYS
    ////////////////////////////////////////////

    { example: [], actual: 'bar', result: [] },
    { example: [], actual: 123, result: [] },
    { example: [], actual: true, result: [] },

    { example: [], actual: {}, result: [] },
    { example: [], actual: {foo:'bar'}, result: [] },
    { example: [], actual: {foo:{bar:{baz:{}}}}, result: [] },
    { example: [], actual: {foo:['bar']}, result: [] },
    { example: [], actual: {foo:{bar:{baz:[{}]}}}, result: [] },

    { example: [], actual: [], result: [] },
    { example: [], actual: ['asdf'], result: ['asdf'] },
    { example: [], actual: [''], result: [''] },
    { example: [], actual: [235], result: [235] },
    { example: [], actual: [false], result: [false] },
    { example: [], actual: [{}], result: [{}] },
    { example: [], actual: [{foo:'bar'}], result: [{foo: 'bar'}] },

    { example: [], actual: undefined, result: [] },
    { example: [], actual: NaN, result: [] },
    { example: [], actual: Infinity, result: [] },
    { example: [], actual: -Infinity, result: [] },
    { example: [], actual: null, result: [] },

    { example: [], actual: /some regexp/, result: [] },
    { example: [], actual: function(){}, result: [] },
    { example: [], actual: new Date('November 5, 1605 GMT'), result: [] },
    { example: [], actual: new Readable(), result: [] }, // TODO: consider enhancing this behavior to concat the stream contents? Needs community discussion.

    // Skip Buffer tests for now since the enumerable properties vary between Node.js versions.
    // TODO: bring back support for this by explicitly filtering properties of buffers in `.exec()`
    // { example: [], actual: new Buffer('asdf'), result: [ 97, 115, 100, 102 ] },
    { example: [], actual: new Error('asdf'), result: [] },


    ////////////////////////////////////////////
    // MISC
    ////////////////////////////////////////////

    { example: undefined, actual: 'bar', result: 'bar',  },
    { example: undefined, actual: '', result: '',  },
    { example: undefined, actual: '-1.1', result: '-1.1',  },
    { example: undefined, actual: 'NaN', result: 'NaN',  },
    { example: undefined, actual: 'undefined', result: 'undefined',  },
    { example: undefined, actual: 'null', result: 'null',  },
    { example: undefined, actual: '-Infinity', result: '-Infinity',  },
    { example: undefined, actual: 'Infinity', result: 'Infinity',  },
    { example: undefined, actual: 'true', result: 'true',  },
    { example: undefined, actual: 'false', result: 'false',  },
    { example: undefined, actual: '0', result: '0',  },
    { example: undefined, actual: '1', result: '1',  },

    { example: undefined, actual: 0, result: 0,  },
    { example: undefined, actual: 1, result: 1,  },
    { example: undefined, actual: -1.1, result: -1.1,  },

    { example: undefined, actual: true, result: true,  },
    { example: undefined, actual: false, result: false,  },

    { example: undefined, actual: {}, result: {},  },
    { example: undefined, actual: {foo:'bar'}, result: {foo:'bar'},  },
    { example: undefined, actual: {foo:{bar:{baz:{}}}}, result: {foo:{bar:{baz:{}}}},  },
    { example: undefined, actual: {foo:['bar']}, result: {foo:['bar']},  },
    { example: undefined, actual: {foo:{bar:{baz:[{}]}}}, result: {foo:{bar:{baz:[{}]}}},  },

    { example: undefined, actual: [], result: [],  },
    { example: undefined, actual: ['asdf'], result: ['asdf'],  },
    { example: undefined, actual: [''], result: [''],  },
    { example: undefined, actual: [235], result: [235],  },
    { example: undefined, actual: [false], result: [false],  },
    { example: undefined, actual: [{}], result: [{}],  },
    { example: undefined, actual: [{foo:'bar'}], result: [{foo:'bar'}],  },

    { example: undefined, actual: undefined, result: undefined,  },

    { example: undefined, actual: NaN, result: NaN,  },
    { example: undefined, actual: Infinity, result: Infinity,  },
    { example: undefined, actual: -Infinity, result: -Infinity,  },
    { example: undefined, actual: null, result: null,  },


    ////////////////////////////////////////////
    // RECURSIVE OBJECTS
    ////////////////////////////////////////////

    { example: {a:1, b:'hi', c: false}, actual: {a: 23}, result: {a: 23, b: '', c: false}  },
    { example: {a:1, b:'hi', c: false}, actual: {a: 23, d: true}, result: {a: 23, b: '', c: false}  },
    // Complex multi-item array test
    {
      example: [{
        id: 123,
        title: 'Scott',
        body: 'Scott',
        votes: 0,
        resolved: true
      }],

      actual: [{
        votes: 10,
        title: 'first',
        resolved: false
      }, {
        votes: -5,
        title: 'second',
        resolved: false
      }, {
        votes: 0,
        title: 'third',
        resolved: false
      }],

      result: [{
        id: 0,
        votes: 10,
        title: 'first',
        body: '',
        resolved: false
      }, {
        id: 0,
        votes: -5,
        title: 'second',
        body: '',
        resolved: false
      }, {
        id: 0,
        votes: 0,
        title: 'third',
        body: '',
        resolved: false
      }]
    },


    // Complex multi-item array test w/ edge cases
    {
      example: [{
        id: 123,
        title: 'Scott',
        body: 'Scott',
        votes: 0,
        resolved: true
      }],

      actual: [{
        votes: 10,
        title: 'first',
        resolved: false
      }, {
        votes: -5,
        title: 'second',
        resolved: false
      }, {
        votes: 0,
        title: 'third',
        resolved: false
      },
       {
        votes: null,
        title: 'fourth',
        resolved: false
      },
       {
        votes: undefined,
        title: 'fifth',
        resolved: false
      },
       {
        title: 'sixth',
        resolved: false
      }],

      result: [{
        id: 0,
        votes: 10,
        title: 'first',
        body: '',
        resolved: false
      }, {
        id: 0,
        votes: -5,
        title: 'second',
        body: '',
        resolved: false
      }, {
        id: 0,
        votes: 0,
        title: 'third',
        body: '',
        resolved: false
      },
      {
        id: 0,
        votes: 0,
        title: 'fourth',
        body: '',
        resolved: false
      },
      {
        id: 0,
        votes: 0,
        title: 'fifth',
        body: '',
        resolved: false
      },
      {
        id: 0,
        votes: 0,
        title: 'sixth',
        body: '',
        resolved: false
      }]
    },

    // Tricky multi-item array javascript black magic
    {
      example: [{
        id: 123,
        title: 'Scott',
        body: 'Scott',
        votes: 0,
        resolved: true
      }],

      actual: {
        0: {
          votes: 10,
          title: 'first',
          resolved: false
        },
        1: {
          votes: -5,
          title: 'second',
          resolved: false
        },
        2: {
          votes: 0,
          title: 'third',
          resolved: false
        },
        3: {
          votes: null,
          title: 'fourth',
          resolved: false
        },
        4: {
          votes: undefined,
          title: 'fifth',
          resolved: false
        },
        5: {
          title: 'sixth',
          resolved: false
        }
      },

      result: []
    },


  ];


  // Initially run all tests as-is.
  _.each(EXIT_TEST_SUITE, function (test){
    describeAndExecuteTest(test);
  });

  // Now loop through the entire suite again to inject extra tests
  // to ensure correct behavior when recursive examples/values are provided.
  _.each(EXIT_TEST_SUITE, function (test){
    // Skip tests without examples
    if (_.isUndefined(test.example)) return;

    // Skip tests that expect errors
    if (test.error) return;

    // Skip tests that expect a void output
    if (test.void) return;

    // Skip tests that expect `undefined`
    // (nested behavior is different in this case)
    if (test.result === undefined) return;

    // test one level of additional array nesting
    describeAndExecuteTest({
      example: [ test.example ],
      actual: [ test.actual ],
      result: [ test.result ],
      _meta: '+1 array depth'
    });

    // test one level of additional dictionary nesting
    describeAndExecuteTest({
      example: { xtra: test.example },
      actual: { xtra: test.actual },
      result: { xtra: test.result },
      _meta: '+1 dictionary depth'
    });

    // test one level of additional dictionary nesting AND 1 level of additional array nesting
    describeAndExecuteTest({
      example: [ { xtra: test.example } ],
      actual: [ { xtra: test.actual } ],
      result: [ { xtra: test.result } ],
      _meta: '+1 array depth, +1 dictionary depth'
    });

    // test two levels of additional dictionary nesting
    describeAndExecuteTest({
      example: { xtra: { xtra2: test.example } },
      actual: { xtra: { xtra2: test.actual } },
      result: { xtra:{ xtra2: test.result } },
      _meta: '+2 dictionary depth'
    });

    // test two levels of additional array nesting
    describeAndExecuteTest({
      example: [ [ test.example ] ],
      actual:  [ [ test.actual ] ],
      result:  [ [ test.result ] ],
      _meta: '+2 array depth'
    });

    // test two levels of additional dictionary nesting AND 1 level of array nesting
    describeAndExecuteTest({
      example: [ { xtra: { xtra2: test.example } } ],
      actual: [ { xtra: { xtra2: test.actual } } ],
      result: [ { xtra:{ xtra2: test.result } } ],
      _meta: '+1 array depth, +2 dictionary depth'
    });

    // test two levels of additional dictionary nesting and one level of array nesting, then WITHIN that, 1 level of array nesting
    describeAndExecuteTest({
      example: [ { xtra: { xtra2: [test.example] } } ],
      actual: [ { xtra: { xtra2: [test.actual] } } ],
      result: [ { xtra:{ xtra2: [test.result] } } ],
      _meta: '+1 array depth, +2 dictionary depth, +1 nested array depth'
    });

    // test two levels of additional dictionary nesting and one level of array nesting, then WITHIN that, 2 levels of array nesting
    describeAndExecuteTest({
      example: [ { xtra: { xtra2: [[test.example]] } } ],
      actual: [ { xtra: { xtra2: [[test.actual]] } } ],
      result: [ { xtra:{ xtra2: [[test.result]] } } ],
      _meta: '+1 array depth, +2 dictionary depth, +2 nested array depth'
    });
  });

});


// Set up mocha test:
function describeAndExecuteTest(test){
  var actualDisplayName = (_.isObject(test.actual)&&test.actual.constructor && test.actual.constructor.name !== 'Object' && test.actual.constructor.name !== 'Array')?test.actual.constructor.name:util.inspect(test.actual, false, null);

  describe((function _determineDescribeMsg(){
    var msg = '';
    if (test._meta) {
      msg += '['+test._meta+']';
    }
    if (test.void){
      msg += 'void exit ';
    }
    else {
      msg += 'exit ';
    }

    if (!_.isUndefined(test.example)) {
      msg += 'with a '+getDisplayType(test.example)+' example ('+util.inspect(test.example,false, null)+')';
    }
    else {
      msg +='with no example';
    }

    return msg;
  })(), function suite (){
    if (test.error) {
      it('should error', function (done){
        testInputValidation(test, done);
      });
      return;
    }
    else {
      it(util.format('should coerce %s', actualDisplayName, 'into '+util.inspect(test.result, false, null)+''), function (done){
        testExitCoercion(test, done);
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
