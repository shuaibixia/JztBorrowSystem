const assert = require('assert');
const operations = require('../cloudfunctions/_shared/admin-web-operations');

[
  'checkoutForMember',
  'returnRecord',
  'approveApproval',
  'rejectApproval',
  'confirmReservation',
  'cancelReservation',
  'addMaintenanceLog',
].forEach((name) => assert.strictEqual(typeof operations[name], 'function'));

console.log('admin-web operation exports passed');
