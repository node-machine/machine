# machine

This module is a runtime for _machines_; i.e. any function which conforms to the open standard outlined [here](http://node-machine.org/spec/machine).

Most machine consumers won't interact with this module directly-- rather, you'll want to require a machinepack from NPM like so:

```javascript
var Github = require('machinepack-github');
```

Then use one of its machines:

```javascript
Github.getRepo({
  user: 'balderdashy',
  repo: 'sails'
})
.exec({
  success: function (repo){ /*...*/ },
  error: function (err){ /*...*/ },
  invalidApiKey: function (err){ /*...*/ }
});
```

For more information on using machines, an up-to-date list of all available machinepacks, and standardized documentation for each one, visit http://node-machine.org.


### For implementors

If you're implementing a machinepack, you'll need to use this module to `.pack()` your machines.  See http://node-machine.org/spec/machinepack for more information.

### Advanced Use

If you're implementing a one-off machine (i.e. just to take advantage of the caching or type-checking this module provides), you may need lower-level access to the methods herein.

See [DIRECT_USAGE.md](./DIRECT_USAGE.md) for information on how to use all the lower-level features of this module.


### License

MIT
&copy; 2014 Mike McNeil


