const cloud = require('wx-server-sdk');
const { initCloud } = require('./_shared/config');
const { requireAdmin } = require('./_shared/auth');

initCloud(cloud);
const db = cloud.database();

exports.main = async (event) => {
  const { OPENID: contextOpenId } = cloud.getWXContext();
  const OPENID = event.__compatOpenId || contextOpenId;
  const { action } = event;

  switch (action) {
    case 'add':
      return handleAdd(OPENID, event);
    case 'listByEquipment':
      return handleListByEquipment(OPENID, event);
    default:
      return { code: 400, message: '未知操作' };
  }
};

async function handleAdd(OPENID, { equipmentId, maintenanceType, description, cost, technician, partsReplaced }) {
  try {
    const { user, error } = await requireAdmin(db, OPENID);
    if (error) return error;
    if (!equipmentId) return { code: 400, message: '缺少器材 ID' };

    const eqRes = await db.collection('equipment').doc(equipmentId).get();
    const equipment = eqRes.data;
    if (!equipment) return { code: 404, message: '器材不存在' };

    const now = new Date();
    const res = await db.collection('maintenanceLogs').add({
      data: {
        equipmentId,
        equipmentName: equipment.name,
        userId: user._id,
        userOpenId: OPENID,
        userName: user.nickName || user.studentName || '',
        maintenanceType: maintenanceType || 'repair',
        description: description || '',
        cost: Number(cost || 0),
        technician: technician || '',
        partsReplaced: partsReplaced || '',
        createdAt: now,
        updatedAt: now,
      },
    });

    return { code: 0, data: { _id: res._id } };
  } catch (err) {
    console.error('添加维保记录失败:', err);
    return { code: 500, message: '添加失败' };
  }
}

async function handleListByEquipment(OPENID, { equipmentId, page = 1, pageSize = 20 }) {
  try {
    const { error } = await requireAdmin(db, OPENID);
    if (error) return error;
    const where = { equipmentId };
    const skip = (page - 1) * pageSize;
    const [countRes, listRes] = await Promise.all([
      db.collection('maintenanceLogs').where(where).count(),
      db.collection('maintenanceLogs').where(where).orderBy('createdAt', 'desc').skip(skip).limit(pageSize).get(),
    ]);

    return { code: 0, data: { list: listRes.data, total: countRes.total, page, pageSize } };
  } catch (err) {
    console.error('查询维保记录失败:', err);
    return { code: 500, message: '查询失败' };
  }
}
