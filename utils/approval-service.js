const { callCloud } = require('./cloud');

function createApproval(data) {
  return callCloud('approval', { action: 'create', ...data });
}

function getById(id) {
  return callCloud('approval', { action: 'getById', id });
}

function listApprovals(params) {
  return callCloud('approval', { action: 'list', ...params });
}

function getMyPendingApprovals(params) {
  return callCloud('approval', { action: 'getMyPending', ...params });
}

function approveRequest(id, remark) {
  return callCloud('approval', { action: 'approve', id, remark });
}

function rejectRequest(id, rejectReason) {
  return callCloud('approval', { action: 'reject', id, rejectReason });
}

module.exports = {
  createApproval,
  getById,
  listApprovals,
  getMyPendingApprovals,
  approveRequest,
  rejectRequest,
};
