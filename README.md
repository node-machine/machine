<img src="http://node-machine.org/images/machine-anthropomorph-for-white-bg.png" width="50" />

# machine (JavaScript runner)

This module is the original JavaScript runtime for _machines_; i.e. any function which conforms to the [machine specification](http://node-machine.org/spec/machine), an open standard for functions.

For information on using machines, an up-to-date list of all available machinepacks, and standardized documentation for each one, visit http://node-machine.org.

### What is this for?

This is a low-level module for building, configuring, and running machines.

Normal users of machines won't interact with this module directly very often-- however it _is_ a dependency of every machinepack.  Its full list of responsibilities includes exposing the conventional machine usage, a `.exec()` helper (for familiarity with Waterline), as well as validating input expectations, coercing return values from exits, and more.

The only reason to use this module directly is if you need to instantiate a one-off machine or machinepack.  The `.build()` method accepts a machine definition object and returns a new ready-to-use machine instance function.  The `.pack()` method accepts a filesystem path and returns a ready-to-use machinepack obtained by requiring the module located at the path, loading its machine definitions into live machines (calling `.build()` on each definition), and validating that everything is up to spec.

So when you require a machinepack from NPM like so:

```javascript
var Github = require('machinepack-github');
```

what's actually happening is that the `index.js` file in the machinepack module is calling `.pack()` and returning an object of ready-to-go machine instances.


### For implementors

If you're implementing a machinepack, you'll need to use this module to `.pack()` your machines in your [`index.js` file](https://github.com/mikermcneil/machinepack-urls/blob/master/index.js#L2) (this is taken care of for you if you used the [Yeoman generator](https://github.com/node-machine/generator-machinepack) to create your machinepack).

You'll also need this module if you want to use one of your machines from the same pack in another machine within that pack.  Take for example the `sanitize` machine in `machinepack-urls`.  It uses the `validate` machine from the same pack to ensure that the sanitized URL is valid before returning it:

```js
// The raw machine definition we're looking for is in the machines directory of this machinepack.
// But since the current code file is in the machines folder too, we can get the raw definition for
// the `validate` machine simply requiring it using a relative path based on its "identity".
var validateUrl = require('machine').build(require('./validate'));

// Then we can use the hydrated machine just like we would if we had gotten it out of a machinepack:
validateUrl({string: }).exec({
  error: function (err){ /* ... */},
  invalid: function (){ /* ... */ },
  success: function (){ /* ... */},
});

```
> To view this example in context, take a look at the [relevant lines in the source code for machinepack-url/sanitize](https://github.com/mikermcneil/machinepack-urls/blob/5153f138280b2385cc35e1bee54c50c8e155fb70/machines/sanitize.js#L29)

See http://node-machine.org/implementing for more tips.


### Advanced Use

If you're implementing a one-off machine (i.e. just to take advantage of the caching or type-checking this module provides), you may need lower-level access to the methods herein.

Check out the tests for information on how to use all the lower-level features of this module.  There is also a guide for direct usage of this module in [`docs/DIRECT_USAGE.md`](./docs/DIRECT_USAGE.md).

### Building a machinepack?

Here are some tips:
+ Check out the [tutorial for implementors](http://node-machine.org/implementing/Getting-Started)
+ Join the [newsgroup for the machine specification](https://groups.google.com/forum/?hl=en#!forum/node-machine)
+ Don't forget to add the `"repository"` key to your package.json file so folks can find your source code (this enables the `View Source` button in the generated documentation on node-machine.org)
+ Hit up [@mikermcneil](https://twitter.com/mikermcneil) on Twitter and let me know what you're working on!

### License

MIT
&copy; 2014- Mike McNeil


