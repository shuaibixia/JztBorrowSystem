const statsService = require('../../utils/stats-service');
const { formatDate, getMaintenanceTypeInfo } = require('../../utils/util');
const { MAINTENANCE_TYPES, PAGE_SIZE } = require('../../utils/constants');
const adminGuard = require('../../behaviors/admin-guard');

Page({
  behaviors: [adminGuard],

  data: {
    equipmentId: '',
    equipmentName: '',
    list: [],
    page: 1,
    hasMore: true,
    loading: false,
    refreshing: false,
    error: false,
    errorMessage: '',
    // 添加弹窗
    showDialog: false,
    typeIndex: 0,
    typeOptions: MAINTENANCE_TYPES.map((t) => t.label),
    description: '',
    cost: '',
    technician: '',
    partsReplaced: '',
    actionLoading: false,
  },

  onLoad(options) {
    this.setData({
      equipmentId: options.equipmentId || '',
      equipmentName: decodeURIComponent(options.equipmentName || ''),
    });
    if (this.data.equipmentName) {
      wx.setNavigationBarTitle({ title: `${this.data.equipmentName} - 维修记录` });
    }
  },

  onAdminReady() {
    this.loadList(true);
  },

  onPullDownRefresh() {
    this.setData({ refreshing: true });
    this.loadList(true).finally(() => {
      wx.stopPullDownRefresh();
      this.setData({ refreshing: false });
    });
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadList(false);
    }
  },

  async loadList(reset) {
    if (this.data.loading) return;
    const page = reset ? 1 : this.data.page;
    this.setData({ loading: true, error: false, errorMessage: '' });

    try {
      const res = await statsService.getMaintenance(this.data.equipmentId, { page, pageSize: PAGE_SIZE });
      const data = res.data || res;
      const list = (data.list || []).map((r) => ({
        ...r,
        createdAtStr: formatDate(r.createdAt),
        typeInfo: getMaintenanceTypeInfo(r.maintenanceType),
      }));

      this.setData({
        list: reset ? list : [...this.data.list, ...list],
        page: page + 1,
        hasMore: list.length >= PAGE_SIZE,
        loading: false,
        error: false,
        errorMessage: '',
      });
    } catch (err) {
      console.error('加载维保记录失败:', err);
      this.setData({
        loading: false,
        error: true,
        errorMessage: err.message || '加载维修记录失败',
      });
    }
  },

  onRetryTap() {
    this.loadList(this.data.list.length === 0);
  },

  onAddTap() {
    this.setData({
      showDialog: true,
      typeIndex: 0,
      description: '',
      cost: '',
      technician: '',
      partsReplaced: '',
    });
  },

  onDialogCancel() {
    this.setData({ showDialog: false });
  },

  onTypeChange(e) { this.setData({ typeIndex: e.detail.value }); },
  onDescInput(e) { this.setData({ description: e.detail.value }); },
  onCostInput(e) { this.setData({ cost: e.detail.value }); },
  onTechInput(e) { this.setData({ technician: e.detail.value }); },
  onPartsInput(e) { this.setData({ partsReplaced: e.detail.value }); },

  async onDialogConfirm() {
    const { equipmentId, typeIndex, description, cost, technician, partsReplaced } = this.data;
    this.setData({ actionLoading: true });

    try {
      await statsService.addMaintenance({
        equipmentId,
        maintenanceType: MAINTENANCE_TYPES[typeIndex].value,
        description: description.trim(),
        cost: parseFloat(cost) || 0,
        technician: technician.trim(),
        partsReplaced: partsReplaced.trim(),
      });
      wx.showToast({ title: '添加成功', icon: 'success' });
      this.setData({ showDialog: false, actionLoading: false });
      await this.loadList(true);
    } catch (err) {
      this.setData({ actionLoading: false });
      wx.showToast({ title: err.message || '添加失败', icon: 'none' });
    }
  },
});
