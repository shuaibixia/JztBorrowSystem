const { callCloud } = require('./cloud');

function listMembers(params) {
  return callCloud('user', { action: 'listMembers', ...params });
}

function updateRole(userId, role) {
  return callCloud('user', { action: 'updateRole', userId, role });
}

function toggleActive(userId) {
  return callCloud('user', { action: 'toggleActive', userId });
}

module.exports = {
  listMembers,
  updateRole,
  toggleActive,
};
