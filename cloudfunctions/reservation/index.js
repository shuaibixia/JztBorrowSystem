const cloud = require('wx-server-sdk');
const { initCloud } = require('./_shared/config');
const { isAdmin, requireAdmin, requireLogin } = require('./_shared/auth');
const { createNotification } = require('./_shared/notification');

initCloud(cloud);
const db = cloud.database();
const _ = db.command;

exports.main = async (event) => {
  const { OPENID: contextOpenId } = cloud.getWXContext();
  const OPENID = event.__compatOpenId || contextOpenId;
  const { action } = event;

  switch (action) {
    case 'create':
      return handleCreate(OPENID, event);
    case 'list':
      return handleList(OPENID, event);
    case 'getMy':
      return handleGetMy(OPENID, event);
    case 'getById':
      return handleGetById(OPENID, event);
    case 'cancel':
      return handleCancel(OPENID, event);
    case 'confirm':
      return handleConfirm(OPENID, event);
    default:
      return { code: 400, message: '未知操作' };
  }
};

async function handleCreate(OPENID, { equipmentId, startDate, endDate, purpose }) {
  try {
    const { user, error } = await requireLogin(db, OPENID);
    if (error) return error;
    if (!equipmentId) return { code: 400, message: '请选择器材' };

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (!startDate || !endDate || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return { code: 400, message: '预约时间无效' };
    }
    if (end <= start) {
      return { code: 400, message: '结束时间须晚于开始时间' };
    }

    const eqRes = await db.collection('equipment').doc(equipmentId).get();
    const equipment = eqRes.data;
    if (!equipment || equipment.status === 'retired') {
      return { code: 404, message: '器材不存在或已退役' };
    }

    const conflictRes = await db.collection('reservations').where({
      equipmentId,
      status: _.in(['pending', 'confirmed']),
      startDate: _.lt(end),
      endDate: _.gt(start),
    }).count();
    if (conflictRes.total > 0) {
      return { code: 409, message: '该时段已被预约，请选择其他时间' };
    }

    const now = new Date();
    const res = await db.collection('reservations').add({
      data: {
        equipmentId,
        equipmentName: equipment.name,
        userId: user._id,
        userOpenId: OPENID,
        userName: user.nickName || user.studentName || '',
        startDate: start,
        endDate: end,
        purpose: purpose || '',
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      },
    });

    return { code: 0, data: { _id: res._id } };
  } catch (err) {
    console.error('创建预约失败:', err);
    return { code: 500, message: '创建失败' };
  }
}

async function handleList(OPENID, { page = 1, pageSize = 20, status, keyword }) {
  try {
    const { user, error } = await requireLogin(db, OPENID);
    if (error) return error;

    const where = {};
    if (!isAdmin(user)) where.userOpenId = OPENID;
    if (status) where.status = status;
    if (keyword) where.equipmentName = db.RegExp({ regexp: keyword, options: 'i' });

    const skip = (page - 1) * pageSize;
    const [countRes, listRes] = await Promise.all([
      db.collection('reservations').where(where).count(),
      db.collection('reservations').where(where).orderBy('createdAt', 'desc').skip(skip).limit(pageSize).get(),
    ]);

    return { code: 0, data: { list: listRes.data, total: countRes.total, page, pageSize } };
  } catch (err) {
    console.error('查询预约列表失败:', err);
    return { code: 500, message: '查询失败' };
  }
}

async function handleGetMy(OPENID, { page = 1, pageSize = 20, status, keyword }) {
  return handleList(OPENID, { page, pageSize, status, keyword });
}

async function handleGetById(OPENID, { id }) {
  try {
    const { user, error } = await requireLogin(db, OPENID);
    if (error) return error;
    const res = await db.collection('reservations').doc(id).get();
    const reservation = res.data;
    if (!reservation) return { code: 404, message: '预约不存在' };
    if (!isAdmin(user) && reservation.userOpenId !== OPENID) {
      return { code: 403, message: '无权查看' };
    }
    return { code: 0, data: reservation };
  } catch (err) {
    console.error('查询预约详情失败:', err);
    return { code: 500, message: '查询失败' };
  }
}

async function handleCancel(OPENID, { id }) {
  try {
    const { user, error } = await requireLogin(db, OPENID);
    if (error) return error;
    const res = await db.collection('reservations').doc(id).get();
    const reservation = res.data;
    if (!reservation) return { code: 404, message: '预约不存在' };
    if (!isAdmin(user) && reservation.userOpenId !== OPENID) {
      return { code: 403, message: '无权操作' };
    }
    if (!['pending', 'confirmed'].includes(reservation.status)) {
      return { code: 400, message: '该预约无法取消' };
    }

    await db.collection('reservations').doc(id).update({
      data: { status: 'cancelled', updatedAt: new Date() },
    });

    await createNotification(
      db,
      reservation.userOpenId,
      'reservation_cancelled',
      '预约已取消',
      '您预约「' + reservation.equipmentName + '」的申请已取消',
      id,
      'reservation'
    );

    return { code: 0, message: '已取消' };
  } catch (err) {
    console.error('取消预约失败:', err);
    return { code: 500, message: '操作失败' };
  }
}

async function handleConfirm(OPENID, { id }) {
  try {
    const { error } = await requireAdmin(db, OPENID);
    if (error) return error;

    const res = await db.collection('reservations').doc(id).get();
    const reservation = res.data;
    if (!reservation) return { code: 404, message: '预约不存在' };
    if (reservation.status !== 'pending') {
      return { code: 400, message: '该预约已处理' };
    }

    await db.collection('reservations').doc(id).update({
      data: { status: 'confirmed', updatedAt: new Date() },
    });

    await createNotification(
      db,
      reservation.userOpenId,
      'reservation_confirmed',
      '预约已确认',
      '您预约「' + reservation.equipmentName + '」的申请已确认',
      id,
      'reservation'
    );

    return { code: 0, message: '已确认' };
  } catch (err) {
    console.error('确认预约失败:', err);
    return { code: 500, message: '操作失败' };
  }
}
