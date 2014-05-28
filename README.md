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


## License

MIT
