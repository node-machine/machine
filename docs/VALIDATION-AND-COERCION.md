# Validation and Coercion

This is a quick reference sheet for seeing how validation and coercion work for inputs and exits.

This may be slightly out-of-date-- check the tests in `test/output-coercion.test.js` and `test/input-validation.test.js` for the latest.

> These tables will eventually be automatically generated.

## Principles

Validation and coercion tend to be _**forgiving** and **protective** of the user_ but _harsh to the implementor_.

For instance, a user can pass in `"2"` (a string) to an input expecting a number example and the value will be cast to the number `2`.


## Inputs

| input required?        | actual value provided  | yields outcome...
| ---------------------- | ---------------------- | ----------------------
| `true`                 | `undefined`            | throws Error
| `false` or `undefined` | `undefined`            | `undefined`
| either way             | `null`                 | throws Error
| either way             | `Infinity`             | throws Error
| either way             | `-Infinity`            | throws Error
| either way             | `NaN`                  | throws Error


| input `typeclass`        | actual value provided  | yields outcome...
| ------------------------ | ---------------------- | ----------------------
| `"string"`               | `"hi"`                 | `"hi"`
| `"string"`               | `""`                   | `""`
| `"string"`               | `7`                    | `"7"`
| `"string"`               | `true`                 | `"true"`
| `"number"`               | `3`                    | `3`
| `"number"`               | `3.5`                  | `3.5`
| `"number"`               | `-3.5`                 | `-3.5`
| `"number"`               | `"3"`                  | `3`
| `"number"`               | `"-3.5"`               | `-3.5`
| `"boolean"`              | `true`                 | `true`
| `"boolean"`              | `"false"`              | `false`
| `"boolean"`              | `"true"`               | `true`



| input `example`          | actual value provided  | yields outcome...
| ------------------------ | ---------------------- | ----------------------
| `"hello!"`               | `"hi"`                 | `"hi"`
| `"hello!"`               | `""`                   | `""`
| `"hello!"`               | `7`                    | `"7"`
| `"hello!"`               | `true`                 | `"true"`
| `7` or `-7.7` etc.       | `3.5`                  | `3.5`
| `7` or `-7.7` etc.       | `-3`                   | `-3`
| `7` or `-7.7` etc.       | `"-3"`                 | `-3`
| `7` or `-7.7` etc.       | `"10.5"`               | `10.5`
| `true` or `false`        | `true`                 | `true`
| `true` or `false`        | `false`                | `false`
| `true` or `false`        | `"true"`               | `true`
| `true` or `false`        | `"false"`              | `false`


> TODO: objects and arrays

## Special cases
+ If a custom `validate()` function was provided for an input, all built-in validation and/or coercion is skipped.
+ The configured `inputs` object accessible to `getExample()` and `validate()` are not guaranteed to have been coerced.  You should make sure your custom `getExample()` and `validate()` functions take this into account (e.g. if a user passes the value `"3"` into some input (x) with a numeric example, the `validate` function for some other input (y) might receive `inputs.x` as either `"3"` or `3`)


## Exits


| exit `example`           | sent out by machine fn  | yields outcome...
| ------------------------ | ----------------------- | ---------------------- |
| `"hello!"`               | `"hi"`                  | `"hi"`
| `"hello!"`               | `""`                    | `""`
| `"hello!"`               | `7`                     | `"7"`
| `"hello!"`               | `true`                  | `"true"`
| `7` or `-7.7` etc.       | `3.5`                   | `3.5`
| `7` or `-7.7` etc.       | `-3`                    | `-3`
| `7` or `-7.7` etc.       | `"-3"`                  | `-3`
| `7` or `-7.7` etc.       | `"10.5"`                | `10.5`
| `true` or `false`        | `true`                  | `true`
| `true` or `false`        | `false`                 | `false`
| `true` or `false`        | `"true"`                | `true`
| `true` or `false`        | `"false"`               | `false`

> TODO: objects and arrays

## Special cases
+ If the `error` exit does not have an `example` or `getExample()`, it outputs an instance of Error.
+ The configured `inputs` object accessible to `getExample()` are not guaranteed to have been coerced.  You should make sure your custom `getExample()` function takes this into account (e.g. if a user passes the value `"3"` into some input (x) with a numeric example, the `getExample` function for one of your exits might receive `inputs.x` as either `"3"` or `3`)
