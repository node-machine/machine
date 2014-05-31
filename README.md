# node-machine


## Basic Usage

```js
var Machines = require('node-machine');

var getRepo = Machines.load('machinepack-github/get-repo');

getRepo({
  user: 'balderdashy',
  repo: 'sails'
}).exec({
  success: function (results){ /*...*/ },
  error: function (err){ /*...*/ },
  invalidApiKey: function (err){ /*...*/ },
  // etc.
});
```

