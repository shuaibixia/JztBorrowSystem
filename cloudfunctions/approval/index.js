const cloud = require('wx-server-sdk');
const { initCloud } = require('./_shared/config');
const { createNotification } = require('./_shared/notification');
const { requireAdmin, requireLogin } = require('./_shared/auth');
const {
  canTransitionEquipmentStatus,
  buildCheckoutRecord,
  buildCheckoutEquipmentUpdate,
  hasConfirmedReservationConflict,
} = require('./_shared/domain');
initCloud(cloud);
const db = cloud.database();

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { action } = event;

  switch (action) {
    case 'create':
      return handleCreate(OPENID, event);
    case 'getById':
      return handleGetById(event);
    case 'list':
      return handleList(OPENID, event);
    case 'getMyPending':
      return handleGetMyPending(OPENID, event);
    case 'approve':
      return handleApprove(OPENID, event);
    case 'reject':
      return handleReject(OPENID, event);
    case 'createReservation':
      return callReservation('create', event);
    case 'listReservations':
      return callReservation('list', event);
    case 'getMyReservations':
      return callReservation('getMy', event);
    case 'cancelReservation':
      return callReservation('cancel', event);
    case 'confirmReservation':
      return callReservation('confirm', event);
    case 'getReservationById':
      return callReservation('getById', event);
    default:
      return { code: 400, message: '未知操作' };
  }
};

function callReservation(action, event) {
  const { OPENID } = cloud.getWXContext();
  return cloud.callFunction({
    name: 'reservation',
    data: { ...event, action, __compatOpenId: OPENID },
  }).then((res) => res.result || { code: 500, message: '预约服务无返回' });
}

// ===== 审批流程 =====

async function handleGetById({ id }) {
  try {
    const res = await db.collection('approvals').doc(id).get();
    return { code: 0, data: res.data };
  } catch (err) {
    console.error('查询审批详情失败:', err);
    return { code: 500, message: '查询失败' };
  }
}

async function handleCreate(OPENID, { equipmentId, purpose, expectedReturnAt }) {
  try {
    const userRes = await db.collection('users').where({ _openid: OPENID }).get();
    const user = userRes.data[0];
    if (!user) return { code: 403, message: '请先登录' };

    const eqRes = await db.collection('equipment').doc(equipmentId).get();
    const equipment = eqRes.data;
    if (equipment.status !== 'available') {
      return { code: 400, message: '器材不可用' };
    }

    const now = new Date();
    const conflictRes = await db.collection('reservations').where({
      equipmentId,
      status: 'confirmed',
    }).get();
    if (hasConfirmedReservationConflict(conflictRes.data, now, expectedReturnAt || null, { allowedUserOpenId: OPENID })) {
      return { code: 409, message: '该器材当前已有确认预约，暂不可申请借用' };
    }

    const res = await db.collection('approvals').add({
      data: {
        type: 'checkout',
        equipmentId,
        equipmentName: equipment.name,
        requesterId: user._id,
        requesterOpenId: OPENID,
        requesterName: user.nickName,
        purpose,
        expectedReturnAt: expectedReturnAt || null,
        status: 'pending',
        approverId: null,
        approverOpenId: null,
        remark: '',
        rejectReason: '',
        reviewedAt: null,
        createdAt: now,
        updatedAt: now,
      },
    });

    return { code: 0, data: { _id: res._id } };
  } catch (err) {
    console.error('创建审批失败:', err);
    return { code: 500, message: '创建失败' };
  }
}

async function handleList(OPENID, { page = 1, pageSize = 20, status, keyword }) {
  try {
    const userRes = await db.collection('users').where({ _openid: OPENID }).get();
    const user = userRes.data[0];
    const isAdmin = user && ['admin', 'superadmin'].includes(user.role);

    const where = {};
    if (!isAdmin) where.requesterOpenId = OPENID;
    if (status) where.status = status;
    if (keyword) where.equipmentName = db.RegExp({ regexp: keyword, options: 'i' });

    const countRes = await db.collection('approvals').where(where).count();
    const total = countRes.total;
    const skip = (page - 1) * pageSize;

    const listRes = await db.collection('approvals')
      .where(where)
      .orderBy('createdAt', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get();

    return { code: 0, data: { list: listRes.data, total, page, pageSize } };
  } catch (err) {
    console.error('查询审批列表失败:', err);
    return { code: 500, message: '查询失败' };
  }
}

async function handleGetMyPending(OPENID, { page = 1, pageSize = 20 }) {
  try {
    const where = { requesterOpenId: OPENID, status: 'pending' };
    const countRes = await db.collection('approvals').where(where).count();
    const total = countRes.total;
    const skip = (page - 1) * pageSize;

    const listRes = await db.collection('approvals')
      .where(where)
      .orderBy('createdAt', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get();

    return { code: 0, data: { list: listRes.data, total, page, pageSize } };
  } catch (err) {
    console.error('查询待审批失败:', err);
    return { code: 500, message: '查询失败' };
  }
}

async function handleApprove(OPENID, { id, remark }) {
  try {
    const { user, error } = await requireAdmin(db, OPENID);
    if (error) return error;

    const approvalRes = await db.collection('approvals').doc(id).get();
    const approval = approvalRes.data;
    if (approval.status !== 'pending') {
      return { code: 400, message: '该审批已处理' };
    }

    const applicantLogin = await requireLogin(db, approval.requesterOpenId);
    if (applicantLogin.error) {
      return { code: applicantLogin.error.code, message: '申请人不可用：' + applicantLogin.error.message };
    }
    const applicant = applicantLogin.user;

    const now = new Date();

    await db.runTransaction(async (transaction) => {
      const txApprovalRes = await transaction.collection('approvals').doc(id).get();
      const txApproval = txApprovalRes.data;
      if (!txApproval || txApproval.status !== 'pending') {
        await transaction.rollback(-11);
        return;
      }

      const txEquipmentRes = await transaction.collection('equipment').doc(approval.equipmentId).get();
      const equipment = txEquipmentRes.data;
      if (!equipment || !canTransitionEquipmentStatus(equipment.status, 'checked_out')) {
        await transaction.rollback(-10);
        return;
      }
      const conflictRes = await transaction.collection('reservations').where({
        equipmentId: equipment._id,
        status: 'confirmed',
      }).get();
      if (hasConfirmedReservationConflict(conflictRes.data, now, approval.expectedReturnAt || null, { allowedUserOpenId: approval.requesterOpenId })) {
        await transaction.rollback(-12);
        return;
      }

      await transaction.collection('approvals').doc(id).update({
        data: {
          status: 'approved',
          approverId: user._id,
          approverOpenId: OPENID,
          remark: remark || '',
          reviewedAt: now,
          updatedAt: now,
        },
      });

      await transaction.collection('equipment').doc(approval.equipmentId).update({
        data: buildCheckoutEquipmentUpdate(applicant._openid, now),
      });

      await transaction.collection('records').add({
        data: buildCheckoutRecord({
          equipment,
          user: applicant,
          purpose: approval.purpose,
          expectedReturnAt: approval.expectedReturnAt,
          checkoutAt: now,
          approvalId: id,
        }),
      });
    });

    // 发送通知给申请人
    await createNotification(
      db,
      approval.requesterOpenId,
      'approval_approved',
      '借用申请已通过',
      '您借用「' + approval.equipmentName + '」的申请已通过，器材已出库',
      id,
      'approval'
    );

    return { code: 0, message: '已通过' };
  } catch (err) {
    if (err.errCode === -502005 && err.errMsg && err.errMsg.indexOf('-11') !== -1) {
      return { code: 400, message: '该审批已处理' };
    }
    if (err.errCode === -502005 && err.errMsg && err.errMsg.indexOf('-12') !== -1) {
      return { code: 409, message: '该器材当前已有确认预约，无法通过审批' };
    }
    if (err.errCode === -502005) return { code: 400, message: '器材当前不可用，无法通过审批' };
    console.error('审批通过失败:', err);
    return { code: 500, message: '操作失败' };
  }
}

async function handleReject(OPENID, { id, rejectReason }) {
  try {
    const userRes = await db.collection('users').where({ _openid: OPENID }).get();
    const user = userRes.data[0];
    if (!user || !['admin', 'superadmin'].includes(user.role)) {
      return { code: 403, message: '权限不足' };
    }

    const approvalRes = await db.collection('approvals').doc(id).get();
    const approval = approvalRes.data;
    if (approval.status !== 'pending') {
      return { code: 400, message: '该审批已处理' };
    }

    const now = new Date();
    await db.collection('approvals').doc(id).update({
      data: {
        status: 'rejected',
        approverId: user._id,
        approverOpenId: OPENID,
        rejectReason: rejectReason || '',
        reviewedAt: now,
        updatedAt: now,
      },
    });

    // 发送通知给申请人
    await createNotification(
      db,
      approval.requesterOpenId,
      'approval_rejected',
      '借用申请被拒绝',
      '您借用「' + approval.equipmentName + '」的申请被拒绝' + (rejectReason ? '，原因：' + rejectReason : ''),
      id,
      'approval'
    );

    return { code: 0, message: '已拒绝' };
  } catch (err) {
    console.error('审批拒绝失败:', err);
    return { code: 500, message: '操作失败' };
  }
}
