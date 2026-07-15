const cloud = require('wx-server-sdk');
const { initCloud } = require('./_shared/config');
initCloud(cloud);
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { action } = event;

  switch (action) {
    case 'getMy':
      return handleGetMy(OPENID, event);
    case 'markRead':
      return handleMarkRead(OPENID, event);
    case 'markAllRead':
      return handleMarkAllRead(OPENID);
    case 'getUnreadCount':
      return handleGetUnreadCount(OPENID);
    case 'checkOverdue':
      return handleCheckOverdue();
    default:
      return { code: 400, message: '未知操作' };
  }
};

async function handleGetMy(OPENID, { page = 1, pageSize = 20 }) {
  try {
    const where = { userOpenId: OPENID };
    const countRes = await db.collection('notifications').where(where).count();
    const total = countRes.total;
    const skip = (page - 1) * pageSize;

    const listRes = await db.collection('notifications')
      .where(where)
      .orderBy('createdAt', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get();

    return { code: 0, data: { list: listRes.data, total, page, pageSize } };
  } catch (err) {
    console.error('查询通知失败:', err);
    return { code: 500, message: '查询失败' };
  }
}

async function handleMarkRead(OPENID, { id }) {
  try {
    await db.collection('notifications').doc(id).update({
      data: { isRead: true, updatedAt: new Date() },
    });
    return { code: 0, message: '已读' };
  } catch (err) {
    console.error('标记已读失败:', err);
    return { code: 500, message: '操作失败' };
  }
}

async function handleMarkAllRead(OPENID) {
  try {
    await db.collection('notifications').where({
      userOpenId: OPENID,
      isRead: false,
    }).update({
      data: { isRead: true, updatedAt: new Date() },
    });
    return { code: 0, message: '全部已读' };
  } catch (err) {
    console.error('全部已读失败:', err);
    return { code: 500, message: '操作失败' };
  }
}

async function handleGetUnreadCount(OPENID) {
  try {
    const res = await db.collection('notifications').where({
      userOpenId: OPENID,
      isRead: false,
    }).count();
    return { code: 0, data: { count: res.total } };
  } catch (err) {
    console.error('获取未读数失败:', err);
    return { code: 500, message: '查询失败' };
  }
}

async function handleCheckOverdue() {
  try {
    const now = new Date();
    const overdueRecords = await db.collection('records').where({
      status: 'active',
      expectedReturnAt: _.lt(now),
    }).get();

    for (const record of overdueRecords.data) {
      // 更新记录状态为逾期
      await db.collection('records').doc(record._id).update({
        data: { status: 'overdue', updatedAt: now },
      });

      // 检查是否已发送过逾期通知
      const existingNotif = await db.collection('notifications').where({
        relatedId: record._id,
        type: 'overdue',
      }).get();

      if (existingNotif.data.length === 0) {
        // 创建逾期通知
        await db.collection('notifications').add({
          data: {
            userOpenId: record.userOpenId,
            type: 'overdue',
            title: '器材逾期未还',
            content: `您借用的「${record.equipmentName}」已逾期，请尽快归还。`,
            relatedId: record._id,
            relatedType: 'record',
            isRead: false,
            createdAt: now,
          },
        });
      }
    }

    return { code: 0, data: { processed: overdueRecords.data.length } };
  } catch (err) {
    console.error('检查逾期失败:', err);
    return { code: 500, message: '检查失败' };
  }
}
