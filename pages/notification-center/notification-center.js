const notificationService = require('../../utils/notification-service');
const { formatRelativeTime } = require('../../utils/util');
const paginationBehavior = require('../../behaviors/pagination');

Page({
  behaviors: [paginationBehavior],

  data: { unreadCount: 0 },

  onLoad() {
    this.loadList(true);
    this.loadUnreadCount();
  },

  async _fetchList(page, pageSize) {
    const res = await notificationService.getMyNotifications({ page, pageSize });
    return (res.data || res).list || [];
  },

  _transformItems(items) {
    return items.map(n => ({ ...n, timeStr: formatRelativeTime(n.createdAt) }));
  },

  async loadUnreadCount() {
    try {
      const res = await notificationService.getUnreadCount();
      this.setData({ unreadCount: (res.data || res).count || 0 });
    } catch (err) { /* silent */ }
  },

  async onItemTap(e) {
    const { id, relatedid, relatedtype } = e.currentTarget.dataset;
    try {
      await notificationService.markRead(id);
      this.loadUnreadCount();
    } catch (err) { /* silent */ }
    if (relatedtype === 'record' && relatedid) {
      wx.navigateTo({ url: '/pages/record-list/record-list' });
    }
  },

  async onMarkAllRead() {
    try {
      await notificationService.markAllRead();
      wx.showToast({ title: '全部已读', icon: 'success' });
      this.loadList(true);
      this.loadUnreadCount();
    } catch (err) {
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },
});
