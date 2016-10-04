module.exports = function stripStackMessage(e) {
  return e.stack.slice(e.name.length +2 + e.message.length+1);
};
