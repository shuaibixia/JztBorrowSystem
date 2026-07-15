const { bindStudentId, getStats } = require('../../utils/auth');
const { isAdmin } = require('../../utils/util');
const notificationService = require('../../utils/notification-service');
const loginBehavior = require('../../behaviors/login');

Page({
  behaviors: [loginBehavior],

  data: {
    userInfo: null,
    isLoggedIn: false,
    needsBind: false,
    brandTapCount: 0,
    stats: { totalCheckouts: 0, activeCount: 0, overdueCount: 0 },
    studentIdInput: '',
    loginLoading: false,
    isAdminUser: false,
    unreadCount: 0,
  },

  onShow() {
    if (typeof this.getTabBar === 'function') {
      this.getTabBar().setData({ value: 'profile' });
    }
  },

  onLoginSuccess(userInfo) {
    if (userInfo.studentId || userInfo.role === 'superadmin') {
      this.setData({ isLoggedIn: true, needsBind: false, isAdminUser: isAdmin(userInfo) });
      this.loadStats();
      this.loadUnreadCount();
    } else {
      this.setData({ isLoggedIn: false, needsBind: true });
    }
  },

  onLoginRequired() {
    this.setData({
      userInfo: null,
      isLoggedIn: false,
      needsBind: true,
      isAdminUser: false,
    });
  },

  async loadStats() {
    try {
      const res = await getStats();
      this.setData({ stats: res.data || this.data.stats });
    } catch (err) {
      console.error('加载统计失败:', err);
    }
  },

  onStudentIdInput(e) {
    const value = e.detail.value.replace(/\D/g, '');
    this.setData({ studentIdInput: value });
  },

  onBrandTap() {
    const count = this.data.brandTapCount + 1;
    if (count >= 5) {
      this.setData({ brandTapCount: 0 });
      wx.navigateTo({ url: '/pages/admin-setup/admin-setup' });
    } else {
      this.setData({ brandTapCount: count });
      if (this._tapTimer) clearTimeout(this._tapTimer);
      this._tapTimer = setTimeout(() => {
        this.setData({ brandTapCount: 0 });
      }, 3000);
    }
  },

  async onBindStudentId() {
    const { studentIdInput } = this.data;
    if (studentIdInput.length !== 12) {
      wx.showToast({ title: '请输入12位学号', icon: 'none' });
      return;
    }
    this.setData({ loginLoading: true });
    try {
      const userInfo = await bindStudentId(studentIdInput);
      wx.showToast({ title: '绑定成功', icon: 'success' });
      this.setData({ loginLoading: false, studentIdInput: '' });
      this.onLoginSuccess(userInfo);
    } catch (err) {
      this.setData({ loginLoading: false });
      wx.showToast({ title: err.message || '绑定失败', icon: 'none' });
    }
  },

  onViewRecords() {
    wx.navigateTo({ url: '/pages/record-list/record-list' });
  },

  onViewEquipment() {
    wx.navigateTo({ url: '/pages/equipment-list/equipment-list' });
  },

  onNotificationTap() {
    wx.navigateTo({ url: '/pages/notification-center/notification-center' });
  },

  onApprovalTap() {
    wx.navigateTo({ url: '/pages/approval-list/approval-list' });
  },

  onMemberTap() {
    wx.navigateTo({ url: '/pages/member-list/member-list' });
  },

  onStatsTap() {
    wx.navigateTo({ url: '/pages/admin-stats/admin-stats' });
  },

  onDataImportTap() {
    wx.navigateTo({ url: '/pages/data-import/data-import' });
  },

  onReservationTap() {
    wx.navigateTo({ url: '/pages/reservation-list/reservation-list' });
  },

  async loadUnreadCount() {
    try {
      const res = await notificationService.getUnreadCount();
      this.setData({ unreadCount: (res.data || res).count || 0 });
    } catch (err) { console.error('获取未读数失败:', err); }
  },
});
