// utils/notifications.js
let contactMessages = 0;

module.exports = {
  increment: () => contactMessages++,
  get: () => contactMessages,
  reset: () => { contactMessages = 0; }
};
