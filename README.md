# node-machine


## Basic Usage

```js
var someMachine = require('node-machine').require('machine-somemachine');

someMachine
.configure({
  someInput: 'foo',
  someOtherInput: 'bar'
}
.exec({
  success: function (results){...},
  error: function (err){...},
  invalid: function (err){...},
  etc...
});
```


<!--
// Alternative usage
// var Machine = require('node-machine');
// var def = require('../listTemplates');
// var machine = new Machine(def);
-->

## License

MIT
