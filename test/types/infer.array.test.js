var assert = require('assert');
var T = require('../../lib/types');

describe('Inferring types from example', function() {

  describe('when an array of objects is used', function() {

    it('should parse an array with a single level object', function() {
      var arr = [{
        foo: 'bar',
        bar: 3,
        baz: false
      }];

      var types = T.infer(arr);

      assert(Array.isArray(types));
      assert.strictEqual(types.length, 1);

      assert(types[0].foo);
      assert(types[0].bar);
      assert(types[0].baz);
      assert.strictEqual(types[0].foo, 'string');
      assert.strictEqual(types[0].bar, 'number');
      assert.strictEqual(types[0].baz, 'boolean');
    });

    it('should parse an array with a nested object', function() {
      var arr = [{
        foo: 'bar',
        bar: {
          foo: false,
          baz: {
            foo: 3
          }
        }
      }];

      var types = T.infer(arr);

      assert(Array.isArray(types));
      assert.strictEqual(types.length, 1);

      assert(types[0].foo);
      assert(types[0].bar);
      assert(types[0].bar.foo);
      assert(types[0].bar.baz);
      assert(types[0].bar.baz.foo);

      assert.strictEqual(types[0].foo, 'string');
      assert.strictEqual(types[0].bar.foo, 'boolean');
      assert.strictEqual(types[0].bar.baz.foo, 'number');
    });

  });

});
