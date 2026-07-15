const recordService = require('../../utils/record-service');
const { formatDate, getRecordStatusInfo } = require('../../utils/util');
const paginationBehavior = require('../../behaviors/pagination');

Page({
  behaviors: [paginationBehavior],

  data: {
    activeTab: 0,
    tabOptions: ['全部', '借出中', '已归还', '已逾期'],
    tabStatuses: ['', 'active', 'returned', 'overdue'],
    keyword: '',
  },

  onLoad() { this.loadList(true); },

  onShow() {
    if (typeof this.getTabBar === 'function') {
      this.getTabBar().setData({ value: 'records' });
    }
  },

  async _fetchList(page, pageSize) {
    const { activeTab, tabStatuses, keyword } = this.data;
    const params = { page, pageSize };
    if (tabStatuses[activeTab]) params.status = tabStatuses[activeTab];
    if (keyword) params.keyword = keyword;
    const res = await recordService.getMyRecords(params);
    return (res.data || res).list || [];
  },

  _transformItems(items) {
    return items.map(r => ({
      ...r,
      checkoutAtStr: formatDate(r.checkoutAt, 'MM-DD HH:mm'),
      returnAtStr: r.returnAt ? formatDate(r.returnAt, 'MM-DD HH:mm') : '',
      statusInfo: getRecordStatusInfo(r.status),
    }));
  },

  onTabTap(e) {
    const idx = Number(e.currentTarget.dataset.index);
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
    const id = e.currentTarget.dataset.equipmentid;
    if (id) wx.navigateTo({ url: `/pages/equipment-detail/equipment-detail?id=${id}` });
  },
});
