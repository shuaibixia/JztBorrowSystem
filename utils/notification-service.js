const { callCloud } = require('./cloud');

function getMyNotifications(params) {
  return callCloud('notification', { action: 'getMy', ...params });
}

function markRead(id) {
  return callCloud('notification', { action: 'markRead', id });
}

function markAllRead() {
  return callCloud('notification', { action: 'markAllRead' });
}

function getUnreadCount() {
  return callCloud('notification', { action: 'getUnreadCount' });
}

function checkOverdue() {
  return callCloud('notification', { action: 'checkOverdue' });
}

module.exports = {
  getMyNotifications,
  markRead,
  markAllRead,
  getUnreadCount,
  checkOverdue,
};
