# Using this module directly

> This markdown document is a bit old, but still up to date.
>
> Be sure and also check out http://node-machine.org.


## Install

```bash
npm install machine
```


## Recap of basic usage

First, here's a quick recap of the standard use case for machinepack users:

```bash
$ node
> require('machinepack-github').getRepo
-----------------------------------------
 [Machine: get-repo]
 Fetch metadata about a github repo.

 Inputs:
  • repo      (type: string)
  • user      (type: string)
-----------------------------------------

> require('machinepack-github').getRepo({repo: 'sails', user: 'balderdashy'}).exec(console.log)

{ ... }
```



## Using a machine

##### With traditional options+callback function usage:

```javascript
Github.getRepo({
  user: 'balderdashy',
  repo: 'sails'
}, function (err, repo) { /* ... */ });
```


##### With chainable helper function(s) and a switchback:

```javascript
Github.getRepo({
  user: 'balderdashy',
  repo: 'sails'
})
.exec({
  success: function (repo){ /*...*/ },
  error: function (err){ /*...*/ },
  invalidApiKey: function (err){ /*...*/ },
  // etc.
});
```


##### With an environment:

```javascript
Github.getRepo({
  user: 'balderdashy',
  repo: 'sails'
})
.setEnvironment({
  config: sails.config.githubCredentials
})
.exec(function (err, repo) {
  // ...
});



##### Low-level usage:

> (machinepack-independent)

```javascript
require('machine')
.build({
  inputs: {
    foo: {example: 'bar'}
  },
  exits: {},
  fn: function (inputs, exits){
    return exits.success();
  }
})
.configure({
  user: 'balderdashy',
  repo: 'sails'
}).exec(function (err, results){
  if (err) {
    // ...
  }

  // ...
})
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
require('machine').build(require('./foo'))
.configure({
  // input values go here
})
.exec(function (err) {
  console.log('all done.');
});
```





## Advanced Usage

Since machine definitions are completely static and context-free, we must consider all of the various methods by which we might deserialize them and inject the runtime scope.

#### The `Machine` constructor

When you require `node-machine`, you get the stateless `Machine` constructor:

```javascript
var Machine = require('machine');

console.log(Machine);
/*
-----------------------------------------
 node-machine
 v0.2.2

 • License  : MIT
 • Docs     : http://node-machine.org
-----------------------------------------
*/
```


As with the top-level value exported from any node module, you really shouldn't make changes to this object since it would pollute the module elsewhere in the currently-running process (in other functions, other files, and even other modules!)


#### Building callable machines

`Machine.build()` is a static factory method which constructs callable functions.

```javascript
var Machine = require('machine');
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
var Machine = require('machine');
var ls = Machine.build(require('machinepack-fs/machine/ls'));

ls
.configure({
  dir: '.'
})
.cache({ttl: 2000}) // this is the ttl, 2000ms === 2 seconds
.exec(console.log)
```
