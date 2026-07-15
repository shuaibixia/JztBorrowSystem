const { callCloud } = require('./cloud');

function getStats() {
  return callCloud('stats', { action: 'getAdminStats' });
}

function addMaintenance(data) {
  return callCloud('maintenance', { action: 'add', ...data });
}

function getMaintenance(equipmentId, params) {
  return callCloud('maintenance', { action: 'listByEquipment', equipmentId, ...params });
}

module.exports = {
  getStats,
  addMaintenance,
  getMaintenance,
};
