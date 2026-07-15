const approvalService = require('../../utils/approval-service');
const { formatDate, getApprovalInfo } = require('../../utils/util');
const paginationBehavior = require('../../behaviors/pagination');

Page({
  behaviors: [paginationBehavior],

  data: {
    activeTab: 0,
    tabOptions: ['全部', '待审批', '已通过', '已拒绝'],
    tabStatuses: ['', 'pending', 'approved', 'rejected'],
    keyword: '',
  },

  onLoad() { this.loadList(true); },

  async _fetchList(page, pageSize) {
    const { activeTab, tabStatuses, keyword } = this.data;
    const params = { page, pageSize };
    if (tabStatuses[activeTab]) params.status = tabStatuses[activeTab];
    if (keyword) params.keyword = keyword;
    const res = await approvalService.listApprovals(params);
    return (res.data || res).list || [];
  },

  _transformItems(items) {
    return items.map(r => ({
      ...r,
      createdAtStr: formatDate(r.createdAt, 'MM-DD HH:mm'),
      statusInfo: getApprovalInfo(r.status),
    }));
  },

  onTabChange(e) {
    const idx = Number(e.detail.value);
    if (idx === this.data.activeTab) return;
    this.setData({ activeTab: idx });
    this.loadList(true);
  },

  onSearchChange(e) {
    this.setData({ keyword: e.detail.value });
    clearTimeout(this._searchTimer);
    this._searchTimer = setTimeout(() => this.loadList(true), 300);
  },

  onClearSearch() {
    this.setData({ keyword: '' });
    this.loadList(true);
  },

  onItemTap(e) {
    const id = (e.detail && e.detail.id) || e.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({ url: `/pages/approval-detail/approval-detail?id=${id}` });
  },
});
