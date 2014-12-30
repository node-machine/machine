describe('Machine.prototype.execSync()', function (){

  it('should throw when called on a machine that does not declare sync:true');
  it('should return the expected value when called on a configured machine that triggers its defaultExit');
  it('should throw an Error when called on a configured machine that triggers any non-default exit and sends back an Error instance');
  it('should throw an Error when called on a configured machine that triggers any non-default exit and sends back a string');
  it('should throw an Error when called on a configured machine that triggers any non-default exit and sends back a boolean');
  it('should throw an Error when called on a configured machine that triggers any non-default exit and sends back a number');
  it('should throw an Error when called on a configured machine that triggers any non-default exit and sends back an array');
  it('should throw an Error when called on a configured machine that triggers any non-default exit and sends back an object');

});
