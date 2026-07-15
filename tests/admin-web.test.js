const assert = require('assert');
const {
  hashToken,
  readBearerToken,
  normalizePath,
  safePage,
  safePageSize,
  isActiveAdmin,
  isSuperAdmin,
  isAllowedOrigin,
} = require('../cloudfunctions/admin-web/core');

assert.strictEqual(hashToken('session-token').length, 64);
assert.notStrictEqual(hashToken('session-token'), hashToken('other-token'));
assert.strictEqual(readBearerToken({ authorization: 'Bearer session-token' }), 'session-token');
assert.strictEqual(readBearerToken({ Authorization: 'bearer another-token' }), 'another-token');
assert.strictEqual(readBearerToken({ authorization: 'Basic x' }), '');
assert.strictEqual(normalizePath('/admin-web/v1/equipment?id=1'), '/v1/equipment');
assert.strictEqual(normalizePath('/v1/dashboard'), '/v1/dashboard');
assert.strictEqual(safePage('2', 1), 2);
assert.strictEqual(safePage('0', 1), 1);
assert.strictEqual(safePageSize('120', 20), 100);
assert.strictEqual(safePageSize('bad', 20), 20);
assert.strictEqual(isActiveAdmin({ role: 'admin', isActive: true }), true);
assert.strictEqual(isActiveAdmin({ role: 'superadmin' }), true);
assert.strictEqual(isActiveAdmin({ role: 'member' }), false);
assert.strictEqual(isActiveAdmin({ role: 'admin', isActive: false }), false);
assert.strictEqual(isSuperAdmin({ role: 'superadmin', isActive: true }), true);
assert.strictEqual(isSuperAdmin({ role: 'admin', isActive: true }), false);
assert.strictEqual(isAllowedOrigin('https://admin.example.com', ['https://admin.example.com']), true);
assert.strictEqual(isAllowedOrigin('https://attacker.example.com', ['https://admin.example.com']), false);

console.log('admin-web tests passed');
