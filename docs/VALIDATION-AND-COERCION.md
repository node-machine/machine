# Validation and Coercion

> This markdown document is a bit old, _and a bit out of date._
> However, it has some good content that you might find helpful- just be sure and also check out http://node-machine.org **as well as the [rttc repo](https://github.com/node-machine.org/rttc)** for the latest information.


This is a quick reference sheet for seeing how validation and coercion work for inputs and exits.

See https://github.com/node-machine/rttc for more detailed reference documentation on how type coercion and validation work in the machine spec.

> These tables will eventually be automatically generated.

## Principles

Validation and coercion tend to be _**forgiving** and **protective** of the user_ but _harsh to the implementor_.

For instance, a user can pass in `"2"` (a string) to an input expecting a number example and the value will be cast to the number `2`.



## Inputs

The runtime value passed in to a machine for a particular input is run through `rttc.validate()` before being passed in as a property of the `inputs` argument to the machine's `fn`.  The type schema to validate against is determined by calling `rttc.infer()` on the `example` for the input as specified in the machine definition.

> + If a custom `validate()` function was provided for an input, all built-in validation and/or coercion is skipped.
> + The configured `inputs` dictionary accessible to `validate()` is not guaranteed to have been coerced.  You should make sure your custom `getExample()` and `validate()` functions take this into account (e.g. if a user passes the value `"3"` into some input (x) with a numeric example, the `validate` function for some other input (y) might receive `inputs.x` as either `"3"` or `3`)
> + The configured input values dictionary (`inputs`) accessible to `getExample()` consists of _exemplars_.


| `example`                | actual value provided  | yields...
| ------------------------ | ---------------------- | ----------------------
| 'foo'      | 'bar'     | 'bar'
| 'foo'      | ''     | ''
| 'foo'      | 0     | '0'
| 'foo'      | 1     | '1'
| 'foo'      | -1.1     | '-1.1'
| 'foo'      | true     | 'true'
| 'foo'      | false     | 'false'
| 'foo'      | {}     | undefined
| 'foo'      | { foo: 'bar' }     | undefined
| 'foo'      | { foo: { bar: { baz: {} } } }     | undefined
| 'foo'      | { foo: [ 'bar' ] }     | undefined
| 'foo'      | { foo: { bar: { baz: [ {} ] } } }     | undefined
| 'foo'      | []     | undefined
| 'foo'      | [ 'asdf' ]     | undefined
| 'foo'      | [ '' ]     | undefined
| 'foo'      | [ 235 ]     | undefined
| 'foo'      | [ false ]     | undefined
| 'foo'      | [ {} ]     | undefined
| 'foo'      | [ { foo: 'bar' } ]     | undefined
| 'foo'      | undefined     | undefined
| 'foo'      | null     | undefined
| 'foo'      | null     | undefined
| 'foo'      | null     | undefined
| 'foo'      | null     | undefined
| 'foo'      | {}     | undefined
| 'foo'      | undefined     | undefined
| 'foo'      | '1605-11-05T00:00:00.000Z'     | '1605-11-05T00:00:00.000Z'
| 'foo'      | Readable     | undefined
| 'foo'      | [ 97, 115, 100, 102 ]     | undefined
| 'foo'      | {}     | undefined
| 123      | 'bar'     | undefined
| 123      | ''     | undefined
| 123      | '0'     | 0
| 123      | '1'     | 1
| 123      | '-1.1'     | -1.1
| 123      | 'NaN'     | undefined
| 123      | 'undefined'     | undefined
| 123      | 'null'     | undefined
| 123      | '-Infinity'     | undefined
| 123      | 'Infinity'     | undefined
| 123      | 0     | 0
| 123      | 1     | 1
| 123      | -1.1     | -1.1
| 123      | true     | 1
| 123      | false     | 0
| 123      | {}     | undefined
| 123      | { foo: 'bar' }     | undefined
| 123      | { foo: { bar: { baz: {} } } }     | undefined
| 123      | { foo: [ 'bar' ] }     | undefined
| 123      | { foo: { bar: { baz: [ {} ] } } }     | undefined
| 123      | []     | undefined
| 123      | [ 'asdf' ]     | undefined
| 123      | [ '' ]     | undefined
| 123      | [ 235 ]     | undefined
| 123      | [ false ]     | undefined
| 123      | [ {} ]     | undefined
| 123      | [ { foo: 'bar' } ]     | undefined
| 123      | undefined     | undefined
| 123      | null     | undefined
| 123      | null     | undefined
| 123      | null     | undefined
| 123      | null     | undefined
| 123      | {}     | undefined
| 123      | undefined     | undefined
| 123      | '1605-11-05T00:00:00.000Z'     | undefined
| 123      | Readable     | undefined
| 123      | [ 97, 115, 100, 102 ]     | undefined
| 123      | {}     | undefined
| true      | 'bar'     | undefined
| true      | ''     | undefined
| true      | '-1.1'     | undefined
| true      | 'NaN'     | undefined
| true      | 'undefined'     | undefined
| true      | 'null'     | undefined
| true      | '-Infinity'     | undefined
| true      | 'Infinity'     | undefined
| true      | 'true'     | true
| true      | 'false'     | false
| true      | '0'     | false
| true      | '1'     | true
| true      | 0     | false
| true      | 1     | true
| true      | -1.1     | undefined
| true      | true     | true
| true      | false     | false
| true      | {}     | undefined
| true      | { foo: 'bar' }     | undefined
| true      | { foo: { bar: { baz: {} } } }     | undefined
| true      | { foo: [ 'bar' ] }     | undefined
| true      | { foo: { bar: { baz: [ {} ] } } }     | undefined
| true      | []     | undefined
| true      | [ 'asdf' ]     | undefined
| true      | [ '' ]     | undefined
| true      | [ 235 ]     | undefined
| true      | [ false ]     | undefined
| true      | [ {} ]     | undefined
| true      | [ { foo: 'bar' } ]     | undefined
| true      | undefined     | undefined
| true      | null     | undefined
| true      | null     | undefined
| true      | null     | undefined
| true      | null     | undefined
| true      | {}     | undefined
| true      | undefined     | undefined
| true      | '1605-11-05T00:00:00.000Z'     | undefined
| true      | Readable     | undefined
| true      | [ 97, 115, 100, 102 ]     | undefined
| true      | {}     | undefined
| {}      | 'bar'     | undefined
| {}      | 123     | undefined
| {}      | true     | undefined
| {}      | {}     | {}
| {}      | { foo: 'bar' }     | { foo: 'bar' }
| {}      | { foo: { bar: { baz: {} } } }     | { foo: { bar: { baz: {} } } }
| {}      | { foo: [ 'bar' ] }     | { foo: [ 'bar' ] }
| {}      | { foo: { bar: { baz: [ {} ] } } }     | { foo: { bar: { baz: [ {} ] } } }
| {}      | []     | undefined
| {}      | [ 'asdf' ]     | undefined
| {}      | [ '' ]     | undefined
| {}      | [ 235 ]     | undefined
| {}      | [ false ]     | undefined
| {}      | [ {} ]     | undefined
| {}      | [ { foo: 'bar' } ]     | undefined
| {}      | undefined     | undefined
| {}      | null     | undefined
| {}      | null     | undefined
| {}      | null     | undefined
| {}      | null     | undefined
| {}      | {}     | undefined
| {}      | undefined     | undefined
| {}      | '1605-11-05T00:00:00.000Z'     | undefined
| {}      | {}     | {}
| []      | 'bar'     | undefined
| []      | 123     | undefined
| []      | true     | undefined
| []      | {}     | undefined
| []      | { foo: 'bar' }     | undefined
| []      | { foo: { bar: { baz: {} } } }     | undefined
| []      | { foo: [ 'bar' ] }     | undefined
| []      | { foo: { bar: { baz: [ {} ] } } }     | undefined
| []      | []     | []
| []      | [ 'asdf' ]     | [ 'asdf' ]
| []      | [ '' ]     | [ '' ]
| []      | [ 235 ]     | [ 235 ]
| []      | [ false ]     | [ false ]
| []      | [ {} ]     | [ {} ]
| []      | [ { foo: 'bar' } ]     | [ { foo: 'bar' } ]
| []      | undefined     | undefined
| []      | null     | undefined
| []      | null     | undefined
| []      | null     | undefined
| []      | null     | undefined
| []      | {}     | undefined
| []      | undefined     | undefined
| []      | '1605-11-05T00:00:00.000Z'     | undefined
| []      | Readable     | undefined
| []      | {}     | undefined
| { a: 1, b: 'hi', c: false }      | { a: 11 }     | undefined
| { a: 1, b: 'hi' }      | { a: 23, b: 'stuff', d: true }     | { a: 23, b: 'stuff' }
| '*'      | 'bar'     | 'bar'
| '*'      | ''     | ''
| '*'      | '-1.1'     | '-1.1'
| '*'      | 'NaN'     | 'NaN'
| '*'      | 'undefined'     | 'undefined'
| '*'      | 'null'     | 'null'
| '*'      | '-Infinity'     | '-Infinity'
| '*'      | 'Infinity'     | 'Infinity'
| '*'      | 'true'     | 'true'
| '*'      | 'false'     | 'false'
| '*'      | '0'     | '0'
| '*'      | '1'     | '1'
| '*'      | 0     | 0
| '*'      | 1     | 1
| '*'      | -1.1     | -1.1
| '*'      | true     | true
| '*'      | false     | false
| '*'      | {}     | {}
| '*'      | { foo: 'bar' }     | { foo: 'bar' }
| '*'      | { foo: { bar: { baz: {} } } }     | { foo: { bar: { baz: {} } } }
| '*'      | { foo: [ 'bar' ] }     | { foo: [ 'bar' ] }
| '*'      | { foo: { bar: { baz: [ {} ] } } }     | { foo: { bar: { baz: [ {} ] } } }
| '*'      | []     | []
| '*'      | [ 'asdf' ]     | [ 'asdf' ]
| '*'      | [ '' ]     | [ '' ]
| '*'      | [ 235 ]     | [ 235 ]
| '*'      | [ false ]     | [ false ]
| '*'      | [ {} ]     | [ {} ]
| '*'      | [ { foo: 'bar' } ]     | [ { foo: 'bar' } ]
| '*'      | undefined     | undefined
| '*'      | null     | null
| '*'      | null     | null
| '*'      | null     | null
| '*'      | null     | null
| '*'      | {}     | {}
| '*'      | undefined     | undefined
| '*'      | '1605-11-05T00:00:00.000Z'     | '1605-11-05T00:00:00.000Z'
| '*'      | Readable     | Readable
| '*'      | [ 97, 115, 100, 102 ]     | [ 97, 115, 100, 102 ]
| '*'      | {}     | {}



## Exits

The value sent back from an exit callback in a machine's `fn` is run through `rttc.coerce()` before the triggering the user-provided callback.  The type schema is determined by calling `rttc.infer()` on the `example` for the exit as specified in the machine definition.

> + The `error` exit always outputs a JavaScript Error instance, regardless of what you pass in (though what you pass in will be used to improve the error).
> + The configured input values dictionary (`inputs`) accessible to `getExample()` consists of _exemplars_.


| `example`                | actual value provided  | yields...
| ------------------------ | ---------------------- | ----------------------
| 'foo'      | 'bar'     | 'bar'
| 'foo'      | ''     | ''
| 'foo'      | 0     | '0'
| 'foo'      | 1     | '1'
| 'foo'      | -1.1     | '-1.1'
| 'foo'      | true     | 'true'
| 'foo'      | false     | 'false'
| 'foo'      | {}     | ''
| 'foo'      | { foo: 'bar' }     | ''
| 'foo'      | { foo: { bar: { baz: {} } } }     | ''
| 'foo'      | { foo: [ 'bar' ] }     | ''
| 'foo'      | { foo: { bar: { baz: [ {} ] } } }     | ''
| 'foo'      | []     | ''
| 'foo'      | [ 'asdf' ]     | ''
| 'foo'      | [ '' ]     | ''
| 'foo'      | [ 235 ]     | ''
| 'foo'      | [ false ]     | ''
| 'foo'      | [ {} ]     | ''
| 'foo'      | [ { foo: 'bar' } ]     | ''
| 'foo'      | undefined     | ''
| 'foo'      | null     | ''
| 'foo'      | null     | ''
| 'foo'      | null     | ''
| 'foo'      | null     | ''
| 'foo'      | {}     | ''
| 'foo'      | undefined     | ''
| 'foo'      | '1605-11-05T00:00:00.000Z'     | '1605-11-05T00:00:00.000Z'
| 'foo'      | Readable     | ''
| 'foo'      | [ 97, 115, 100, 102 ]     | ''
| 'foo'      | {}     | ''
| 123      | 'bar'     | 0
| 123      | ''     | 0
| 123      | '0'     | 0
| 123      | '1'     | 1
| 123      | '-1.1'     | -1.1
| 123      | 'NaN'     | 0
| 123      | 'undefined'     | 0
| 123      | 'null'     | 0
| 123      | '-Infinity'     | 0
| 123      | 'Infinity'     | 0
| 123      | 0     | 0
| 123      | 1     | 1
| 123      | -1.1     | -1.1
| 123      | true     | 1
| 123      | false     | 0
| 123      | {}     | 0
| 123      | { foo: 'bar' }     | 0
| 123      | { foo: { bar: { baz: {} } } }     | 0
| 123      | { foo: [ 'bar' ] }     | 0
| 123      | { foo: { bar: { baz: [ {} ] } } }     | 0
| 123      | []     | 0
| 123      | [ 'asdf' ]     | 0
| 123      | [ '' ]     | 0
| 123      | [ 235 ]     | 0
| 123      | [ false ]     | 0
| 123      | [ {} ]     | 0
| 123      | [ { foo: 'bar' } ]     | 0
| 123      | undefined     | 0
| 123      | null     | 0
| 123      | null     | 0
| 123      | null     | 0
| 123      | null     | 0
| 123      | {}     | 0
| 123      | undefined     | 0
| 123      | '1605-11-05T00:00:00.000Z'     | 0
| 123      | Readable     | 0
| 123      | [ 97, 115, 100, 102 ]     | 0
| 123      | {}     | 0
| true      | 'bar'     | false
| true      | ''     | false
| true      | '-1.1'     | false
| true      | 'NaN'     | false
| true      | 'undefined'     | false
| true      | 'null'     | false
| true      | '-Infinity'     | false
| true      | 'Infinity'     | false
| true      | 'true'     | true
| true      | 'false'     | false
| true      | '0'     | false
| true      | '1'     | true
| true      | 0     | false
| true      | 1     | true
| true      | -1.1     | false
| true      | true     | true
| true      | false     | false
| true      | {}     | false
| true      | { foo: 'bar' }     | false
| true      | { foo: { bar: { baz: {} } } }     | false
| true      | { foo: [ 'bar' ] }     | false
| true      | { foo: { bar: { baz: [ {} ] } } }     | false
| true      | []     | false
| true      | [ 'asdf' ]     | false
| true      | [ '' ]     | false
| true      | [ 235 ]     | false
| true      | [ false ]     | false
| true      | [ {} ]     | false
| true      | [ { foo: 'bar' } ]     | false
| true      | undefined     | false
| true      | null     | false
| true      | null     | false
| true      | null     | false
| true      | null     | false
| true      | {}     | false
| true      | undefined     | false
| true      | '1605-11-05T00:00:00.000Z'     | false
| true      | Readable     | false
| true      | [ 97, 115, 100, 102 ]     | false
| true      | {}     | false
| {}      | 'bar'     | {}
| {}      | 123     | {}
| {}      | true     | {}
| {}      | {}     | {}
| {}      | { foo: 'bar' }     | { foo: 'bar' }
| {}      | { foo: { bar: { baz: {} } } }     | { foo: { bar: { baz: {} } } }
| {}      | { foo: [ 'bar' ] }     | { foo: [ 'bar' ] }
| {}      | { foo: { bar: { baz: [ {} ] } } }     | { foo: { bar: { baz: [ {} ] } } }
| {}      | []     | {}
| {}      | [ 'asdf' ]     | {}
| {}      | [ '' ]     | {}
| {}      | [ 235 ]     | {}
| {}      | [ false ]     | {}
| {}      | [ {} ]     | {}
| {}      | [ { foo: 'bar' } ]     | {}
| {}      | undefined     | {}
| {}      | null     | {}
| {}      | null     | {}
| {}      | null     | {}
| {}      | null     | {}
| {}      | {}     | {}
| {}      | undefined     | {}
| {}      | '1605-11-05T00:00:00.000Z'     | {}
| {}      | {}     | {}
| []      | 'bar'     | []
| []      | 123     | []
| []      | true     | []
| []      | {}     | []
| []      | { foo: 'bar' }     | []
| []      | { foo: { bar: { baz: {} } } }     | []
| []      | { foo: [ 'bar' ] }     | []
| []      | { foo: { bar: { baz: [ {} ] } } }     | []
| []      | []     | []
| []      | [ 'asdf' ]     | [ 'asdf' ]
| []      | [ '' ]     | [ '' ]
| []      | [ 235 ]     | [ 235 ]
| []      | [ false ]     | [ false ]
| []      | [ {} ]     | [ {} ]
| []      | [ { foo: 'bar' } ]     | [ { foo: 'bar' } ]
| []      | undefined     | []
| []      | null     | []
| []      | null     | []
| []      | null     | []
| []      | null     | []
| []      | {}     | []
| []      | undefined     | []
| []      | '1605-11-05T00:00:00.000Z'     | []
| []      | Readable     | []
| []      | {}     | []
| undefined      | 'bar'     | 'bar'
| undefined      | ''     | ''
| undefined      | '-1.1'     | '-1.1'
| undefined      | 'NaN'     | 'NaN'
| undefined      | 'undefined'     | 'undefined'
| undefined      | 'null'     | 'null'
| undefined      | '-Infinity'     | '-Infinity'
| undefined      | 'Infinity'     | 'Infinity'
| undefined      | 'true'     | 'true'
| undefined      | 'false'     | 'false'
| undefined      | '0'     | '0'
| undefined      | '1'     | '1'
| undefined      | 0     | 0
| undefined      | 1     | 1
| undefined      | -1.1     | -1.1
| undefined      | true     | true
| undefined      | false     | false
| undefined      | {}     | {}
| undefined      | { foo: 'bar' }     | { foo: 'bar' }
| undefined      | { foo: { bar: { baz: {} } } }     | { foo: { bar: { baz: {} } } }
| undefined      | { foo: [ 'bar' ] }     | { foo: [ 'bar' ] }
| undefined      | { foo: { bar: { baz: [ {} ] } } }     | { foo: { bar: { baz: [ {} ] } } }
| undefined      | []     | []
| undefined      | [ 'asdf' ]     | [ 'asdf' ]
| undefined      | [ '' ]     | [ '' ]
| undefined      | [ 235 ]     | [ 235 ]
| undefined      | [ false ]     | [ false ]
| undefined      | [ {} ]     | [ {} ]
| undefined      | [ { foo: 'bar' } ]     | [ { foo: 'bar' } ]
| undefined      | undefined     | undefined
| undefined      | null     | null
| undefined      | null     | null
| undefined      | null     | null
| undefined      | null     | null
| { a: 1, b: 'hi', c: false }      | { a: 23 }     | { a: 23, b: '', c: false }
| { a: 1, b: 'hi', c: false }      | { a: 23, d: true }     | { a: 23, b: '', c: false }
| {}      | { a: 23, d: true }     | { a: 23, d: true }
| []      | [ { a: 23, d: true } ]     | [ { a: 23, d: true } ]
| [ { id: 123, title: 'Scott', body: 'Scott', votes: 0, resolved: true } ]      | [ { votes: 10, title: 'first', resolved: false }, { votes: -5, title: 'second', resolved: false }, { votes: 0, title: 'third', resolved: false } ]     | [ { id: 0, votes: 10, title: 'first', body: '', resolved: false }, { id: 0, votes: -5, title: 'second', body: '', resolved: false }, { id: 0, votes: 0, title: 'third', body: '', resolved: false } ]
| [ { id: 123, title: 'Scott', body: 'Scott', votes: 0, resolved: true } ]      | [ { votes: 10, title: 'first', resolved: false }, { votes: -5, title: 'second', resolved: false }, { votes: 0, title: 'third', resolved: false }, { votes: null, title: 'fourth', resolved: false }, { title: 'fifth', resolved: false }, { title: 'sixth', resolved: false } ]     | [ { id: 0, votes: 10, title: 'first', body: '', resolved: false }, { id: 0, votes: -5, title: 'second', body: '', resolved: false }, { id: 0, votes: 0, title: 'third', body: '', resolved: false }, { id: 0, votes: 0, title: 'fourth', body: '', resolved: false }, { id: 0, votes: 0, title: 'fifth', body: '', resolved: false }, { id: 0, votes: 0, title: 'sixth', body: '', resolved: false } ]
| [ { id: 123, title: 'Scott', body: 'Scott', votes: 0, resolved: true } ]      | { '0': { votes: 10, title: 'first', resolved: false }, '1': { votes: -5, title: 'second', resolved: false }, '2': { votes: 0, title: 'third', resolved: false }, '3': { votes: null, title: 'fourth', resolved: false }, '4': { title: 'fifth', resolved: false }, '5': { title: 'sixth', resolved: false } }     | []
| '*'      | 'bar'     | 'bar'
| '*'      | ''     | ''
| '*'      | '-1.1'     | '-1.1'
| '*'      | 'NaN'     | 'NaN'
| '*'      | 'undefined'     | 'undefined'
| '*'      | 'null'     | 'null'
| '*'      | '-Infinity'     | '-Infinity'
| '*'      | 'Infinity'     | 'Infinity'
| '*'      | 'true'     | 'true'
| '*'      | 'false'     | 'false'
| '*'      | '0'     | '0'
| '*'      | '1'     | '1'
| '*'      | 0     | 0
| '*'      | 1     | 1
| '*'      | -1.1     | -1.1
| '*'      | true     | true
| '*'      | false     | false
| '*'      | {}     | {}
| '*'      | { foo: 'bar' }     | { foo: 'bar' }
| '*'      | { foo: { bar: { baz: {} } } }     | { foo: { bar: { baz: {} } } }
| '*'      | { foo: [ 'bar' ] }     | { foo: [ 'bar' ] }
| '*'      | { foo: { bar: { baz: [ {} ] } } }     | { foo: { bar: { baz: [ {} ] } } }
| '*'      | []     | []
| '*'      | [ 'asdf' ]     | [ 'asdf' ]
| '*'      | [ '' ]     | [ '' ]
| '*'      | [ 235 ]     | [ 235 ]
| '*'      | [ false ]     | [ false ]
| '*'      | [ {} ]     | [ {} ]
| '*'      | [ { foo: 'bar' } ]     | [ { foo: 'bar' } ]
| '*'      | undefined     | undefined
| '*'      | null     | null
| '*'      | null     | null
| '*'      | null     | null
| '*'      | null     | null


