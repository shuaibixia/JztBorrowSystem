const ADMIN_ROLES = ['admin', 'superadmin'];
const SUPER_ADMIN_ROLE = 'superadmin';
const RESERVATION_BLOCKING_STATUS = ['confirmed'];
const EQUIPMENT_CATEGORY_PREFIX = {
  camera: 'CAM',
  lens: 'LEN',
  tripod: 'TRI',
  lighting: 'LIT',
  audio: 'AUD',
  accessory: 'ACC',
};
const EQUIPMENT_STATUS_TRANSITIONS = {
  available: ['checked_out', 'maintenance', 'retired'],
  checked_out: ['available'],
  maintenance: ['available', 'retired'],
  retired: [],
};

function isAdminUser(user) {
  return !!user && ADMIN_ROLES.includes(user.role);
}

function isActiveUser(user) {
  return !!user && user.isActive !== false;
}

function canDirectCheckout(user) {
  return isActiveUser(user) && isAdminUser(user);
}

function canReturnEquipment(user, equipment) {
  if (!isActiveUser(user) || !equipment) return false;
  return isAdminUser(user) || equipment.currentHolder === user._openid;
}

function canTransitionEquipmentStatus(fromStatus, toStatus) {
  return (EQUIPMENT_STATUS_TRANSITIONS[fromStatus] || []).includes(toStatus);
}

function getEquipmentCategoryPrefix(category) {
  return EQUIPMENT_CATEGORY_PREFIX[category] || 'UNK';
}

function formatEquipmentQrCode(category, seq) {
  const safeSeq = Number(seq);
  if (!Number.isFinite(safeSeq) || safeSeq < 1) return '';
  return `EQ-${getEquipmentCategoryPrefix(category)}-${String(Math.floor(safeSeq)).padStart(3, '0')}`;
}

function parseEquipmentQrSequence(qrCode, category) {
  const prefix = getEquipmentCategoryPrefix(category);
  const match = String(qrCode || '').match(new RegExp(`^EQ-${prefix}-(\\d+)$`));
  if (!match) return null;
  const seq = Number(match[1]);
  return Number.isFinite(seq) && seq > 0 ? seq : null;
}

function getEquipmentCounterId(category) {
  return `equipment_${category || 'unknown'}`;
}

function getDisplayUserName(user, fallbackName) {
  if (!user) return fallbackName || '';
  return user.nickName || user.studentName || fallbackName || '';
}

function buildCheckoutRecord({ equipment, user, purpose, expectedReturnAt, checkoutAt, approvalId }) {
  const now = checkoutAt || new Date();
  const record = {
    equipmentId: equipment._id,
    equipmentName: equipment.name,
    userId: user._id,
    userOpenId: user._openid,
    userName: getDisplayUserName(user),
    action: 'checkout',
    checkoutAt: now,
    returnAt: null,
    expectedReturnAt: expectedReturnAt ? new Date(expectedReturnAt) : null,
    purpose: purpose || '',
    condition_before: equipment.condition || 'good',
    condition_after: null,
    remark: '',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };
  if (approvalId) record.approvalId = approvalId;
  return record;
}

function buildCheckoutEquipmentUpdate(userOpenId, checkoutAt) {
  const now = checkoutAt || new Date();
  return {
    status: 'checked_out',
    currentHolder: userOpenId,
    checkedOutAt: now,
    updatedAt: now,
  };
}

function buildReturnEquipmentUpdate(equipment, conditionAfter, returnedAt) {
  const now = returnedAt || new Date();
  return {
    status: 'available',
    currentHolder: null,
    checkedOutAt: null,
    condition: conditionAfter || equipment.condition,
    updatedAt: now,
  };
}

function buildReturnRecordUpdate(conditionAfter, remark, returnedAt) {
  const now = returnedAt || new Date();
  return {
    returnAt: now,
    condition_after: conditionAfter || '',
    remark: remark || '',
    status: 'returned',
    updatedAt: now,
  };
}

function asTime(value) {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

function windowsOverlap(startA, endA, startB, endB) {
  const aStart = asTime(startA);
  const aEnd = asTime(endA);
  const bStart = asTime(startB);
  const bEnd = asTime(endB);
  if (aStart === null || aEnd === null || bStart === null || bEnd === null) return false;
  return aStart < bEnd && aEnd > bStart;
}

function hasConfirmedReservationConflict(existing, startDate, endDate, options = {}) {
  const start = asTime(startDate);
  if (start === null) return false;
  const end = endDate ? asTime(endDate) : null;
  const allowedUserOpenId = options.allowedUserOpenId || '';

  return (existing || []).some((item) => {
    if (!RESERVATION_BLOCKING_STATUS.includes(item.status)) return false;
    if (allowedUserOpenId && item.userOpenId === allowedUserOpenId) return false;
    if (end === null) {
      const itemStart = asTime(item.startDate);
      const itemEnd = asTime(item.endDate);
      return itemStart !== null && itemEnd !== null && itemStart <= start && start < itemEnd;
    }
    return windowsOverlap(start, end, item.startDate, item.endDate);
  });
}

function findCompletableReservation(existing, { equipmentId, userOpenId, checkoutAt, returnAt }) {
  const matches = (existing || [])
    .filter((item) => {
      if (item.status !== 'confirmed') return false;
      if (item.equipmentId !== equipmentId) return false;
      if (item.userOpenId !== userOpenId) return false;
      return windowsOverlap(checkoutAt, returnAt, item.startDate, item.endDate);
    })
    .sort((a, b) => asTime(a.startDate) - asTime(b.startDate));
  return matches[0] || null;
}

function hasValue(value) {
  return value !== undefined && value !== null && value !== '';
}

function getDuplicateValues(items, field) {
  const counts = {};
  (items || []).forEach((item) => {
    const value = item && item[field];
    if (!hasValue(value)) return;
    counts[value] = (counts[value] || 0) + 1;
  });
  return Object.keys(counts)
    .filter((value) => counts[value] > 1)
    .map((value) => ({ value, count: counts[value] }));
}

function needsApprovalFieldNormalize(item) {
  if (!item) return false;
  const requesterNeedsBackfill = !hasValue(item.requesterOpenId) && hasValue(item.applicantOpenId);
  const approverNeedsBackfill = !hasValue(item.approverOpenId) && hasValue(item.reviewerOpenId);
  const requesterIdNeedsBackfill = !hasValue(item.requesterId) && hasValue(item.applicantId);
  const requesterNameNeedsBackfill = !hasValue(item.requesterName) && hasValue(item.applicantName);
  const approverIdNeedsBackfill = !hasValue(item.approverId) && hasValue(item.reviewerId);
  return requesterNeedsBackfill || approverNeedsBackfill || requesterIdNeedsBackfill || requesterNameNeedsBackfill || approverIdNeedsBackfill;
}

function buildMigrationRisks({ equipment, records, maintenanceLogs }) {
  const existingMaintenanceSources = new Set((maintenanceLogs || []).map((item) => item.sourceRecordId).filter(Boolean));
  const duplicateQrCodes = getDuplicateValues(equipment, 'qrCode');
  const duplicateSerialNumbers = getDuplicateValues(equipment, 'serialNumber');
  const missingQrWithoutLegacy = (equipment || []).filter((item) => !hasValue(item.qrCode) && !hasValue(item.qr_code));
  const alreadyCopiedMaintenance = (records || []).filter((item) => item.type === 'maintenance' && existingMaintenanceSources.has(item._id));
  const risks = [];

  if (duplicateQrCodes.length > 0) {
    risks.push({
      type: 'duplicateEquipmentQrCode',
      severity: 'blocker',
      count: duplicateQrCodes.length,
      message: '存在重复 equipment.qrCode，迁移前需要人工处理，避免扫码指向不确定设备',
      samples: duplicateQrCodes.slice(0, 10),
    });
  }
  if (duplicateSerialNumbers.length > 0) {
    risks.push({
      type: 'duplicateEquipmentSerialNumber',
      severity: 'warning',
      count: duplicateSerialNumbers.length,
      message: '存在重复非空 equipment.serialNumber，会影响后续唯一性约束和导入判断',
      samples: duplicateSerialNumbers.slice(0, 10),
    });
  }
  if (missingQrWithoutLegacy.length > 0) {
    risks.push({
      type: 'missingQrCodeWithoutLegacy',
      severity: 'warning',
      count: missingQrWithoutLegacy.length,
      message: '存在既没有 qrCode 也没有 qr_code 的设备，自动迁移无法补齐二维码',
      samples: missingQrWithoutLegacy.slice(0, 10).map((item) => item._id || item.name || ''),
    });
  }
  if (alreadyCopiedMaintenance.length > 0) {
    risks.push({
      type: 'maintenanceAlreadyCopied',
      severity: 'info',
      count: alreadyCopiedMaintenance.length,
      message: '部分旧 records 维保记录已存在对应 maintenanceLogs，apply 会跳过这些记录以保持幂等',
      samples: alreadyCopiedMaintenance.slice(0, 10).map((item) => item._id || ''),
    });
  }

  return risks;
}

function buildMigrationPlan(snapshot) {
  const data = snapshot || {};
  const equipment = data.equipment || [];
  const approvals = data.approvals || [];
  const records = data.records || [];
  const maintenanceLogs = data.maintenanceLogs || [];
  const existingMaintenanceSources = new Set(maintenanceLogs.map((item) => item.sourceRecordId).filter(Boolean));
  const pendingEquipment = equipment.filter((item) => !hasValue(item.qrCode) && hasValue(item.qr_code));
  const pendingApprovals = approvals.filter(needsApprovalFieldNormalize);
  const pendingMaintenanceRecords = records.filter((item) => item.type === 'maintenance' && !existingMaintenanceSources.has(item._id));
  const legacyEquipmentQrCode = equipment.filter((item) => hasValue(item.qr_code));
  const legacyApprovals = approvals.filter((item) => hasValue(item.applicantOpenId) || hasValue(item.reviewerOpenId));
  const legacyMaintenanceRecords = records.filter((item) => item.type === 'maintenance');
  const totalPending = pendingEquipment.length + pendingApprovals.length + pendingMaintenanceRecords.length;

  return {
    summary: {
      hasPendingMigration: totalPending > 0,
      totalPending,
      legacyFieldsArePreserved: true,
      note: 'apply 只补齐 canonical 字段和复制维保日志，不删除旧字段；旧字段仍存在不代表迁移失败。',
    },
    counts: {
      pending: {
        equipmentQrCodeBackfill: pendingEquipment.length,
        approvalFieldNormalize: pendingApprovals.length,
        maintenanceRecordsMove: pendingMaintenanceRecords.length,
      },
      legacyRetained: {
        equipmentQrCodeLegacyField: legacyEquipmentQrCode.length,
        approvalLegacyFields: legacyApprovals.length,
        maintenanceRecordsInRecords: legacyMaintenanceRecords.length,
      },
    },
    risks: buildMigrationRisks({ equipment, records, maintenanceLogs }),
    batches: {
      pageSize: 100,
      equipmentQrCodeBackfill: Math.ceil(pendingEquipment.length / 100),
      approvalFieldNormalize: Math.ceil(pendingApprovals.length / 100),
      maintenanceRecordsMove: Math.ceil(pendingMaintenanceRecords.length / 100),
    },
    nextSteps: totalPending > 0
      ? ['确认 risks 中没有 blocker', '部署 migration 云函数', '以 superadmin 调用 migration.apply', '再次执行 dryRun 确认 pending 归零或只剩人工处理项']
      : ['无需执行 apply，或仅保留旧字段等待后续清理任务'],
  };
}

module.exports = {
  ADMIN_ROLES,
  SUPER_ADMIN_ROLE,
  RESERVATION_BLOCKING_STATUS,
  EQUIPMENT_CATEGORY_PREFIX,
  EQUIPMENT_STATUS_TRANSITIONS,
  isAdminUser,
  isActiveUser,
  canDirectCheckout,
  canReturnEquipment,
  canTransitionEquipmentStatus,
  getEquipmentCategoryPrefix,
  formatEquipmentQrCode,
  parseEquipmentQrSequence,
  getEquipmentCounterId,
  buildCheckoutRecord,
  buildCheckoutEquipmentUpdate,
  buildReturnEquipmentUpdate,
  buildReturnRecordUpdate,
  hasConfirmedReservationConflict,
  findCompletableReservation,
  needsApprovalFieldNormalize,
  buildMigrationPlan,
};
