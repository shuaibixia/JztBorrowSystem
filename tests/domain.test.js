const assert = require('assert');
const {
  isAdminUser,
  isSuperAdminUser,
  normalizeEquipment,
  normalizeApproval,
  normalizeMaintenance,
  canDirectCheckout,
  canReturnEquipment,
  canTransitionEquipmentStatus,
  validateEquipmentTransition,
  getEquipmentCategoryPrefix,
  formatEquipmentQrCode,
  parseEquipmentQrSequence,
  getEquipmentCounterId,
  buildCheckoutRecord,
  buildCheckoutEquipmentUpdate,
  buildReturnEquipmentUpdate,
  buildReturnRecordUpdate,
  hasReservationConflict,
  hasConfirmedReservationConflict,
  findCompletableReservation,
  buildMigrationPlan,
} = require('../utils/domain');

function testPermissions() {
  assert.strictEqual(isAdminUser({ role: 'member' }), false);
  assert.strictEqual(isAdminUser({ role: 'admin' }), true);
  assert.strictEqual(isAdminUser({ role: 'superadmin' }), true);
  assert.strictEqual(isSuperAdminUser({ role: 'admin' }), false);
  assert.strictEqual(isSuperAdminUser({ role: 'superadmin' }), true);
  assert.strictEqual(canDirectCheckout({ role: 'member', isActive: true }), false);
  assert.strictEqual(canDirectCheckout({ role: 'admin', isActive: true }), true);
  assert.strictEqual(canDirectCheckout({ role: 'superadmin', isActive: true }), true);
  assert.strictEqual(canDirectCheckout({ role: 'admin', isActive: false }), false);
  assert.strictEqual(canDirectCheckout({ role: 'superadmin', isActive: false }), false);
  assert.strictEqual(canReturnEquipment({ role: 'member', _openid: 'u1', isActive: true }, { currentHolder: 'u1' }), true);
  assert.strictEqual(canReturnEquipment({ role: 'member', _openid: 'u2', isActive: true }, { currentHolder: 'u1' }), false);
  assert.strictEqual(canReturnEquipment({ role: 'admin', _openid: 'admin', isActive: true }, { currentHolder: 'u1' }), true);
  assert.strictEqual(canReturnEquipment({ role: 'admin', _openid: 'admin', isActive: false }, { currentHolder: 'u1' }), false);
  assert.strictEqual(canReturnEquipment({ role: 'superadmin', _openid: 'root', isActive: false }, { currentHolder: 'u1' }), false);
}

function testNormalizeEquipment() {
  const item = normalizeEquipment({ qr_code: 'EQ-CAM-001', checkedOutBy: 'openid-1' });
  assert.strictEqual(item.qrCode, 'EQ-CAM-001');
  assert.strictEqual(item.currentHolder, 'openid-1');
  assert.strictEqual(item.checkedOutAt, null);
}

function testNormalizeApproval() {
  const item = normalizeApproval({
    applicantId: 'u1',
    applicantOpenId: 'o1',
    applicantName: '张三',
    reviewerId: 'u2',
    reviewerOpenId: 'o2',
  });
  assert.strictEqual(item.requesterId, 'u1');
  assert.strictEqual(item.requesterOpenId, 'o1');
  assert.strictEqual(item.requesterName, '张三');
  assert.strictEqual(item.approverId, 'u2');
  assert.strictEqual(item.approverOpenId, 'o2');
}

function testNormalizeMaintenance() {
  const item = normalizeMaintenance({ cost: '12.5' });
  assert.strictEqual(item.type, 'maintenance');
  assert.strictEqual(item.maintenanceType, 'repair');
  assert.strictEqual(item.cost, 12.5);
}

function testReservationConflict() {
  const list = [
    { status: 'pending', startDate: '2026-07-02T09:00:00.000Z', endDate: '2026-07-03T09:00:00.000Z' },
    { status: 'cancelled', startDate: '2026-07-04T09:00:00.000Z', endDate: '2026-07-05T09:00:00.000Z' },
  ];
  assert.strictEqual(hasReservationConflict(list, '2026-07-02T10:00:00.000Z', '2026-07-02T11:00:00.000Z'), true);
  assert.strictEqual(hasReservationConflict(list, '2026-07-03T09:00:00.000Z', '2026-07-03T10:00:00.000Z'), false);
  assert.strictEqual(hasReservationConflict(list, '2026-07-04T10:00:00.000Z', '2026-07-04T11:00:00.000Z'), false);
  assert.strictEqual(hasReservationConflict(list, 'invalid-date', '2026-07-02T11:00:00.000Z'), false);
  assert.strictEqual(hasReservationConflict(list, '2026-07-03T09:00:00.000Z', '2026-07-03T09:30:00.000Z'), false);
}

function testConfirmedReservationConflict() {
  const now = '2026-07-02T10:00:00.000Z';
  const reservations = [
    { status: 'confirmed', startDate: '2026-07-02T09:00:00.000Z', endDate: '2026-07-02T11:00:00.000Z' },
    { status: 'confirmed', startDate: '2026-07-03T09:00:00.000Z', endDate: '2026-07-03T11:00:00.000Z' },
    { status: 'cancelled', startDate: '2026-07-02T09:00:00.000Z', endDate: '2026-07-02T11:00:00.000Z' },
    { status: 'completed', startDate: '2026-07-02T09:00:00.000Z', endDate: '2026-07-02T11:00:00.000Z' },
    { status: 'pending', startDate: '2026-07-02T09:00:00.000Z', endDate: '2026-07-02T11:00:00.000Z' },
  ];
  assert.strictEqual(hasConfirmedReservationConflict(reservations, now), true);
  assert.strictEqual(hasConfirmedReservationConflict([reservations[1]], now), false);
  assert.strictEqual(hasConfirmedReservationConflict(reservations.slice(2), now), false);
  assert.strictEqual(hasConfirmedReservationConflict(reservations, 'invalid-date'), false);
  assert.strictEqual(
    hasConfirmedReservationConflict(
      [{ status: 'confirmed', startDate: 'invalid-date', endDate: '2026-07-02T14:00:00.000Z' }],
      now
    ),
    false
  );
  assert.strictEqual(
    hasConfirmedReservationConflict(
      [{ status: 'confirmed', startDate: '2026-07-02T12:00:00.000Z', endDate: '2026-07-02T14:00:00.000Z' }],
      now,
      '2026-07-02T13:00:00.000Z'
    ),
    true
  );
  assert.strictEqual(
    hasConfirmedReservationConflict(
      [{ status: 'confirmed', startDate: '2026-07-02T12:00:00.000Z', endDate: '2026-07-02T14:00:00.000Z' }],
      now,
      '2026-07-02T11:00:00.000Z'
    ),
    false
  );
  assert.strictEqual(
    hasConfirmedReservationConflict(
      [{ status: 'confirmed', startDate: '2026-07-02T09:00:00.000Z', endDate: '2026-07-02T11:00:00.000Z' }],
      '2026-07-02T11:00:00.000Z'
    ),
    false
  );
  assert.strictEqual(
    hasConfirmedReservationConflict(
      [{ status: 'confirmed', startDate: '2026-07-02T09:00:00.000Z', endDate: '2026-07-02T11:00:00.000Z' }],
      '2026-07-02T11:00:00.000Z',
      '2026-07-02T12:00:00.000Z'
    ),
    false
  );
  assert.strictEqual(
    hasConfirmedReservationConflict(
      [{ status: 'confirmed', userOpenId: 'u1', startDate: '2026-07-02T09:00:00.000Z', endDate: '2026-07-02T11:00:00.000Z' }],
      now,
      null,
      { allowedUserOpenId: 'u1' }
    ),
    false
  );
  assert.strictEqual(
    hasConfirmedReservationConflict(
      [{ status: 'confirmed', userOpenId: 'u2', startDate: '2026-07-02T09:00:00.000Z', endDate: '2026-07-02T11:00:00.000Z' }],
      now,
      null,
      { allowedUserOpenId: 'u1' }
    ),
    true
  );
}

function testCompletableReservationMatch() {
  const reservations = [
    {
      _id: 'r2',
      equipmentId: 'eq1',
      userOpenId: 'u1',
      status: 'confirmed',
      startDate: '2026-07-02T10:00:00.000Z',
      endDate: '2026-07-02T12:00:00.000Z',
    },
    {
      _id: 'r1',
      equipmentId: 'eq1',
      userOpenId: 'u1',
      status: 'confirmed',
      startDate: '2026-07-02T09:00:00.000Z',
      endDate: '2026-07-02T11:00:00.000Z',
    },
    {
      _id: 'wrong-user',
      equipmentId: 'eq1',
      userOpenId: 'u2',
      status: 'confirmed',
      startDate: '2026-07-02T09:00:00.000Z',
      endDate: '2026-07-02T11:00:00.000Z',
    },
    {
      _id: 'cancelled',
      equipmentId: 'eq1',
      userOpenId: 'u1',
      status: 'cancelled',
      startDate: '2026-07-02T09:00:00.000Z',
      endDate: '2026-07-02T11:00:00.000Z',
    },
  ];
  const match = findCompletableReservation(reservations, {
    equipmentId: 'eq1',
    userOpenId: 'u1',
    checkoutAt: '2026-07-02T10:30:00.000Z',
    returnAt: '2026-07-02T11:30:00.000Z',
  });
  assert.strictEqual(match._id, 'r1');
  assert.strictEqual(findCompletableReservation(reservations, {
    equipmentId: 'eq2',
    userOpenId: 'u1',
    checkoutAt: '2026-07-02T10:30:00.000Z',
    returnAt: '2026-07-02T11:30:00.000Z',
  }), null);
  assert.strictEqual(findCompletableReservation(reservations, {
    equipmentId: 'eq1',
    userOpenId: 'u1',
    checkoutAt: '2026-07-03T10:30:00.000Z',
    returnAt: '2026-07-03T11:30:00.000Z',
  }), null);
  assert.strictEqual(findCompletableReservation(reservations, {
    equipmentId: 'eq1',
    userOpenId: 'u1',
    checkoutAt: 'invalid-date',
    returnAt: '2026-07-02T11:30:00.000Z',
  }), null);
  assert.strictEqual(findCompletableReservation(reservations, {
    equipmentId: 'eq1',
    userOpenId: 'u1',
    checkoutAt: '2026-07-02T12:00:00.000Z',
    returnAt: '2026-07-02T13:00:00.000Z',
  }), null);
}

function testEquipmentTransitions() {
  assert.strictEqual(canTransitionEquipmentStatus('available', 'checked_out'), true);
  assert.strictEqual(canTransitionEquipmentStatus('checked_out', 'available'), true);
  assert.strictEqual(canTransitionEquipmentStatus('available', 'maintenance'), true);
  assert.strictEqual(canTransitionEquipmentStatus('maintenance', 'available'), true);
  assert.strictEqual(canTransitionEquipmentStatus('available', 'retired'), true);
  assert.strictEqual(canTransitionEquipmentStatus('maintenance', 'retired'), true);
  assert.strictEqual(canTransitionEquipmentStatus('checked_out', 'retired'), false);
  assert.strictEqual(canTransitionEquipmentStatus('retired', 'available'), false);
  assert.deepStrictEqual(validateEquipmentTransition('available', 'checked_out'), { ok: true });
  assert.strictEqual(validateEquipmentTransition('checked_out', 'retired').ok, false);
}

function testEquipmentQrCodeRules() {
  assert.strictEqual(getEquipmentCategoryPrefix('camera'), 'CAM');
  assert.strictEqual(getEquipmentCategoryPrefix('lens'), 'LEN');
  assert.strictEqual(getEquipmentCategoryPrefix('tripod'), 'TRI');
  assert.strictEqual(getEquipmentCategoryPrefix('lighting'), 'LIT');
  assert.strictEqual(getEquipmentCategoryPrefix('audio'), 'AUD');
  assert.strictEqual(getEquipmentCategoryPrefix('accessory'), 'ACC');
  assert.strictEqual(getEquipmentCategoryPrefix('unknown'), 'UNK');
  assert.strictEqual(formatEquipmentQrCode('camera', 1), 'EQ-CAM-001');
  assert.strictEqual(formatEquipmentQrCode('unknown', 2), 'EQ-UNK-002');
  assert.strictEqual(formatEquipmentQrCode('camera', 1001), 'EQ-CAM-1001');
  assert.strictEqual(formatEquipmentQrCode('camera', 0), '');
  assert.strictEqual(parseEquipmentQrSequence('EQ-CAM-001', 'camera'), 1);
  assert.strictEqual(parseEquipmentQrSequence('EQ-CAM-1001', 'camera'), 1001);
  assert.strictEqual(parseEquipmentQrSequence('EQ-UNK-002', 'unknown'), 2);
  assert.strictEqual(parseEquipmentQrSequence('EQ-LEN-001', 'camera'), null);
  assert.strictEqual(parseEquipmentQrSequence('CAM-001', 'camera'), null);
  assert.strictEqual(parseEquipmentQrSequence('', 'camera'), null);
  assert.strictEqual(getEquipmentCounterId('camera'), 'equipment_camera');
}

function testCheckoutRecordBuilders() {
  const now = new Date('2026-07-02T09:00:00.000Z');
  const equipment = {
    _id: 'eq1',
    name: 'Canon R5',
    condition: 'good',
  };
  const user = {
    _id: 'user1',
    _openid: 'openid1',
    nickName: 'Alice',
    role: 'admin',
    isActive: true,
  };
  const directRecord = buildCheckoutRecord({
    equipment,
    user,
    purpose: '拍摄活动',
    expectedReturnAt: '2026-07-03T09:00:00.000Z',
    checkoutAt: now,
  });
  const approvalRecord = buildCheckoutRecord({
    equipment,
    user,
    purpose: '拍摄活动',
    expectedReturnAt: '2026-07-03T09:00:00.000Z',
    checkoutAt: now,
    approvalId: 'approval1',
  });
  const { approvalId, ...approvalWithoutId } = approvalRecord;
  assert.deepStrictEqual(approvalWithoutId, directRecord);
  assert.strictEqual(approvalId, 'approval1');
  assert.deepStrictEqual(buildCheckoutEquipmentUpdate(user._openid, now), {
    status: 'checked_out',
    currentHolder: 'openid1',
    checkedOutAt: now,
    updatedAt: now,
  });
  assert.deepStrictEqual(buildReturnEquipmentUpdate({ condition: 'good' }, 'fair', now), {
    status: 'available',
    currentHolder: null,
    checkedOutAt: null,
    condition: 'fair',
    updatedAt: now,
  });
  assert.deepStrictEqual(buildReturnRecordUpdate('fair', 'ok', now), {
    returnAt: now,
    condition_after: 'fair',
    remark: 'ok',
    status: 'returned',
    updatedAt: now,
  });
}

function testMigrationPlan() {
  const plan = buildMigrationPlan({
    equipment: [
      { _id: 'eq-legacy', qr_code: 'A' },
      { _id: 'eq-canonical', qrCode: 'B', qr_code: 'B' },
      { _id: 'eq-dup-1', qrCode: 'DUP', serialNumber: 'SN-DUP' },
      { _id: 'eq-dup-2', qrCode: 'DUP', serialNumber: 'SN-DUP' },
      { _id: 'eq-missing' },
    ],
    approvals: [
      { _id: 'ap-1', applicantOpenId: 'o1' },
      { _id: 'ap-2', reviewerOpenId: 'o2' },
      { _id: 'ap-3', requesterOpenId: 'o3' },
    ],
    records: [
      { _id: 'm-1', type: 'maintenance' },
      { _id: 'm-2', type: 'maintenance' },
      { _id: 'r-1', status: 'active' },
    ],
    maintenanceLogs: [
      { _id: 'log-1', sourceRecordId: 'm-2' },
    ],
  });
  assert.strictEqual(plan.summary.hasPendingMigration, true);
  assert.strictEqual(plan.summary.legacyFieldsArePreserved, true);
  assert.deepStrictEqual(plan.counts.pending, {
    equipmentQrCodeBackfill: 1,
    approvalFieldNormalize: 2,
    maintenanceRecordsMove: 1,
  });
  assert.deepStrictEqual(plan.counts.legacyRetained, {
    equipmentQrCodeLegacyField: 2,
    approvalLegacyFields: 2,
    maintenanceRecordsInRecords: 2,
  });
  assert.strictEqual(plan.risks.some((item) => item.type === 'duplicateEquipmentQrCode' && item.severity === 'blocker'), true);
  assert.strictEqual(plan.risks.some((item) => item.type === 'duplicateEquipmentSerialNumber'), true);
  assert.strictEqual(plan.risks.some((item) => item.type === 'missingQrCodeWithoutLegacy'), true);
  assert.strictEqual(plan.risks.some((item) => item.type === 'maintenanceAlreadyCopied'), true);
  assert.strictEqual(plan.batches.pageSize, 100);
  assert.strictEqual(plan.nextSteps.length > 0, true);

  const cleanPlan = buildMigrationPlan({
    equipment: [{ _id: 'eq-clean', qrCode: 'EQ-CAM-001', serialNumber: 'SN-1' }],
    approvals: [{ _id: 'ap-clean', requesterOpenId: 'o1', approverOpenId: 'o2' }],
    records: [{ _id: 'r-clean', status: 'returned' }],
    maintenanceLogs: [],
  });
  assert.strictEqual(cleanPlan.summary.hasPendingMigration, false);
  assert.strictEqual(cleanPlan.summary.totalPending, 0);
  assert.deepStrictEqual(cleanPlan.counts.pending, {
    equipmentQrCodeBackfill: 0,
    approvalFieldNormalize: 0,
    maintenanceRecordsMove: 0,
  });
  assert.deepStrictEqual(cleanPlan.risks, []);
}

testPermissions();
testNormalizeEquipment();
testNormalizeApproval();
testNormalizeMaintenance();
testReservationConflict();
testConfirmedReservationConflict();
testCompletableReservationMatch();
testEquipmentTransitions();
testEquipmentQrCodeRules();
testCheckoutRecordBuilders();
testMigrationPlan();

console.log('domain tests passed');
