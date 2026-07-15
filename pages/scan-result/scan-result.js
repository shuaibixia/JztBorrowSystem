const equipmentService = require('../../utils/equipment-service');
const recordService = require('../../utils/record-service');
const { getStatusInfo, getCategoryInfo, formatDate, isAdmin } = require('../../utils/util');
const approvalService = require('../../utils/approval-service');
const loginBehavior = require('../../behaviors/login');

Page({
  behaviors: [loginBehavior],

  data: {
    qr: '',
    equipment: null,
    loading: true,
    notFound: false,
    error: false,
    errorMessage: '',
    userInfo: null,
    actionLoading: false,
    actionError: '',
    isAdminUser: false,
    buttonInfo: { text: '', disabled: true, theme: 'default' },
    // 操作弹窗
    showDialog: false,
    showApprovalDialog: false,
    dialogType: '', // 'checkout' or 'return'
    purpose: '',
    approvalPurpose: '',
    remark: '',
    conditionIndex: 0,
    conditionOptions: ['优秀', '良好', '一般', '较差'],
  },

  async onLoad(options) {
    const qr = decodeURIComponent(options.qr || '');
    this.setData({ qr });
    await this.loadEquipment(qr);
  },

  async loadEquipment(qr) {
    this.setData({ loading: true, notFound: false, error: false, errorMessage: '' });
    try {
      const eqRes = await equipmentService.getByQR(qr);

      if (!eqRes.data) {
        this.setData({ notFound: true, loading: false });
        return;
      }

      const equipment = eqRes.data;
      equipment.statusInfo = getStatusInfo(equipment.status);
      equipment.categoryInfo = getCategoryInfo(equipment.category);
      equipment.checkedOutAtStr = formatDate(equipment.checkedOutAt);

      this.setData({ equipment, loading: false });
      this._updateButtonInfo();
    } catch (err) {
      console.error('查询器材失败:', err);
      this.setData({
        error: true,
        errorMessage: err.message || '加载扫码结果失败',
        loading: false,
      });
    }
  },

  onRetryTap() {
    this.loadEquipment(this.data.qr);
  },

  onLoginSuccess(userInfo) {
    this.setData({ userInfo, isAdminUser: isAdmin(userInfo) });
    this._updateButtonInfo();
  },

  _updateButtonInfo() {
    const info = this.getButtonInfo();
    this.setData({ buttonInfo: info });
  },

  // 判断按钮状态
  canCheckout() {
    const { equipment } = this.data;
    return equipment && equipment.status === 'available';
  },

  canReturn() {
    const { equipment, userInfo, isAdminUser } = this.data;
    return (
      equipment &&
      equipment.status === 'checked_out' &&
      userInfo &&
      (isAdminUser || equipment.currentHolder === userInfo._openid)
    );
  },

  getButtonInfo() {
    const { equipment, userInfo, isAdminUser } = this.data;
    if (!equipment) return { text: '', disabled: true, theme: 'default' };

    if (equipment.status === 'available') {
      return { text: isAdminUser ? '出库' : '申请借用', disabled: false, theme: 'primary' };
    }
    if (equipment.status === 'checked_out') {
      if (userInfo && (isAdminUser || equipment.currentHolder === userInfo._openid)) {
        return { text: '归还', disabled: false, theme: 'primary' };
      }
      return { text: `由 ${equipment.currentHolderName || '他人'} 借出`, disabled: true, theme: 'default' };
    }
    if (equipment.status === 'maintenance') {
      return { text: '维修中', disabled: true, theme: 'default' };
    }
    return { text: '已退役', disabled: true, theme: 'default' };
  },

  onActionTap() {
    if (this.data.actionLoading || this.data.buttonInfo.disabled) return;
    this.setData({ actionError: '' });
    if (this.canCheckout()) {
      if (this.data.isAdminUser) {
        this.setData({ showDialog: true, dialogType: 'checkout', purpose: '' });
      } else {
        this.setData({ showApprovalDialog: true, approvalPurpose: '' });
      }
    } else if (this.canReturn()) {
      this.setData({ showDialog: true, dialogType: 'return', remark: '', conditionIndex: 0 });
    }
  },

  onApprovalPurposeInput(e) {
    this.setData({ approvalPurpose: e.detail.value });
  },

  onApprovalCancel() {
    if (this.data.actionLoading) return;
    this.setData({ showApprovalDialog: false });
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

  onPurposeInput(e) {
    this.setData({ purpose: e.detail.value });
  },

  onRemarkInput(e) {
    this.setData({ remark: e.detail.value });
  },

  onConditionChange(e) {
    const value = Number(e.detail.value || 1);
    this.setData({ conditionIndex: Math.max(0, value - 1) });
  },

  onDialogCancel() {
    if (this.data.actionLoading) return;
    this.setData({ showDialog: false });
  },

  async onDialogConfirm() {
    if (this.data.actionLoading) return;
    const { dialogType, qr, purpose, remark, conditionIndex, conditionOptions } = this.data;
    this.setData({ actionLoading: true });

    try {
      if (dialogType === 'checkout') {
        if (!purpose.trim()) {
          wx.showToast({ title: '请填写用途', icon: 'none' });
          this.setData({ actionLoading: false });
          return;
        }
        await recordService.checkout({
          equipmentQR: qr,
          purpose: purpose.trim(),
        });
        wx.showToast({ title: '出库成功', icon: 'success' });
      } else {
        const conditionMap = ['excellent', 'good', 'fair', 'poor'];
        await recordService.returnEquipment({
          equipmentQR: qr,
          condition_after: conditionMap[conditionIndex],
          remark: remark.trim(),
        });
        wx.showToast({ title: '归还成功', icon: 'success' });
      }

      this.setData({ showDialog: false, actionLoading: false, actionError: '' });
      // 重新加载器材状态
      await this.loadEquipment(qr);
    } catch (err) {
      const message = err.message || '操作失败';
      this.setData({ showDialog: false, actionLoading: false, actionError: message });
      setTimeout(() => wx.showToast({ title: message, icon: 'none', duration: 2500 }), 120);
    }
  },

  onScanAgain() {
    wx.scanCode({
      scanType: ['qrCode'],
      success: (res) => {
        const qr = encodeURIComponent(res.result);
        wx.redirectTo({ url: `/pages/scan-result/scan-result?qr=${qr}` });
      },
      fail: (err) => {
        if (err.errMsg.indexOf('cancel') === -1) {
          console.error('扫码失败:', err);
        }
      },
    });
  },

  onViewDetail() {
    const { equipment } = this.data;
    if (equipment) {
      wx.navigateTo({ url: `/pages/equipment-detail/equipment-detail?id=${equipment._id}` });
    }
  },
});
