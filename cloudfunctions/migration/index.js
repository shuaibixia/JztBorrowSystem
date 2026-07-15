const cloud = require('wx-server-sdk');
const { initCloud } = require('./_shared/config');
const { requireSuperAdmin } = require('./_shared/auth');
const {
  buildMigrationPlan,
  needsApprovalFieldNormalize,
} = require('./_shared/domain');

initCloud(cloud);
const db = cloud.database();
const _ = db.command;
const PAGE_SIZE = 100;

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { action } = event;

  switch (action) {
    case 'dryRun':
      return handleDryRun(OPENID);
    case 'apply':
      return handleApply(OPENID);
    default:
      return { code: 400, message: '未知操作' };
  }
};

async function handleDryRun(OPENID) {
  try {
    const { error } = await requireSuperAdmin(db, OPENID);
    if (error) return error;
    const data = await collectMigrationPlan();
    return { code: 0, data };
  } catch (err) {
    console.error('迁移预检失败:', err);
    return {
      code: 500,
      message: '迁移预检失败',
      error: normalizeError(err),
    };
  }
}

async function handleApply(OPENID) {
  try {
    const { user, error } = await requireSuperAdmin(db, OPENID);
    if (error) return error;
    const beforeSnapshot = await collectMigrationSnapshot();
    const before = buildMigrationPlan(beforeSnapshot);
    const now = new Date();
    const result = {
      equipmentUpdated: 0,
      equipmentSkipped: 0,
      approvalsUpdated: 0,
      maintenanceCopied: 0,
      maintenanceSkipped: 0,
      errors: [],
    };

    const equipmentPending = beforeSnapshot.equipment.filter((item) => !hasValue(item.qrCode) && hasValue(item.qr_code));
    for (const item of equipmentPending) {
      const qrExists = await db.collection('equipment').where({ qrCode: item.qr_code }).limit(1).get();
      if (qrExists.data.some((equipment) => equipment._id !== item._id)) {
        result.equipmentSkipped += 1;
        result.errors.push({
          collection: 'equipment',
          id: item._id,
          reason: `qrCode ${item.qr_code} 已被其他设备使用`,
        });
        continue;
      }
      await db.collection('equipment').doc(item._id).update({
        data: { qrCode: item.qr_code, migrationUpdatedAt: now, updatedAt: now },
      });
      result.equipmentUpdated += 1;
    }

    const approvalsPending = beforeSnapshot.approvals.filter(needsApprovalFieldNormalize);
    for (const item of approvalsPending) {
      const data = {
        requesterId: item.requesterId || item.applicantId || '',
        requesterOpenId: item.requesterOpenId || item.applicantOpenId || '',
        requesterName: item.requesterName || item.applicantName || '',
        approverId: item.approverId || item.reviewerId || null,
        approverOpenId: item.approverOpenId || item.reviewerOpenId || null,
        migrationUpdatedAt: now,
        updatedAt: now,
      };
      await db.collection('approvals').doc(item._id).update({ data });
      result.approvalsUpdated += 1;
    }

    const migratedMaintenanceIds = new Set(beforeSnapshot.maintenanceLogs.map((item) => item.sourceRecordId).filter(Boolean));
    const maintenancePending = beforeSnapshot.records.filter((item) => item.type === 'maintenance' && !migratedMaintenanceIds.has(item._id));
    for (const item of maintenancePending) {
      const existing = await db.collection('maintenanceLogs').where({ sourceRecordId: item._id }).count();
      if (existing.total > 0) {
        result.maintenanceSkipped += 1;
        continue;
      }
      await db.collection('maintenanceLogs').add({
        data: {
          sourceRecordId: item._id,
          equipmentId: item.equipmentId || '',
          equipmentName: item.equipmentName || '',
          userId: item.userId || '',
          userOpenId: item.userOpenId || '',
          userName: item.userName || '',
          maintenanceType: item.maintenanceType || 'repair',
          description: item.description || '',
          cost: Number(item.cost || 0),
          technician: item.technician || '',
          partsReplaced: item.partsReplaced || '',
          createdAt: item.createdAt || now,
          updatedAt: now,
          migratedBy: user._id,
          migratedAt: now,
        },
      });
      result.maintenanceCopied += 1;
    }

    const remaining = await collectMigrationPlan();
    return {
      code: 0,
      data: {
        before,
        result,
        remaining,
        risks: remaining.risks,
        appliedAt: now,
        appliedBy: user._id,
      },
    };
  } catch (err) {
    console.error('执行迁移失败:', err);
    return {
      code: 500,
      message: '执行迁移失败',
      error: normalizeError(err),
    };
  }
}

async function collectMigrationPlan() {
  const snapshot = await collectMigrationSnapshot();
  return buildMigrationPlan(snapshot);
}

async function collectMigrationSnapshot() {
  const [equipment, approvalsByApplicant, approvalsByReviewer, records, maintenanceLogs] = await Promise.all([
    fetchAll('equipment'),
    fetchAll('approvals', { applicantOpenId: _.exists(true) }),
    fetchAll('approvals', { reviewerOpenId: _.exists(true) }),
    fetchAll('records', { type: 'maintenance' }),
    fetchAll('maintenanceLogs', { sourceRecordId: _.exists(true) }),
  ]);
  return {
    equipment,
    approvals: mergeById(approvalsByApplicant.concat(approvalsByReviewer)),
    records,
    maintenanceLogs,
  };
}

async function fetchAll(collectionName, where) {
  const list = [];
  let skip = 0;

  while (true) {
    let query = db.collection(collectionName);
    if (where) query = query.where(where);
    let res;
    try {
      res = await query.skip(skip).limit(PAGE_SIZE).get();
    } catch (err) {
      if (isMissingCollectionError(err)) {
        console.warn(`迁移预检跳过不存在的集合: ${collectionName}`);
        return list;
      }
      throw err;
    }
    list.push(...res.data);
    if (res.data.length < PAGE_SIZE) break;
    skip += PAGE_SIZE;
  }

  return list;
}

function mergeById(list) {
  const map = {};
  list.forEach((item) => {
    if (item && item._id) map[item._id] = item;
  });
  return Object.keys(map).map((id) => map[id]);
}

function hasValue(value) {
  return value !== undefined && value !== null && value !== '';
}

function isMissingCollectionError(err) {
  const code = String((err && (err.errCode || err.code)) || '');
  const message = String((err && (err.errMsg || err.message)) || '');
  return code.includes('DATABASE_COLLECTION_NOT_EXIST')
    || code.includes('-502005')
    || /collection.*not.*exist/i.test(message)
    || /collection.*not.*found/i.test(message)
    || /集合.*不存在/.test(message);
}

function normalizeError(err) {
  if (!err) return { message: 'unknown error' };
  return {
    code: err.errCode || err.code || '',
    message: err.errMsg || err.message || String(err),
  };
}
