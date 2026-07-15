const statsService = require('../../utils/stats-service');
const { getCategoryInfo } = require('../../utils/util');
const adminGuard = require('../../behaviors/admin-guard');

Page({
  behaviors: [adminGuard],

  data: {
    activeTab: 0,
    stats: null,
    loading: true,
    error: false,
    errorMessage: '',
    trendMax: 1,
    monthlyTrend: [],
  },

  onAdminReady() { this.loadStats(); },

  async loadStats() {
    this.setData({ loading: true, error: false, errorMessage: '' });
    try {
      const res = await statsService.getStats();
      const stats = res.data || res;

      stats.categoryDistribution = (stats.categoryDistribution || []).map(item => ({
        ...item,
        categoryInfo: getCategoryInfo(item.category),
      }));

      const monthlyTrend = (stats.monthlyTrend || []).map(item => ({
        ...item,
        label: item.month.split('-')[1] + '月',
      }));
      let trendMax = 1;
      monthlyTrend.forEach(item => {
        if (item.checkout > trendMax) trendMax = item.checkout;
        if (item.returnCount > trendMax) trendMax = item.returnCount;
      });

      this.setData({ stats, monthlyTrend, trendMax, loading: false, error: false, errorMessage: '' });
    } catch (err) {
      console.error('加载统计失败:', err);
      this.setData({ loading: false, error: true, errorMessage: err.message || '加载统计失败' });
    }
  },

  onRetryTap() {
    this.loadStats();
  },

  onTabChange(e) {
    this.setData({ activeTab: Number(e.currentTarget.dataset.tab) });
  },
});
