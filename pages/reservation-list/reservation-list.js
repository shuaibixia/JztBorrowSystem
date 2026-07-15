const reservationService = require('../../utils/reservation-service');
const { formatDate, getReservationInfo } = require('../../utils/util');
const paginationBehavior = require('../../behaviors/pagination');

Page({
  behaviors: [paginationBehavior],

  data: {
    activeTab: 0,
    tabOptions: ['全部', '待确认', '已确认', '已取消', '已完成'],
    tabStatuses: ['', 'pending', 'confirmed', 'cancelled', 'completed'],
    keyword: '',
    showCancelDialog: false,
    cancelId: '',
    cancelLoading: false,
    actionError: '',
  },

  onLoad() { this.loadList(true); },

  async _fetchList(page, pageSize) {
    const { activeTab, tabStatuses, keyword } = this.data;
    const params = { page, pageSize };
    if (tabStatuses[activeTab]) params.status = tabStatuses[activeTab];
    if (keyword) params.keyword = keyword;
    const res = await reservationService.listReservations(params);
    return (res.data || res).list || [];
  },

  _transformItems(items) {
    return items.map(r => ({
      ...r,
      startDateStr: formatDate(r.startDate, 'MM-DD HH:mm'),
      endDateStr: formatDate(r.endDate, 'MM-DD HH:mm'),
      statusInfo: getReservationInfo(r.status),
    }));
  },

  onTabChange(e) {
    const idx = Number(e.detail.value);
    if (idx === this.data.activeTab) return;
    this.setData({ activeTab: idx, actionError: '' });
    this.loadList(true);
  },

  onSearchChange(e) {
    this.setData({ keyword: e.detail.value, actionError: '' });
    clearTimeout(this._searchTimer);
    this._searchTimer = setTimeout(() => this.loadList(true), 300);
  },

  onClearSearch() {
    this.setData({ keyword: '', actionError: '' });
    this.loadList(true);
  },

  onItemTap(e) {
    const id = e.currentTarget.dataset.id || (e.detail && e.detail.id);
    wx.navigateTo({ url: `/pages/reservation-detail/reservation-detail?id=${id}` });
  },

  onCreateTap() {
    wx.navigateTo({ url: '/pages/equipment-list/equipment-list' });
  },

  onCancelTap(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ showCancelDialog: true, cancelId: id, actionError: '' });
  },

  onCancelCancel() {
    if (this.data.cancelLoading) return;
    this.setData({ showCancelDialog: false, cancelId: '' });
  },

  async onCancelConfirm() {
    if (this.data.cancelLoading) return;
    this.setData({ cancelLoading: true, actionError: '' });
    try {
      await reservationService.cancelReservation(this.data.cancelId);
      wx.showToast({ title: '已取消', icon: 'success' });
      this.setData({ showCancelDialog: false, cancelId: '', cancelLoading: false });
      await this.loadList(true);
    } catch (err) {
      this.setData({ cancelLoading: false, actionError: err.message || '取消失败' });
      wx.showToast({ title: err.message || '取消失败', icon: 'none' });
    }
  },
});
