# node-machine
# - Zolmeister

## Basic Usage

```js
var Machine = require('..')
var Err = Machine.Err

var addingMachine = Machine(function (a, b) {
  if (a === Infinity || b === Infinity) {
    throw {name: 'AddedInfinity', message: 'You may not add Infinity'}
  }

  if (a === 0 || b === 0) {
    throw {name: 'AddedZero', message: 'You may not add Zero'}
  }

  return a + b
})


addingMachine(1, 0).then(function () {
  expect(false).to.equal(true)
}).catch(Err('nothing'), function (err) {
  expect(false).to.equal(true)
}).catch(Err('AddedZero'), function (err) {
  expect(err.message).to.equal('You may not add Zero')
})

```

## License

MIT
