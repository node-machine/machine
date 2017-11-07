<h1>
  <a href="http://node-machine.org"><img alt="node-machine logo" title="The Node-Machine Project" src="http://node-machine.org/images/machine-anthropomorph-for-white-bg.png" width="50" /></a>
  machine (runner)
</h1>

[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/balderdashy/sails?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)


A runner for functions written in JavaScript.  Machines are atomic, context-free bits of code which conform to the [machine specification](http://node-machine.org/spec/machine): an open standard for functions and subroutines.

> **Chances are you don't need to use this module directly**- see [About This Module](https://github.com/node-machine/machine#about-this-module) below for info.


## Installation &nbsp;  [![NPM version](https://badge.fury.io/js/machine.svg)](http://badge.fury.io/js/machine)  [![Build Status](https://travis-ci.org/node-machine/machine.png?branch=master)](https://travis-ci.org/node-machine/machine)

**With [node](http://nodejs.org) [installed](http://sailsjs.com/get-started):**
```sh
# Get the machine runner
$ npm install machine --save
```


## Usage

#### .build()

Call `Machine.build()` (or just `Machine()`) with a machine definition to build a callable function:

```js
const Machine = require('machine');

const callable = Machine({
  identity: 'do-something',
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
- `deferred.meta()`

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
    identity: 'do-something',
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

let result = customCallable('abc', 123);
console.log(result);

// => 'The result, based on "abc" and "123"'.
```




## Benchmarks

As of [morning, Friday, August 18, 2017](https://github.com/node-machine/machine/tree/35548a4a1425d5a21bff481470a615c0561a536b), without any build-time normalization of definitions, and with runtime data type validation disabled:

```
∑ NODE_ENV=production npm run bench

> machine@15.0.0-3 bench /Users/mikermcneil/code/machine
> node ./node_modules/mocha/bin/mocha -R dot --recursive -b test/benchmarks/



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

 • sanity_check x 794,661 ops/sec ±0.47% (85 runs sampled)
 • build_very_simple_machine x 152,975 ops/sec ±0.54% (84 runs sampled)
 • build_machine_with_inputs_and_exits_but_nothing_crazy x 129,236 ops/sec ±0.56% (84 runs sampled)
 • build_machine_with_inputs_and_exits_that_have_big_ole_exemplars x 122,899 ops/sec ±0.91% (82 runs sampled)
 • build_machine_with_crazy_numbers_of_inputs_and_exits x 81,030 ops/sec ±0.77% (81 runs sampled)
 • build_machine_with_crazy_numbers_of_inputs_and_exits_and_is_cacheable x 79,177 ops/sec ±0.75% (85 runs sampled)
 • build_machine_with_crazy_numbers_of_inputs_and_exits_with_huge_exemplars x 89,338 ops/sec ±0.64% (83 runs sampled)
 • build_machine_with_crazy_numbers_of_inputs_and_exits_with_ref_exemplars x 76,974 ops/sec ±0.67% (84 runs sampled)
Fastest is sanity_check
Slowest is build_machine_with_crazy_numbers_of_inputs_and_exits_with_ref_exemplars

  ․ • sanity_check x 755,851 ops/sec ±0.77% (85 runs sampled)
 • exec_very_simple_machine x 37,835 ops/sec ±3.80% (69 runs sampled)
 • exec_machine_with_inputs_and_exits_but_nothing_crazy x 32,015 ops/sec ±3.66% (62 runs sampled)
 • exec_machine_with_inputs_and_exits_that_have_big_ole_exemplars x 30,895 ops/sec ±3.49% (62 runs sampled)
 • exec_machine_with_crazy_numbers_of_inputs_and_exits x 22,669 ops/sec ±2.97% (72 runs sampled)
 • exec_machine_with_crazy_numbers_of_inputs_and_exits_and_is_cacheable x 21,708 ops/sec ±3.04% (69 runs sampled)
 • exec_machine_with_crazy_numbers_of_inputs_and_exits_with_huge_exemplars x 23,585 ops/sec ±3.41% (69 runs sampled)
 • exec_machine_with_crazy_numbers_of_inputs_and_exits_with_ref_exemplars x 21,805 ops/sec ±2.41% (65 runs sampled)
Fastest is sanity_check
Slowest is exec_machine_with_crazy_numbers_of_inputs_and_exits_and_is_cacheable,exec_machine_with_crazy_numbers_of_inputs_and_exits_with_ref_exemplars
․ • sanity_check x 712,777 ops/sec ±1.00% (81 runs sampled)
 • execSync_very_simple_machine x 36,050 ops/sec ±4.42% (69 runs sampled)
 • execSync_machine_with_inputs_and_exits_but_nothing_crazy x 30,311 ops/sec ±2.72% (57 runs sampled)
 • execSync_machine_with_inputs_and_exits_that_have_big_ole_exemplars x 29,416 ops/sec ±3.81% (62 runs sampled)
 • execSync_machine_with_crazy_numbers_of_inputs_and_exits x 21,353 ops/sec ±3.84% (69 runs sampled)
 • execSync_machine_with_crazy_numbers_of_inputs_and_exits_and_is_cacheable x 21,188 ops/sec ±3.76% (59 runs sampled)
 • execSync_machine_with_crazy_numbers_of_inputs_and_exits_with_huge_exemplars x 22,878 ops/sec ±3.49% (72 runs sampled)
 • execSync_machine_with_crazy_numbers_of_inputs_and_exits_with_ref_exemplars x 21,315 ops/sec ±2.43% (69 runs sampled)
Fastest is sanity_check
Slowest is execSync_machine_with_crazy_numbers_of_inputs_and_exits_and_is_cacheable,execSync_machine_with_crazy_numbers_of_inputs_and_exits,execSync_machine_with_crazy_numbers_of_inputs_and_exits_with_ref_exemplars
```



## About this module

Before you read any further, let's stop and make sure you're in the right place.  The documentation in this README file is for low-level usage of `machine`, the JavaScript machine runner.  You don't need to use this module directly unless you're **building machines**.

You can find more information about the node-machine project on http://node-machine.org.  There you'll also find a short video from the introductory talk at [dotjs.eu](http://dotjs.eu/), an up-to-date list of all available machines on NPM, and standardized documentation pages with code examples you can copy and paste into your Node.js app (e.g. [Github.createRepo()](http://node-machine.org/machinepack-github/create-repo)).

Building a machinepack?  Here are some tips:
+ Start with [tutorial for implementors](http://node-machine.org/implementing/Getting-Started)
+ Join the [newsgroup for the machine specification](https://groups.google.com/forum/?hl=en#!forum/node-machine) to get help from other machine implementors
+ Don't forget to add the `"repository"` key to your package.json file so folks can find your source code (this enables the `View Source` button in the generated documentation on node-machine.org)
+ Hit up [@mikermcneil](https://twitter.com/mikermcneil) on Twitter and let me know what you're working on!



### OK what is this? How does it work?

This is a low-level module for building, configuring, and running machines.

Normal users of machines won't interact with this module directly very often-- however it _is_ a dependency of every machinepack.  Its full list of responsibilities includes exposing the conventional machine usage, a `.exec()` helper (for familiarity with Waterline), as well as validating input expectations, coercing return values from exits, and more.

The `.build()` method accepts a machine definition object and returns a new ready-to-use machine instance function.  The `.pack()` method accepts a filesystem path and returns a ready-to-use machinepack obtained by requiring the module located at the path, loading its machine definitions into live machines (calling `.build()` on each definition), and validating that everything is up to spec.

So when you require a machinepack from NPM like so:

```javascript
var Github = require('machinepack-github');
```

what's actually happening is that the `index.js` file in the machinepack module is calling `.pack()` and returning an object of ready-to-go machine instances.



### Where would I use this module directly?

There are only two use-cases for requiring this module directly:

##### 1. Your machinepack's boilerplate `index.js` file

> Note that this is taken care of for you if you used the [Yeoman generator](https://github.com/node-machine/generator-machinepack) to create your machinepack.

If you're implementing a machinepack, you'll need to use this module to `.pack()` your machines in your `index.js` file.  Here's an [example of an `index.js` file](https://github.com/mikermcneil/machinepack-urls/blob/master/index.js#L2) (this example happens to come from machinepack-urls- your pack's `index.js` file should always look the same, no matter what).

##### 2. A machine which uses another machine from the same pack

Normally, if you want to use a machine _from inside of one of your machines_, you just install and require the other machinepack in _your_ pack and use it just like you would in app-level code.  But if you want to use another machine in the _same pack_, or you want the machine to call itself recursively, you should use this module directly.  You can read more information on this in the [FAQ for implementors](https://github.com/node-machine/docs/blob/master/creating-a-machinepack/FAQ.md).

### Can I use this module outside of a machinepack?

You can use it anywhere you like!  For instance, you might want to implement a one-off machine in your app, perhaps to take advantage of caching or type-checking this module provides.

> If you're using Sails, check out [`sails-hook-machines`](https://github.com/node-machine/sails-hook-machines), a hook which allows you to use custom closed-source machines in your Sails app by dropping files into the `api/machines/` folder.



## Contributing

If you're interested in contributing to the machine specification, please request to join the project's [Google Group](https://groups.google.com/forum/?hl=en#!forum/node-machine) and introduce yourself to the rest of the core team.  In the mean time, you can check out the tests for information on how to use all the lower-level features of this module.  There is also a guide for direct usage of this module in [`docs/DIRECT_USAGE.md`](./docs/DIRECT_USAGE.md).  Note that you can run the tests for this module using `npm test`.  To re-generate the recursive dependency report (via the `licensing` module by 3rdEden), run `npm run licensing`.



## Issue Submission
Make sure you've read the [issue submission guidelines](https://sailsjs.com/bugs) from Sails before opening a new issue - the node-machine project uses the same rules.

Click [here](https://github.com/balderdashy/sails/search?q=&type=Issues) to search/post issues.




## License

MIT
&copy; 2014 Mike McNeil; &copy; 2015-2017 The Sails Company

Like the [Sails framework](https://sailsjs.com), [this package](https://npmjs.com/package/machine) is available under the **MIT license**.

![image_squidhome@2x.png](http://i.imgur.com/RIvu9.png)
