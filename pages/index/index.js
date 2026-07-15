const { checkLogin, getStats } = require('../../utils/auth');
const equipmentService = require('../../utils/equipment-service');
const recordService = require('../../utils/record-service');
const { formatDate, isAdmin, getGreeting, daysUntil } = require('../../utils/util');
const notificationService = require('../../utils/notification-service');

Page({
  data: {
    userInfo: null,
    isLoggedIn: false,
    greeting: '',
    stats: { available: 0, checkedOut: 0, total: 0 },
    myActiveRecords: [],
    overdueRecords: [],
    loading: true,
    error: false,
    errorMessage: '',
    isAdmin: false,
    unreadCount: 0,
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    if (typeof this.getTabBar === 'function') {
      this.getTabBar().setData({ value: 'home' });
    }
  },

  onPullDownRefresh() {
    this.loadData().finally(() => wx.stopPullDownRefresh());
  },

  async loadData() {
    this.setData({ loading: true, error: false, errorMessage: '' });
    try {
      const userInfo = await checkLogin();
      if (userInfo) {
        this.setData({
          userInfo,
          isLoggedIn: true,
          isAdmin: isAdmin(userInfo),
          greeting: getGreeting(),
        });
        this.loadUnreadCount();
      }

      const [statsRes, recordsRes] = await Promise.all([
        equipmentService.getStats().catch(() => null),
        recordService.getMyRecords({ pageSize: 20, status: 'active' }).catch(() => ({ data: { list: [] } })),
      ]);

      const stats = statsRes && statsRes.data
        ? { total: statsRes.data.total || 0, available: statsRes.data.available || 0, checkedOut: statsRes.data.checkedOut || 0 }
        : this.data.stats;

      const allRecords = (recordsRes.data ? recordsRes.data.list : recordsRes.list) || [];
      const now = new Date();
      const overdueRecords = [];
      const activeRecords = [];
      allRecords.forEach(r => {
        const days = daysUntil(r.expectedReturnAt);
        const enriched = {
          ...r,
          checkoutAtStr: formatDate(r.checkoutAt, 'MM-DD HH:mm'),
          daysLeft: days,
          isOverdue: r.expectedReturnAt && new Date(r.expectedReturnAt) < now,
        };
        if (enriched.isOverdue) {
          overdueRecords.push(enriched);
        } else {
          activeRecords.push(enriched);
        }
      });

      this.setData({
        stats,
        myActiveRecords: activeRecords.slice(0, 5),
        overdueRecords,
        loading: false,
      });
    } catch (err) {
      console.error('加载数据失败:', err);
      this.setData({
        loading: false,
        error: true,
        errorMessage: err.message || '首页加载失败',
      });
    }
  },

  onRetryTap() {
    this.loadData();
  },

  onSearchTap() {
    wx.navigateTo({ url: '/pages/equipment-list/equipment-list' });
  },

  onRecordTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/equipment-detail/equipment-detail?id=${id}` });
  },

  onViewAllRecords() {
    wx.navigateTo({ url: '/pages/record-list/record-list' });
  },

  onViewEquipment() {
    wx.navigateTo({ url: '/pages/equipment-list/equipment-list' });
  },

  onFabTap() {
    wx.navigateTo({ url: '/pages/equipment-edit/equipment-edit' });
  },

  onScanTap() {
    wx.switchTab({ url: '/pages/scan/scan' });
  },

  onReservationTap() {
    wx.navigateTo({ url: '/pages/reservation-list/reservation-list' });
  },

  onNotificationTap() {
    wx.navigateTo({ url: '/pages/notification-center/notification-center' });
  },

  async loadUnreadCount() {
    try {
      const res = await notificationService.getUnreadCount();
      this.setData({ unreadCount: (res.data || res).count || 0 });
    } catch (err) { /* silent */ }
  },
});
