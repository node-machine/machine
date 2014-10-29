var assert = require('assert');
var T = require('../../lib/types');

describe('Inferring types from example', function() {

  describe('when primative values are used', function() {

    it('should set type "string"', function() {
      var type = T.rttc.infer('foo');
      assert.strictEqual(type, 'string');
    });

    it('should set type "integer"', function() {
      var type = T.rttc.infer(5);
      assert.strictEqual(type, 'integer');
    });

    it('should set type "boolean"', function() {
      var type = T.rttc.infer(false);
      assert.strictEqual(type, 'boolean');

      type = T.rttc.infer(true);
      assert.strictEqual(type, 'boolean');
    });

  });

});
