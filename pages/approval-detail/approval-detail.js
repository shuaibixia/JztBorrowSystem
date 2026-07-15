const approvalService = require('../../utils/approval-service');
const { checkLogin } = require('../../utils/auth');
const { isAdmin, formatDate, getApprovalInfo } = require('../../utils/util');

Page({
  data: {
    id: '',
    approval: null,
    userInfo: null,
    isAdmin: false,
    loading: true,
    error: false,
    errorMessage: '',
    notFound: false,
    canReviewApproval: false,
    actionError: '',
    // 操作
    showRejectDialog: false,
    showApproveDialog: false,
    rejectReason: '',
    approveRemark: '',
    actionLoading: false,
  },

  async onLoad(options) {
    this.setData({ id: options.id });
    await this.loadData();
  },

  async loadData() {
    this.setData({ loading: true, error: false, errorMessage: '', notFound: false });
    try {
      const [userInfo, approvalRes] = await Promise.all([
        checkLogin(),
        approvalService.getById(this.data.id),
      ]);
      const approval = approvalRes.data || approvalRes;
      const admin = isAdmin(userInfo);
      if (!approval) {
        this.setData({
          approval: null,
          userInfo,
          isAdmin: admin,
          canReviewApproval: false,
          notFound: true,
          loading: false,
        });
        return;
      }
      if (approval) {
        approval.statusInfo = getApprovalInfo(approval.status);
        approval.createdAtStr = formatDate(approval.createdAt);
        approval.reviewedAtStr = formatDate(approval.reviewedAt);
      }
      this.setData({
        approval,
        userInfo,
        isAdmin: admin,
        canReviewApproval: admin && approval.status === 'pending',
        loading: false,
      });
    } catch (err) {
      console.error('加载审批详情失败:', err);
      this.setData({
        approval: null,
        loading: false,
        error: true,
        errorMessage: err.message || '审批详情加载失败',
        canReviewApproval: false,
      });
    }
  },

  onRetryTap() {
    this.loadData();
  },

  onBackTap() {
    wx.navigateBack();
  },

  onApproveTap() {
    if (!this.data.canReviewApproval || this.data.actionLoading) return;
    this.setData({ showApproveDialog: true, approveRemark: '', actionError: '' });
  },

  onRejectTap() {
    if (!this.data.canReviewApproval || this.data.actionLoading) return;
    this.setData({ showRejectDialog: true, rejectReason: '', actionError: '' });
  },

  onApproveCancel() {
    if (this.data.actionLoading) return;
    this.setData({ showApproveDialog: false });
  },

  onRejectCancel() {
    if (this.data.actionLoading) return;
    this.setData({ showRejectDialog: false });
  },

  onApproveRemarkInput(e) {
    this.setData({ approveRemark: e.detail.value, actionError: '' });
  },

  onRejectReasonInput(e) {
    this.setData({ rejectReason: e.detail.value, actionError: '' });
  },

  async onApproveConfirm() {
    if (this.data.actionLoading || !this.data.canReviewApproval) return;
    this.setData({ actionLoading: true, actionError: '' });
    try {
      await approvalService.approveRequest(this.data.id, this.data.approveRemark);
      wx.showToast({ title: '已通过', icon: 'success' });
      this.setData({ showApproveDialog: false, actionLoading: false, actionError: '' });
      await this.loadData();
    } catch (err) {
      const message = err.message || '操作失败';
      this.setData({ showApproveDialog: false, actionLoading: false, actionError: message });
      wx.showToast({ title: message, icon: 'none' });
    }
  },

  async onRejectConfirm() {
    if (this.data.actionLoading || !this.data.canReviewApproval) return;
    this.setData({ actionLoading: true, actionError: '' });
    try {
      await approvalService.rejectRequest(this.data.id, this.data.rejectReason);
      wx.showToast({ title: '已拒绝', icon: 'success' });
      this.setData({ showRejectDialog: false, actionLoading: false, actionError: '' });
      await this.loadData();
    } catch (err) {
      const message = err.message || '操作失败';
      this.setData({ showRejectDialog: false, actionLoading: false, actionError: message });
      wx.showToast({ title: message, icon: 'none' });
    }
  },
});
