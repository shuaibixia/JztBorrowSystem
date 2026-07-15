const { callCloud } = require('./cloud');

function createEquipment(data) {
  return callCloud('equipment', { action: 'create', ...data });
}

function updateEquipment(id, fields) {
  return callCloud('equipment', { action: 'update', id, ...fields });
}

function deleteEquipment(id) {
  return callCloud('equipment', { action: 'delete', id });
}

function uploadImage(id, fileID) {
  return callCloud('equipment', { action: 'uploadImage', id, fileID });
}

function getQrData(id) {
  return callCloud('equipment', { action: 'getQrData', id });
}

function getById(id) {
  return callCloud('equipment', { action: 'getById', id });
}

function list(params) {
  return callCloud('equipment', { action: 'list', ...params });
}

function getByQR(qrCode) {
  return callCloud('equipment', { action: 'getByQR', qrCode });
}

function getStats() {
  return callCloud('equipment', { action: 'getStats' });
}

module.exports = {
  createEquipment,
  updateEquipment,
  deleteEquipment,
  uploadImage,
  getQrData,
  getById,
  list,
  getByQR,
  getStats,
};
