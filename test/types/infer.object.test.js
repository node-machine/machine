var assert = require('assert');
var T = require('../../lib/types');

describe('Inferring types from example', function() {

  describe('when an object is used', function() {

    it('should parse a single level object', function() {
      var obj = {
        foo: 'bar',
        bar: 3,
        baz: false
      };

      var types = T.infer(obj);

      assert(types.foo);
      assert(types.bar);
      assert(types.baz);
      assert.strictEqual(types.foo, 'string');
      assert.strictEqual(types.bar, 'integer');
      assert.strictEqual(types.baz, 'boolean');
    });

    it('should parse a nested object', function() {
      var obj = {
        foo: 'bar',
        bar: {
          foo: false,
          baz: {
            foo: 3
          }
        }
      };

      var types = T.infer(obj);

      assert(types.foo);
      assert(types.bar);
      assert(types.bar.foo);
      assert(types.bar.baz);
      assert(types.bar.baz.foo);

      assert.strictEqual(types.foo, 'string');
      assert.strictEqual(types.bar.foo, 'boolean');
      assert.strictEqual(types.bar.baz.foo, 'integer');
    });

  });

});
