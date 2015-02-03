<h1>
  <a href="http://node-machine.org"><img alt="node-machine logo" title="The Node-Machine Project" src="http://node-machine.org/images/machine-anthropomorph-for-white-bg.png" width="50" /></a>
  machine (runner)
</h1>

### [Browse machines](http://node-machine.org/machinepacks) &nbsp;  [FAQ](http://node-machine.org/implementing/FAQ)  &nbsp;  [Newsgroup](https://groups.google.com/forum/?hl=en#!forum/node-machine)  &nbsp;  [Submit Issue](https://github.com/node-machine/machine/blob/master/README.md#issue-submission)

[![Gitter](https://badges.gitter.im/Join Chat.svg)](https://gitter.im/node-machine/general?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)


A runner for [machines](http://node-machine.org) written in JavaScript.  Machines are atomic, context-free bits of code which conform to the [machine specification](http://node-machine.org/spec/machine): an open standard for functions and subroutines.

> Chances are you don't need to use this module directly- see [About This Module](https://github.com/node-machine/machine#about-this-module) below for info.


## Installation &nbsp;  [![NPM version](https://badge.fury.io/js/machine.svg)](http://badge.fury.io/js/machine)

**With [node](http://nodejs.org) [installed](http://sailsjs.org/#!documentation/new-to-nodejs):**
```sh
# Get the machine runner
$ npm install machine --save
```


## Contributing

If you're interested in contributing to the machine specification, please request to join the project's [Google Group](https://groups.google.com/forum/?hl=en#!forum/node-machine) and introduce yourself to the rest of the core team.  In the mean time, you can check out the tests for information on how to use all the lower-level features of this module.  There is also a guide for direct usage of this module in [`docs/DIRECT_USAGE.md`](./docs/DIRECT_USAGE.md).  Note that you can run the tests for this module using `npm test`, and that we're using a preinstall script to generate a recursive dependency report (via the `licensing` module by 3rdEden).

## Issue Submission
Make sure you've read the [issue submission guidelines](https://github.com/balderdashy/sails/blob/master/CONTRIBUTING.md#opening-issues) from Sails before opening a new issue - the node-machine project uses the same rules.

Click [here](https://github.com/node-machine/machine/search?q=&type=Issues) to search/post issues in this repository.


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

## License

MIT
&copy; 2014 Mike McNeil


