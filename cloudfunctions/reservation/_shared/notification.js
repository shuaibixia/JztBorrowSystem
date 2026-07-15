async function createNotification(db, userOpenId, type, title, content, relatedId, relatedType) {
  try {
    await db.collection('notifications').add({
      data: {
        userOpenId,
        type,
        title,
        content,
        relatedId: relatedId || '',
        relatedType: relatedType || '',
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  } catch (err) {
    console.error('创建通知失败:', err);
  }
}

module.exports = {
  createNotification,
};
