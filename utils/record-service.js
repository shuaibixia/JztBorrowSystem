const { callCloud } = require('./cloud');

function checkout(params) {
  return callCloud('record', { action: 'checkout', ...params });
}

function returnEquipment(params) {
  return callCloud('record', { action: 'returnEquipment', ...params });
}

function getMyRecords(params) {
  return callCloud('record', { action: 'getMyRecords', ...params });
}

function getByEquipment(equipmentId) {
  return callCloud('record', { action: 'getByEquipment', equipmentId });
}

function getActive() {
  return callCloud('record', { action: 'getActive' });
}

function getOverdue() {
  return callCloud('record', { action: 'getOverdue' });
}

module.exports = {
  checkout,
  returnEquipment,
  getMyRecords,
  getByEquipment,
  getActive,
  getOverdue,
};
