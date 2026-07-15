const recordService = require('../../utils/record-service');
const { formatDate } = require('../../utils/util');

Page({
  data: {
    recentRecords: [],
    recentLoading: false,
    recentError: false,
    recentErrorMessage: '',
  },

  onShow() {
    if (typeof this.getTabBar === 'function') {
      this.getTabBar().setData({ value: 'scan' });
    }
    this.loadRecentRecords();
  },

  async loadRecentRecords() {
    this.setData({ recentLoading: true, recentError: false, recentErrorMessage: '' });
    try {
      const res = await recordService.getMyRecords({ pageSize: 3, status: 'active' });
      const records = (res.data ? res.data.list : res.list) || [];
      this.setData({
        recentRecords: records.map((r) => ({
          ...r,
          timeStr: formatDate(r.checkoutAt),
        })),
        recentLoading: false,
      });
    } catch (err) {
      console.error('加载最近记录失败:', err);
      this.setData({
        recentLoading: false,
        recentError: true,
        recentErrorMessage: err.message || '最近借出加载失败',
      });
    }
  },

  onRetryRecent() {
    this.loadRecentRecords();
  },

  onScanTap() {
    wx.scanCode({
      scanType: ['qrCode'],
      success: (res) => {
        wx.navigateTo({
          url: '/pages/scan-result/scan-result?qr=' + encodeURIComponent(res.result),
        });
      },
      fail: (err) => {
        if (err.errMsg.indexOf('cancel') === -1) {
          wx.showToast({ title: '需要相机权限才能扫码', icon: 'none' });
        }
      },
    });
  },

  onRecentTap(e) {
    const id = e.currentTarget.dataset.id;
    if (id) {
      wx.navigateTo({ url: '/pages/equipment-detail/equipment-detail?id=' + id });
    }
  },
});
