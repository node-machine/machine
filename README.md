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





## Advanced Usage

Since machine definitions are completely static, we must consider all of the various methods by which we might deserialize them and inject the runtime scope.

#### The `Machine` constructor

When you require `node-machine`, you get the global `Machine` constructor:

```javascript
var Machine = require('node-machine');
```

As with the top-level value exported from any node module, you really shouldn't make changes to this object since it would pollute the module elsewhere in the currently-running process (in other functions, other files, and even other modules!)


#### Building callable machines

`Machine.build()` is a static factory method which constructs callable functions.

```javascript
var Machine = require('node-machine');
var foobar = Machine.build(function foobar(inputs, cb){ return cb(); });
```

#### Executing machines

Once you have a callable machine function, you can call it directly:

```javascript
foobar({
  foo: 1,
  bar: 2
}, function (err, result) {

});
```

or just use the chainable convenience methods:

```javascript
foobar.configure({
  foo: 1,
  bar: 2
})
.exec(function (err, result) {

});
```

#### Chainable usage / deferred object

Calling `.configure()` on a machine returns a chainable intermediate object, much like a promise.

> In the future, this object might eventually be a promise.

This allows for some flexibility in how the machine is called:

```javascript
var thisFoobar = foobar.configure();
thisFoobar.configure({foo: 1});
thisFoobar.configure({bar: 2});
thisFoobar.exec(function (err, result){

});
```


#### Caching

Machines know how to cache their own results.

```javascript
var Machine = require('node-machine');
var ls = Machine.build(require('machinepack-fs/ls'));

ls
.configure({

})
.cache(2000) // this is the ttl, 2000ms === 2 seconds
.exec(console.log)
```

#### Best-practices

```javascript
/**
 * Module dependencies
 */

var Machine = require('node-machine');
var M = {};
M.ls = Machine.build(require('machinepack-fs/ls'));
M.cp = Machine.build(require('machinepack-fs/cp'));

M.ls({
  dir: './'
})
.exec(function (err, result) {
  // and so on...
});
```


