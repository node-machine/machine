# Validation and Coercion

This is a quick reference sheet for seeing how validation and coercion work for inputs and exits.

See https://github.com/node-machine/rttc for more detailed reference documentation on how type coercion and validation work in the machine spec.

> These tables will eventually be automatically generated.


## Principles

Validation and coercion tend to be _**forgiving** and **protective** of the user_ but _harsh to the implementor_.

For instance, a user can pass in `"2"` (a string) to an input expecting a number example and the value will be cast to the number `2`.



## Inputs

The runtime value passed in to a machine for a particular input is run through `rttc.validate()` before being passed in as a property of the `inputs` argument to the machine's `fn`.  The type schema to validate against is determined by calling `rttc.infer()` on the `example` for the input as specified in the machine definition.

> + If a custom `validate()` function was provided for an input, all built-in validation and/or coercion is skipped.
> + The configured `inputs` object accessible to `getExample()` and `validate()` are not guaranteed to have been coerced.  You should make sure your custom `getExample()` and `validate()` functions take this into account (e.g. if a user passes the value `"3"` into some input (x) with a numeric example, the `validate` function for some other input (y) might receive `inputs.x` as either `"3"` or `3`)


| `example`                | actual value provided  | yields...
| ------------------------ | ---------------------- | ----------------------<% _.each(validationTests, function (test) { %>
| <%= util.inspect(test.example, false, null) %>      | <%= util.inspect(test.actual, false, null) %>     | <%= util.inspect(test.result, false, null) %><% }); %>




## Exits

The value sent back from an exit callback in a machine's `fn` is run through `rttc.coerce()` before the triggering the user-provided callback.  The type schema is determined by calling `rttc.infer()` on the `example` for the exit as specified in the machine definition.

> + If the `error` exit does not have an `example` or `getExample()`, it outputs an instance of Error.
> + The configured `inputs` object accessible to `getExample()` are not guaranteed to have been coerced.  You should make sure your custom `getExample()` function takes this into account (e.g. if a user passes the value `"3"` into some input (x) with a numeric example, the `getExample` function for one of your exits might receive `inputs.x` as either `"3"` or `3`)


| `example`                | actual value provided  | yields...
| ------------------------ | ---------------------- | ----------------------<% _.each(coercionTests, function (test) { %>
| <%= util.inspect(test.example, false, null) %>      | <%= util.inspect(test.actual, false, null) %>     | <%= util.inspect(test.result, false, null) %><% }); %>


