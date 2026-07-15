const cloud = require('wx-server-sdk');
const { initCloud } = require('./_shared/config');
const { createNotification } = require('./_shared/notification');
const { requireLogin } = require('./_shared/auth');
const {
  canDirectCheckout,
  canReturnEquipment,
  canTransitionEquipmentStatus,
  buildCheckoutRecord,
  buildCheckoutEquipmentUpdate,
  buildReturnEquipmentUpdate,
  buildReturnRecordUpdate,
  hasConfirmedReservationConflict,
  findCompletableReservation,
} = require('./_shared/domain');
initCloud(cloud);
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { action } = event;

  switch (action) {
    case 'checkout':
      return handleCheckout(OPENID, event);
    case 'returnEquipment':
      return handleReturn(OPENID, event);
    case 'getMyRecords':
      return handleGetMyRecords(OPENID, event);
    case 'getByEquipment':
      return handleGetByEquipment(event);
    case 'getActive':
      return handleGetActive();
    case 'getOverdue':
      return handleGetOverdue();
    case 'getStats':
      return callStats('getAdminStats', event);
    case 'addMaintenance':
      return callMaintenance('add', event);
    case 'getMaintenance':
      return callMaintenance('listByEquipment', event);
    default:
      return { code: 400, message: '未知操作' };
  }
};

function callStats(action, event) {
  const { OPENID } = cloud.getWXContext();
  return cloud.callFunction({
    name: 'stats',
    data: { ...event, action, __compatOpenId: OPENID },
  }).then((res) => res.result || { code: 500, message: '统计服务无返回' });
}

function callMaintenance(action, event) {
  const { OPENID } = cloud.getWXContext();
  return cloud.callFunction({
    name: 'maintenance',
    data: { ...event, action, __compatOpenId: OPENID },
  }).then((res) => res.result || { code: 500, message: '维保服务无返回' });
}

async function handleCheckout(OPENID, { equipmentQR, equipmentId, purpose, expectedReturnAt }) {
  try {
    const { user, error } = await requireLogin(db, OPENID);
    if (error) return error;
    if (!canDirectCheckout(user)) {
      return { code: 403, message: '仅管理员可直接出库，请提交借用申请' };
    }

    const result = await db.runTransaction(async (transaction) => {
      let equipment;
      if (equipmentQR) {
        const eqRes = await transaction.collection('equipment').where({ qrCode: equipmentQR }).get();
        if (eqRes.data.length === 0) { await transaction.rollback(-1); return; }
        equipment = eqRes.data[0];
      } else if (equipmentId) {
        const eqRes = await transaction.collection('equipment').doc(equipmentId).get();
        equipment = eqRes.data;
      } else { await transaction.rollback(-2); return; }

      if (!equipment || !canTransitionEquipmentStatus(equipment.status, 'checked_out')) {
        await transaction.rollback(-3);
        return;
      }
      const now = new Date();
      const conflictRes = await transaction.collection('reservations').where({
        equipmentId: equipment._id,
        status: 'confirmed',
      }).get();
      if (hasConfirmedReservationConflict(conflictRes.data, now, expectedReturnAt || null)) {
        await transaction.rollback(-5);
        return;
      }

      await transaction.collection('equipment').doc(equipment._id).update({
        data: buildCheckoutEquipmentUpdate(OPENID, now),
      });

      const recordRes = await transaction.collection('records').add({
        data: buildCheckoutRecord({ equipment, user, purpose, expectedReturnAt, checkoutAt: now }),
      });

      return { code: 0, data: { equipment, recordId: recordRes._id } };
    });

    // 出库成功后发送通知
    if (result && result.code === 0) {
      await createNotification(
        db,
        OPENID,
        'checkout',
        '器材已出库',
        '您已借出「' + result.data.equipment.name + '」，请按时归还',
        result.data.recordId,
        'record'
      );
    }

    return result;
  } catch (err) {
    if (err.errCode === -502005 && err.errMsg && err.errMsg.indexOf('-5') !== -1) {
      return { code: 409, message: '该器材当前已有确认预约，暂不可出库' };
    }
    if (err.errCode === -502005) return { code: 400, message: '操作失败，器材状态已变更' };
    console.error('出库失败:', err);
    return { code: 500, message: '出库失败' };
  }
}

async function handleReturn(OPENID, { equipmentQR, equipmentId, condition_after, remark }) {
  try {
    const { user, error } = await requireLogin(db, OPENID);
    if (error) return error;

    const result = await db.runTransaction(async (transaction) => {
      let equipment;
      if (equipmentQR) {
        const eqRes = await transaction.collection('equipment').where({ qrCode: equipmentQR }).get();
        if (eqRes.data.length === 0) { await transaction.rollback(-1); return; }
        equipment = eqRes.data[0];
      } else if (equipmentId) {
        const eqRes = await transaction.collection('equipment').doc(equipmentId).get();
        equipment = eqRes.data;
      } else { await transaction.rollback(-2); return; }

      if (!equipment || !canTransitionEquipmentStatus(equipment.status, 'available')) { await transaction.rollback(-3); return; }
      if (!canReturnEquipment(user, equipment)) { await transaction.rollback(-4); return; }
      const now = new Date();
      const activeRecordRes = await transaction.collection('records').where({
        equipmentId: equipment._id, userOpenId: equipment.currentHolder, status: 'active',
      }).limit(1).get();
      const activeRecord = activeRecordRes.data[0] || null;

      await transaction.collection('equipment').doc(equipment._id).update({
        data: buildReturnEquipmentUpdate(equipment, condition_after, now),
      });

      await transaction.collection('records').where({
        equipmentId: equipment._id, userOpenId: equipment.currentHolder, status: 'active',
      }).update({
        data: buildReturnRecordUpdate(condition_after, remark, now),
      });

      let completedReservationId = '';
      if (activeRecord) {
        const reservationRes = await transaction.collection('reservations').where({
          equipmentId: equipment._id,
          userOpenId: equipment.currentHolder,
          status: 'confirmed',
        }).get();
        const reservation = findCompletableReservation(reservationRes.data, {
          equipmentId: equipment._id,
          userOpenId: equipment.currentHolder,
          checkoutAt: activeRecord.checkoutAt,
          returnAt: now,
        });
        if (reservation) {
          await transaction.collection('reservations').doc(reservation._id).update({
            data: {
              status: 'completed',
              completedAt: now,
              completedRecordId: activeRecord._id,
              updatedAt: now,
            },
          });
          completedReservationId = reservation._id;
        }
      }

      return { code: 0, data: { success: true, equipmentName: equipment.name, holderOpenId: equipment.currentHolder, completedReservationId } };
    });

    // 归还成功后发送通知
    if (result && result.code === 0) {
      await createNotification(
        db,
        result.data.holderOpenId || OPENID,
        'return',
        '器材已归还',
        '您已归还「' + (result.data.equipmentName || '器材') + '」',
        '',
        'record'
      );
    }

    return result;
  } catch (err) {
    if (err.errCode === -502005) return { code: 400, message: '归还失败，器材状态已变更' };
    console.error('归还失败:', err);
    return { code: 500, message: '归还失败' };
  }
}

async function handleGetMyRecords(OPENID, { page = 1, pageSize = 20, status, keyword }) {
  try {
    const where = { userOpenId: OPENID };
    if (status) where.status = status;
    if (keyword) where.equipmentName = db.RegExp({ regexp: keyword, options: 'i' });

    const countRes = await db.collection('records').where(where).count();
    const total = countRes.total;
    const skip = (page - 1) * pageSize;
    const listRes = await db.collection('records').where(where).orderBy('createdAt', 'desc').skip(skip).limit(pageSize).get();

    return { code: 0, data: { list: listRes.data, total, page, pageSize } };
  } catch (err) {
    console.error('查询记录失败:', err);
    return { code: 500, message: '查询失败' };
  }
}

async function handleGetByEquipment({ equipmentId }) {
  try {
    const res = await db.collection('records').where({ equipmentId }).orderBy('createdAt', 'desc').limit(50).get();
    return { code: 0, data: { list: res.data } };
  } catch (err) {
    console.error('查询记录失败:', err);
    return { code: 500, message: '查询失败' };
  }
}

async function handleGetActive() {
  try {
    const res = await db.collection('records').where({ status: 'active' }).orderBy('checkoutAt', 'desc').limit(100).get();
    return { code: 0, data: { list: res.data } };
  } catch (err) {
    console.error('查询记录失败:', err);
    return { code: 500, message: '查询失败' };
  }
}

async function handleGetOverdue() {
  try {
    const now = new Date();
    const res = await db.collection('records').where({ status: 'active', expectedReturnAt: _.lt(now) }).orderBy('expectedReturnAt', 'asc').limit(100).get();
    return { code: 0, data: { list: res.data } };
  } catch (err) {
    console.error('查询逾期记录失败:', err);
    return { code: 500, message: '查询失败' };
  }
}
