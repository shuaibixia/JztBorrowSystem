const { callCloud } = require('./cloud');

function createReservation(data) {
  return callCloud('reservation', { action: 'create', ...data });
}

function listReservations(params) {
  return callCloud('reservation', { action: 'list', ...params });
}

function getMyReservations(params) {
  return callCloud('reservation', { action: 'getMy', ...params });
}

function cancelReservation(id) {
  return callCloud('reservation', { action: 'cancel', id });
}

function confirmReservation(id) {
  return callCloud('reservation', { action: 'confirm', id });
}

function getReservationById(id) {
  return callCloud('reservation', { action: 'getById', id });
}

module.exports = {
  createReservation,
  listReservations,
  getMyReservations,
  cancelReservation,
  confirmReservation,
  getReservationById,
};
