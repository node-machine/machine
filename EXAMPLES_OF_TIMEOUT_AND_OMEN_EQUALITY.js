// WORKS (simple case)
// var inner = require('./')({/**/  timeout: 50,/**/  exits: { foo: {description: 'Whoops' } },/**/  fn: function(inputs, exits) {/**/    setTimeout(()=>{return exits.foo(987);},750);/**/  }/**/})()/**/.switch({/**/  error: (err)=>{ console.log('Got error:',err); },/**/  foo: ()=>{ console.log('Should NEVER make it here.  The `foo` exit of some other machine in the implementation has nothing to do with THIS `foo` exit!!'); },/**/  success: ()=>{ console.log('Got success.'); }/**/});
// ***********************************************************************************************
var inner = require('./')({
  timeout: 50,
  exits: { foo: {description: 'Whoops' } },
  fn: function(inputs, exits) {
    setTimeout(()=>{return exits.foo(987);},750);
  }
})()
.switch({
  error: (err)=>{ console.log('Got error:',err); },
  foo: ()=>{ console.log('Should NEVER make it here.  The `foo` exit of some other machine in the implementation has nothing to do with THIS `foo` exit!!'); },
  success: ()=>{ console.log('Got success.'); }
});
// ***********************************************************************************************





// DOES NOT WORK BECAUSE IT DOES NOT USE .exec() TO INVOKE `inner()`
// var inner = require('./')({/**/  timeout: 50,/**/  exits: { foo: {description: 'Whoops' } },/**/  fn: function(inputs, exits) {/**/    setTimeout(()=>{return exits.foo(987);},750);/**/  }/**/});/**/var outer = require('./')({/**/  exits: { foo: { description: 'Not the same' }},/**/  fn: function(inputs, exits) {/**/    inner({}, (err)=>{ if (err) { return exits.error(err); } return exits.success(); });/**/  }/**/});/**/outer()/**/.switch({/**/  error: (err)=>{ console.log('Got error:',err); },/**/  foo: ()=>{ console.log('Should NEVER make it here.  The `foo` exit of some other machine in the implementation has nothing to do with THIS `foo` exit!!'); },/**/  success: ()=>{ console.log('Got success.'); },/**/});
// ***********************************************************************************************
var inner = require('./')({
  timeout: 50,
  exits: { foo: {description: 'Whoops' } },
  fn: function(inputs, exits) {
    setTimeout(()=>{return exits.foo(987);},750);
  }
});

var outer = require('./')({
  exits: { foo: { description: 'Not the same' }},
  fn: function(inputs, exits) {
    inner({}, (err)=>{ if (err) { return exits.error(err); } return exits.success(); });
  }
});

outer()
.switch({
  error: (err)=>{ console.log('Got error:',err); },
  foo: ()=>{ console.log('Should NEVER make it here.  The `foo` exit of some other machine in the implementation has nothing to do with THIS `foo` exit!!'); },
  success: ()=>{ console.log('Got success.'); },
});
// ***********************************************************************************************


// WORKS
// var inner = require('./')({/**/  timeout: 50,/**/  exits: { foo: {description: 'Whoops' } },/**/  fn: function(inputs, exits) {/**/    setTimeout(()=>{return exits.foo(987);},750);/**/  }/**/});/**/var outer = require('./')({/**/  exits: { foo: { description: 'Not the same' }},/**/  fn: function(inputs, exits) {/**/    inner({}).exec((err)=>{ if (err) { return exits.error(err); } return exits.success(); });/**/  }/**/});/**/outer()/**/.switch({/**/  error: (err)=>{ console.log('Got error:',err); },/**/  foo: ()=>{ console.log('Should NEVER make it here.  The `foo` exit of some other machine in the implementation has nothing to do with THIS `foo` exit!!'); },/**/  success: ()=>{ console.log('Got success.'); },/**/});
// ***********************************************************************************************
var inner = require('./')({
  timeout: 50,
  exits: { foo: {description: 'Whoops' } },
  fn: function(inputs, exits) {
    setTimeout(()=>{return exits.foo(987);},750);
  }
});

var outer = require('./')({
  exits: { foo: { description: 'Not the same' }},
  fn: function(inputs, exits) {
    inner({}).exec((err)=>{ if (err) { return exits.error(err); } return exits.success(); });
  }
});

outer()
.switch({
  error: (err)=>{ console.log('Got error:',err); },
  foo: ()=>{ console.log('Should NEVER make it here.  The `foo` exit of some other machine in the implementation has nothing to do with THIS `foo` exit!!'); },
  success: ()=>{ console.log('Got success.'); },
});
// ***********************************************************************************************







// MORE TESTS:
// ```
// require('./')({ timeout: 50, exits: { foo: {description: 'Whoops' } }, fn: function(inputs, exits) { setTimeout(()=>{return exits.foo(987);},750); } })().switch({ error: (err)=>{ console.log('Got error:',err); }, foo: ()=>{ console.log('Should NEVER make it here.  The `foo` exit of some other machine in the implementation has nothing to do with THIS `foo` exit!!'); }, success: ()=>{ console.log('Got success.'); }, });
// ```
// ```
// var inner = require('./')({ timeout: 50, exits: { foo: {description: 'Whoops' } }, fn: function(inputs, exits) { setTimeout(()=>{return exits.foo(987);},750); } }); require('./')({ identity: 'outer', exits: { foo: { description: 'Not the same' }}, fn: function(inputs, exits) { inner({}).exec((err)=>{ if (err) { return exits.error(err); } return exits.success(); }); } })().switch({ error: (err)=>{ console.log('Got error:',err); }, foo: ()=>{ console.log('Should NEVER make it here.  The `foo` exit of some other machine in the implementation has nothing to do with THIS `foo` exit!!'); }, success: ()=>{ console.log('Got success.'); }, });
// ```
// ```
// var inner = require('./')({ exits: { foo: {description: 'Whoops' } }, fn: function(inputs, exits) { setTimeout(()=>{return exits.foo(987);},750); } }); require('./')({ identity: 'outer', timeout: 50, exits: { foo: { description: 'Not the same' }}, fn: function(inputs, exits) { inner({}).exec((err)=>{ if (err) { return exits.error(err); } return exits.success(); }); } })().switch({ error: (err)=>{ console.log('Got error:',err); }, foo: ()=>{ console.log('Should NEVER make it here.  The `foo` exit of some other machine in the implementation has nothing to do with THIS `foo` exit!!'); }, success: ()=>{ console.log('Got success.'); }, });
// ```
// ```
// var inner = require('./')({ timeout: 55, exits: { foo: {description: 'Whoops' } }, fn: function(inputs, exits) { setTimeout(()=>{return exits.foo(987);},750); } }); require('./')({ identity: 'outer', timeout: 50, exits: { foo: { description: 'Not the same' }}, fn: function(inputs, exits) { inner({}).exec((err)=>{ if (err) { return exits.error(err); } return exits.success(); }); } })().switch({ error: (err)=>{ console.log('Got error:',err); }, foo: ()=>{ console.log('Should NEVER make it here.  The `foo` exit of some other machine in the implementation has nothing to do with THIS `foo` exit!!'); }, success: ()=>{ console.log('Got success.'); }, });
// ```
// ```
// var inner = require('./')({ timeout: 45, exits: { foo: {description: 'Whoops' } }, fn: function(inputs, exits) { setTimeout(()=>{return exits.foo(987);},750); } }); require('./')({ identity: 'outer', timeout: 50, exits: { foo: { description: 'Not the same' }}, fn: function(inputs, exits) { inner({}).exec((err)=>{ if (err) { return exits.error(err); } return exits.success(); }); } })().switch({ error: (err)=>{ console.log('Got error:',err); }, foo: ()=>{ console.log('Should NEVER make it here.  The `foo` exit of some other machine in the implementation has nothing to do with THIS `foo` exit!!'); }, success: ()=>{ console.log('Got success.'); }, });
// ```
//
//
// NOTE THAT THIS WILL NEVER WORK IN THE SAME WAY (because it's using the bare, explicit cb usage):
// ```
// var inner = require('./')({ timeout: 50, exits: { foo: {description: 'Whoops' } }, fn: function(inputs, exits) { setTimeout(()=>{return exits.foo(987);},750); } }); require('./')({ identity: 'outer', exits: { foo: { description: 'Not the same' }}, fn: function(inputs, exits) { inner({}, (err)=>{ if (err) { return exits.error(err); } return exits.success(); }); } })().switch({ error: (err)=>{ console.log('Got error:',err); }, foo: ()=>{ console.log('Should NEVER make it here.  The `foo` exit of some other machine in the implementation has nothing to do with THIS `foo` exit!!'); }, success: ()=>{ console.log('Got success.'); }, });
// ```
