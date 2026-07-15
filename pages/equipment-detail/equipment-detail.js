const equipmentService = require('../../utils/equipment-service');
const recordService = require('../../utils/record-service');
const approvalService = require('../../utils/approval-service');
const { checkLogin } = require('../../utils/auth');
const { getStatusInfo, getCategoryInfo, getConditionInfo, formatDate, isAdmin, getMaintenanceTypeInfo } = require('../../utils/util');
const statsService = require('../../utils/stats-service');

Page({
  data: {
    id: '',
    equipment: null,
    records: [],
    maintenanceRecords: [],
    loading: true,
    error: false,
    errorMessage: '',
    activeTab: 0,
    userInfo: null,
    actionError: '',
    // 操作弹窗
    showDialog: false,
    showApprovalDialog: false,
    showDeleteDialog: false,
    dialogType: '',
    purpose: '',
    approvalPurpose: '',
    remark: '',
    conditionIndex: 0,
    conditionOptions: ['优秀', '良好', '一般', '较差'],
    actionLoading: false,
    isAdmin: false,
    buttonInfo: { text: '', disabled: true, theme: 'default' },
    showQrDialog: false,
  },

  async onLoad(options) {
    this.setData({ id: options.id });
    await this.loadData();
  },

  async loadData() {
    this.setData({ loading: true, error: false, errorMessage: '' });
    try {
      const [eqRes, recordsRes, userInfo] = await Promise.all([
        equipmentService.getById(this.data.id),
        recordService.getByEquipment(this.data.id),
        checkLogin(),
      ]);

      const equipment = eqRes.data;
      if (equipment) {
        equipment.statusInfo = getStatusInfo(equipment.status);
        equipment.categoryInfo = getCategoryInfo(equipment.category);
        equipment.conditionInfo = getConditionInfo(equipment.condition);
        equipment.checkedOutAtStr = formatDate(equipment.checkedOutAt);
      }

      const recordsData = recordsRes.data || recordsRes;
      const records = (recordsData.list || []).map((r) => ({
        ...r,
        checkoutAtStr: formatDate(r.checkoutAt),
        returnAtStr: formatDate(r.returnAt),
      }));

      // 加载维修记录
      let maintenanceRecords = [];
      try {
        const maintRes = await statsService.getMaintenance(this.data.id, { page: 1, pageSize: 10 });
        const maintData = maintRes.data || maintRes;
        maintenanceRecords = (maintData.list || []).map((r) => ({
          ...r,
          createdAtStr: formatDate(r.createdAt),
          typeInfo: getMaintenanceTypeInfo(r.maintenanceType),
        }));
      } catch (err) { console.error('获取维修记录失败:', err); }

      this.setData({
        equipment,
        records,
        maintenanceRecords,
        userInfo,
        isAdmin: isAdmin(userInfo),
        buttonInfo: this.getButtonInfo(equipment, userInfo),
        loading: false,
      });
    } catch (err) {
      console.error('加载器材详情失败:', err);
      this.setData({
        loading: false,
        error: true,
        errorMessage: err.message || '器材详情加载失败',
      });
    }
  },

  onRetryTap() {
    this.loadData();
  },

  onTabChange(e) {
    const tab = Number(e.detail.value);
    this.setData({ activeTab: tab });
  },

  canCheckout() {
    const { equipment } = this.data;
    return equipment && equipment.status === 'available';
  },

  canReturn() {
    const { equipment, userInfo, isAdmin: admin } = this.data;
    return equipment && equipment.status === 'checked_out' && userInfo && (admin || equipment.currentHolder === userInfo._openid);
  },

  getButtonInfo(equipmentArg, userInfoArg) {
    const equipment = equipmentArg || this.data.equipment;
    const userInfo = userInfoArg || this.data.userInfo;
    const admin = isAdmin(userInfo);
    if (!equipment) return { text: '', disabled: true, theme: 'default' };
    if (equipment.status === 'available') return { text: admin ? '出库' : '申请借用', disabled: false, theme: 'primary' };
    if (equipment.status === 'checked_out') {
      if (userInfo && (admin || equipment.currentHolder === userInfo._openid)) return { text: '归还', disabled: false, theme: 'primary' };
      return { text: `由 ${equipment.currentHolderName || '他人'} 借出`, disabled: true, theme: 'default' };
    }
    if (equipment.status === 'maintenance') return { text: '维修中', disabled: true, theme: 'default' };
    return { text: '已退役', disabled: true, theme: 'default' };
  },

  onActionTap() {
    if (this.data.actionLoading || this.data.buttonInfo.disabled) return;
    this.setData({ actionError: '' });
    if (this.canCheckout()) {
      if (this.data.isAdmin) {
        this.setData({ showDialog: true, dialogType: 'checkout', purpose: '' });
      } else {
        this.setData({ showApprovalDialog: true, approvalPurpose: '' });
      }
    } else if (this.canReturn()) {
      this.setData({ showDialog: true, dialogType: 'return', remark: '', conditionIndex: 0 });
    }
  },

  onPurposeInput(e) { this.setData({ purpose: e.detail.value }); },
  onApprovalPurposeInput(e) { this.setData({ approvalPurpose: e.detail.value }); },
  onApprovalCancel() {
    if (this.data.actionLoading) return;
    this.setData({ showApprovalDialog: false });
  },
  onRemarkInput(e) { this.setData({ remark: e.detail.value }); },
  onConditionChange(e) {
    const value = Number(e.detail.value || 1);
    this.setData({ conditionIndex: Math.max(0, value - 1) });
  },
  onDialogCancel() {
    if (this.data.actionLoading) return;
    this.setData({ showDialog: false });
  },

  async onApprovalConfirm() {
    if (this.data.actionLoading) return;
    const { approvalPurpose, equipment } = this.data;
    if (!approvalPurpose.trim()) {
      this.setData({ actionError: '请填写用途' });
      wx.showToast({ title: '请填写用途', icon: 'none' });
      return;
    }
    this.setData({ actionLoading: true, actionError: '' });
    try {
      await approvalService.createApproval({
        equipmentId: equipment._id,
        purpose: approvalPurpose.trim(),
      });
      wx.showToast({ title: '申请已提交，等待审批', icon: 'success' });
      this.setData({ showApprovalDialog: false, actionLoading: false, actionError: '' });
    } catch (err) {
      const message = err.message || '提交失败';
      this.setData({ showApprovalDialog: false, actionLoading: false, actionError: message });
      wx.showToast({ title: message, icon: 'none' });
    }
  },

  onViewMaintenance() {
    const { equipment } = this.data;
    wx.navigateTo({
      url: `/pages/maintenance-log/maintenance-log?equipmentId=${this.data.id}&equipmentName=${encodeURIComponent(equipment.name)}`,
    });
  },

  onReserveTap() {
    wx.navigateTo({
      url: `/pages/reservation-create/reservation-create?equipmentId=${this.data.id}`,
    });
  },

  onEditTap() {
    wx.navigateTo({ url: `/pages/equipment-edit/equipment-edit?id=${this.data.id}` });
  },

  onShowQr() {
    this.setData({ showQrDialog: true });
  },

  onQrClose() {
    this.setData({ showQrDialog: false });
  },

  onDeleteTap() {
    this.setData({ showDeleteDialog: true });
  },

  onDeleteCancel() {
    this.setData({ showDeleteDialog: false });
  },

  async onDeleteConfirm() {
    this.setData({ showDeleteDialog: false });
    try {
      await equipmentService.deleteEquipment(this.data.id);
      wx.showToast({ title: '已删除', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1500);
    } catch (err) {
      wx.showToast({ title: err.message || '删除失败', icon: 'none' });
    }
  },

  async onDialogConfirm() {
    if (this.data.actionLoading) return;
    const { dialogType, id, purpose, remark, conditionIndex, conditionOptions } = this.data;
    this.setData({ actionLoading: true });
    try {
      if (dialogType === 'checkout') {
        if (!purpose.trim()) {
          wx.showToast({ title: '请填写用途', icon: 'none' });
          this.setData({ actionLoading: false });
          return;
        }
        await recordService.checkout({ equipmentId: id, purpose: purpose.trim() });
        wx.showToast({ title: '出库成功', icon: 'success' });
      } else {
        const conditionMap = ['excellent', 'good', 'fair', 'poor'];
        await recordService.returnEquipment({ equipmentId: id, condition_after: conditionMap[conditionIndex], remark: remark.trim() });
        wx.showToast({ title: '归还成功', icon: 'success' });
      }
      this.setData({ showDialog: false, actionLoading: false, actionError: '' });
      await this.loadData();
    } catch (err) {
      const message = err.message || '操作失败';
      this.setData({ showDialog: false, actionLoading: false, actionError: message });
      setTimeout(() => wx.showToast({ title: message, icon: 'none', duration: 2500 }), 120);
    }
  },
});
