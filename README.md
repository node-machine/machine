# node-machine


## Using a machine

```javascript
var Machine = require('node-machine');
```

With a callback function:

```javascript
var Machine = require('node-machine');

Machine.build(require('machinepack-github/get-repo'))
.configure({
  user: 'balderdashy',
  repo: 'sails'
})
.exec(function (err, results){
  if (err) {
    // ...
  }

  // ...
});
```


With a switchback:

```javascript
Machine.build(require('machinepack-github/get-repo'))
.configure({
  user: 'balderdashy',
  repo: 'sails'
})
.exec({
  success: function (results){ /*...*/ },
  error: function (err){ /*...*/ },
  invalidApiKey: function (err){ /*...*/ },
  // etc.
});
```


## Building your own machine

Machines are mostly just simple functions that always have the same usage paradigm:

```javascript
function (inputs, cb) {
  return cb();
}
```


If you define a function that way (let's say you export it from a local module called "foo.js"), you can actually use it as a machine like this:

```javascript
require('node-machine').build(require('./foo'))
.configure({
  // input values go here
})
.exec(function (err) {
  console.log('all done.');
});
```





## Advanced

Since machine definitions are completely static, we must consider all of the various methods by which we might deserialize them and inject the runtime scope.
