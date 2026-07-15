const reservationService = require('../../utils/reservation-service');
const { checkLogin } = require('../../utils/auth');
const { formatDate, getReservationInfo, isAdmin } = require('../../utils/util');

Page({
  data: {
    id: '',
    reservation: null,
    userInfo: null,
    loading: true,
    error: false,
    errorMessage: '',
    notFound: false,
    statusInfo: {},
    dateStr: '',
    createdAtStr: '',
    isAdmin: false,
    canCancelReservation: false,
    canConfirmReservation: false,
    showCancelDialog: false,
    cancelling: false,
    showConfirmDialog: false,
    confirming: false,
    actionError: '',
  },

  async onLoad(options) {
    this.setData({ id: options.id || '' });
    await this.loadDetail();
  },

  async loadDetail() {
    this.setData({ loading: true, error: false, errorMessage: '', notFound: false, actionError: '' });
    try {
      const [userInfo, res] = await Promise.all([
        checkLogin(),
        reservationService.getReservationById(this.data.id),
      ]);
      const reservation = res.data;
      if (!reservation) {
        this.setData({
          reservation: null,
          userInfo,
          notFound: true,
          loading: false,
          canCancelReservation: false,
          canConfirmReservation: false,
        });
        return;
      }

      const admin = isAdmin(userInfo);
      const isOwner = reservation.userOpenId === userInfo._openid;
      const canOperate = admin || isOwner;
      this.setData({
        reservation,
        userInfo,
        statusInfo: getReservationInfo(reservation.status),
        dateStr: formatDate(reservation.startDate, 'YYYY-MM-DD HH:mm') + ' ~ ' + formatDate(reservation.endDate, 'YYYY-MM-DD HH:mm'),
        createdAtStr: formatDate(reservation.createdAt, 'YYYY-MM-DD HH:mm'),
        isAdmin: admin,
        canCancelReservation: canOperate && (reservation.status === 'pending' || reservation.status === 'confirmed'),
        canConfirmReservation: admin && reservation.status === 'pending',
        loading: false,
      });
    } catch (err) {
      console.error('加载预约详情失败:', err);
      this.setData({
        reservation: null,
        loading: false,
        error: true,
        errorMessage: err.message || '预约详情加载失败',
        canCancelReservation: false,
        canConfirmReservation: false,
      });
    }
  },

  onRetryTap() {
    this.loadDetail();
  },

  onBackTap() {
    wx.navigateBack();
  },

  onConfirmTap() {
    if (this.data.confirming || !this.data.canConfirmReservation) return;
    this.setData({ showConfirmDialog: true, actionError: '' });
  },

  onConfirmCancel() {
    if (this.data.confirming) return;
    this.setData({ showConfirmDialog: false });
  },

  async onConfirmConfirm() {
    if (this.data.confirming) return;
    this.setData({ confirming: true, actionError: '' });
    try {
      await reservationService.confirmReservation(this.data.id);
      wx.showToast({ title: '已确认', icon: 'success' });
      this.setData({ showConfirmDialog: false, confirming: false });
      await this.loadDetail();
    } catch (err) {
      this.setData({ confirming: false, actionError: err.message || '确认失败' });
      wx.showToast({ title: err.message || '确认失败', icon: 'none' });
    }
  },

  onCancelTap() {
    if (this.data.cancelling || !this.data.canCancelReservation) return;
    this.setData({ showCancelDialog: true, actionError: '' });
  },

  onCancelCancel() {
    if (this.data.cancelling) return;
    this.setData({ showCancelDialog: false });
  },

  async onCancelConfirm() {
    if (this.data.cancelling) return;
    this.setData({ cancelling: true, actionError: '' });
    try {
      await reservationService.cancelReservation(this.data.id);
      wx.showToast({ title: '已取消', icon: 'success' });
      this.setData({ showCancelDialog: false, cancelling: false });
      await this.loadDetail();
    } catch (err) {
      this.setData({ cancelling: false, actionError: err.message || '取消失败' });
      wx.showToast({ title: err.message || '取消失败', icon: 'none' });
    }
  },

});
