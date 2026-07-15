const cloud = require('wx-server-sdk');
const { initCloud } = require('./_shared/config');
const { requireAdmin } = require('./_shared/auth');

initCloud(cloud);
const db = cloud.database();
const _ = db.command;

exports.main = async (event) => {
  const { OPENID: contextOpenId } = cloud.getWXContext();
  const OPENID = event.__compatOpenId || contextOpenId;
  const { action } = event;

  switch (action) {
    case 'getAdminStats':
      return handleGetAdminStats(OPENID);
    default:
      return { code: 400, message: '未知操作' };
  }
};

async function handleGetAdminStats(OPENID) {
  try {
    const { error } = await requireAdmin(db, OPENID);
    if (error) return error;

    const [totalRecords, activeRecords, overdueRecords, totalEquipment, categoryRes, topMembers] = await Promise.all([
      db.collection('records').count(),
      db.collection('records').where({ status: 'active' }).count(),
      db.collection('records').where({ status: 'overdue' }).count(),
      db.collection('equipment').where({ status: _.neq('retired') }).count(),
      db.collection('equipment').where({ status: _.neq('retired') }).field({ category: true }).get(),
      db.collection('records').where({ status: _.neq('returned') }).field({ userName: true }).get(),
    ]);

    const categoryMap = {};
    categoryRes.data.forEach((eq) => {
      categoryMap[eq.category] = (categoryMap[eq.category] || 0) + 1;
    });

    const memberMap = {};
    topMembers.data.forEach((record) => {
      memberMap[record.userName] = (memberMap[record.userName] || 0) + 1;
    });

    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const trendRecords = await db.collection('records')
      .where({ createdAt: _.gte(sixMonthsAgo) })
      .field({ createdAt: true, returnAt: true })
      .limit(1000)
      .get();

    const monthlyMap = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      monthlyMap[key] = { month: key, checkout: 0, returnCount: 0 };
    }

    trendRecords.data.forEach((record) => {
      const checkoutDate = record.createdAt ? new Date(record.createdAt) : null;
      if (checkoutDate) {
        const key = checkoutDate.getFullYear() + '-' + String(checkoutDate.getMonth() + 1).padStart(2, '0');
        if (monthlyMap[key]) monthlyMap[key].checkout += 1;
      }
      const returnDate = record.returnAt ? new Date(record.returnAt) : null;
      if (returnDate) {
        const key = returnDate.getFullYear() + '-' + String(returnDate.getMonth() + 1).padStart(2, '0');
        if (monthlyMap[key]) monthlyMap[key].returnCount += 1;
      }
    });

    return {
      code: 0,
      data: {
        totalRecords: totalRecords.total,
        activeRecords: activeRecords.total,
        overdueRecords: overdueRecords.total,
        totalEquipment: totalEquipment.total,
        categoryDistribution: Object.entries(categoryMap).map(([category, count]) => ({ category, count })),
        activeMembers: Object.entries(memberMap)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10),
        monthlyTrend: Object.values(monthlyMap),
      },
    };
  } catch (err) {
    console.error('获取统计失败:', err);
    return { code: 500, message: '获取统计失败' };
  }
}
