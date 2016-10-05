/**
 * getStackTraceWithoutInitialMessage
 * @param  {Error} e An Error instance
 * @return {String}   The stack trace from the error instance with the
 *                    initial error name + ': ' + message + newline stripped off.
 */
module.exports = function getStackTraceWithoutInitialMessage(e) {
  return e.stack.slice(e.name.length +2 + e.message.length+1);
};
