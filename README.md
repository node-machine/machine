<h1>
  <a href="http://node-machine.org"><img alt="node-machine logo" title="The Node-Machine Project" src="http://node-machine.org/images/machine-anthropomorph-for-white-bg.png" width="50" /></a>
  machine (runner)
</h1>


## Status

This branch is currently a work in progress.


## Usage


#### .build()

Call `Machine.build()` (or just `Machine()`) with a machine definition to build a callable function:

```js
const Machine = require('machine');

const callable = Machine({
  inputs: {
    foo: { type: 'string', required: true }
  },
  fn: function(inputs, exits){
    let result = `The result, based on ${inputs.foo}.`;
    return exits.success(result);
  }
});//ƒ

let result = await callable({foo: 'bar'});
console.log(result);

// => 'The result, based on "bar"'.
```

##### Machine definitions

A machine definition is a dictionary (plain JavaScript object) that describes the implementation of a function, according to the [specification](http://node-machine.org/spec).

By itself, a machine definition can be programmatically parsed for things like generating documentation and tests, performing static analysis, enabling IDE plugins with features such as code completion and high-level linting, inferring user interface elements such as forms, and much more.

But to actually _use_ a machine definition in your code, you need some kind of runner.  That's what this module is for:

```js

const Machine = require('machine');
const def = { /* … */ };
const callable = Machine(def);
```

##### Callables

A "callable" (or "wet machine") is a function returned after building a machine.  It has standard usage out of the box (unless you used `buildWithCustomUsage()`).

```js
let argins = { /*…*/ };
let result = await callable(argins);
```

It also has some additional custom methods, available as properties:

- `callable.getDef()`
- `callable.customize()`


##### Deferreds

Invoking a "callable" returns a Deferred instance, that can be used with async/await:

```js
let deferred = callable(argins);
let result = await deferred;
```

It also supports some other methods, such as:

- `deferred.log()`
- `deferred.then()`
- `deferred.catch()`
- `deferred.exec()`
- `deferred.switch()`

> See [parley](https://github.com/mikermcneil/parley) for more information.


#### .pack()

Call `Machine.pack()` to construct a "machinepack", a JavaScript (usually Node.js) package of callable functions:

```js
const mp = Machine.pack({
  dir: __dirname,
  pkg: require('./package.json')
});
```

##### Machinepacks

Machinepacks are simple dictionaries (plain JavaScript objects) that expose a set of "callables" as methods.

They also support one built-in method:

- `mp.customize()`


#### .VERSION

The current version of the machine runner.

```js
console.log(Machine.VERSION);

// => '15.0.0-3'
```


#### .getMethodName()

Get the proper method name for a machine definition.

```js
const methodName = Machine.getMethodName({
  identity: 'do-something-cool',
  friendlyName: 'Do summthin real neat',
  description: 'Do something quite skillful and well-balanced.',
  inputs: {/*…*/},
  exits: {/*…*/},
  fn: function(inputs, exits) { /*…*/ return exits.success(); }
});//ƒ

console.log('.'+methodName+'()');

//=> '.doSomethingCool()'
```



#### .buildWithCustomUsage()

> Experimental.

```js
const customCallable = Machine.buildWithCustomUsage({
  arginStyle: 'serial',
  execStyle: 'immediate',
  def: {
    sync: true,
    args: ['foo', 'bar'],
    inputs: {
      foo: { type: 'string', required: true },
      bar: { type: 'number' },
    },
    fn: function(inputs, exits){
      let result = `The result, based on ${inputs.foo}`;
      if (inputs.bar) {
        result += ` and ${inputs.bar}.`;
      }
      return exits.success(result);
    }
  }
});//ƒ

let result = callable('abc', 123);
console.log(result);

// => 'The result, based on "abc" and "123"'.
```




## Benchmarks

As of [morning, Friday, August 18, 2017](https://github.com/node-machine/machine/tree/35548a4a1425d5a21bff481470a615c0561a536b):


```

> machine@15.0.0-3 bench /Users/mikermcneil/code/machine
> NODE_ENV=production node ./node_modules/mocha/bin/mocha -R dot --recursive -b test/benchmarks/exec.benchmark.js


   o

       •
      o                  .
       •                •
        •                •
                •       o
                            •        o
 o   •              •          o   •
      o              o         •
  •  •      •       •      •    •
           •      •              o
  •    b e n c h m a r k s      •
   •        •
 •                        ___  •
    • o •    •      •    /o/•\_   •
       •   •  o    •    /_/\ o \_ •
       o    O   •   o • •   \ o .\_
          •       o  •       \. O  \


  • sanity_check x 772,990 ops/sec ±0.44% (83 runs sampled)
  • exec_very_simple_machine x 40,115 ops/sec ±3.87% (69 runs sampled)
  • exec_machine_with_inputs_and_exits_but_nothing_crazy x 32,824 ops/sec ±4.00% (63 runs sampled)
  • exec_machine_with_inputs_and_exits_that_have_big_ole_exemplars x 30,845 ops/sec ±4.25% (69 runs sampled)
  • exec_machine_with_crazy_numbers_of_inputs_and_exits x 23,494 ops/sec ±2.91% (72 runs sampled)
  • exec_machine_with_crazy_numbers_of_inputs_and_exits_and_is_cacheable x 23,073 ops/sec ±2.82% (70 runs sampled)
  • exec_machine_with_crazy_numbers_of_inputs_and_exits_with_huge_exemplars x 24,805 ops/sec ±2.57% (71 runs sampled)
  • exec_machine_with_crazy_numbers_of_inputs_and_exits_with_ref_exemplars x 22,092 ops/sec ±2.46% (68 runs sampled)
 Fastest is sanity_check
 Slowest is exec_machine_with_crazy_numbers_of_inputs_and_exits_with_ref_exemplars,exec_machine_with_crazy_numbers_of_inputs_and_exits_and_is_cacheable
  ```


## License

MIT

Copyright (c) Mike McNeil, 2014
Copyright (c) The Sails Co., 2015-2017

