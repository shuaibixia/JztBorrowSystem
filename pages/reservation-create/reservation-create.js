const reservationService = require('../../utils/reservation-service');
const equipmentService = require('../../utils/equipment-service');
const { formatDate } = require('../../utils/util');

Page({
  data: {
    equipmentId: '',
    equipmentName: '',
    loadingEquipment: false,
    equipmentError: false,
    equipmentErrorMessage: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    startDisplay: '',
    endDisplay: '',
    startTimestamp: 0,
    endTimestamp: 0,
    dateTimeMode: ['date', 'minute'],
    pickerStart: '',
    pickerEnd: '',
    purpose: '',
    saving: false,
    showStartPicker: false,
    showEndPicker: false,
    actionError: '',
  },

  async onLoad(options) {
    this.setData({ equipmentId: options.equipmentId || '' });
    this.initDefaultTime();
    await this.loadEquipment();
  },

  initDefaultTime() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), 0);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    const pickerEnd = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);

    this.setData({
      startDate: formatDate(start, 'YYYY-MM-DD'),
      startTime: formatDate(start, 'HH:mm'),
      endDate: formatDate(end, 'YYYY-MM-DD'),
      endTime: formatDate(end, 'HH:mm'),
      startDisplay: formatDate(start, 'YYYY-MM-DD HH:mm'),
      endDisplay: formatDate(end, 'YYYY-MM-DD HH:mm'),
      startTimestamp: start.getTime(),
      endTimestamp: end.getTime(),
      pickerStart: formatDate(start, 'YYYY-MM-DD HH:mm:ss'),
      pickerEnd: formatDate(pickerEnd, 'YYYY-MM-DD HH:mm:ss'),
    });
  },

  async loadEquipment() {
    const { equipmentId } = this.data;
    if (!equipmentId) {
      this.setData({
        equipmentName: '',
        loadingEquipment: false,
        equipmentError: true,
        equipmentErrorMessage: '缺少器材信息，请从器材详情页重新进入预约',
        actionError: '',
      });
      return;
    }

    this.setData({ loadingEquipment: true, equipmentError: false, equipmentErrorMessage: '', actionError: '' });
    if (this.data.equipmentId) {
      try {
        const res = await equipmentService.getById(this.data.equipmentId);
        const equipment = res.data || res;
        if (!equipment) {
          this.setData({
            equipmentName: '',
            loadingEquipment: false,
            equipmentError: true,
            equipmentErrorMessage: '器材不存在',
          });
          return;
        }
        this.setData({
          equipmentName: equipment.name || '未命名器材',
          loadingEquipment: false,
          equipmentError: false,
          equipmentErrorMessage: '',
        });
      } catch (err) {
        console.error('获取器材信息失败:', err);
        this.setData({
          equipmentName: '',
          loadingEquipment: false,
          equipmentError: true,
          equipmentErrorMessage: err.message || '器材信息加载失败',
        });
      }
    }
  },

  onRetryEquipment() {
    this.loadEquipment();
  },

  onBackTap() {
    wx.navigateBack();
  },

  onShowStartPicker() {
    if (this.data.equipmentError) return;
    this.setData({ showStartPicker: true, actionError: '' });
  },

  onShowEndPicker() {
    if (this.data.equipmentError) return;
    this.setData({ showEndPicker: true, actionError: '' });
  },

  onPickerCancel() {
    this.setData({ showStartPicker: false, showEndPicker: false });
  },

  onStartConfirm(e) {
    const date = this.parsePickerDate(e.detail.value);
    if (!this.isValidDate(date)) {
      wx.showToast({ title: '开始时间无效', icon: 'none' });
      return;
    }
    const startDate = formatDate(date, 'YYYY-MM-DD');
    const startTime = formatDate(date, 'HH:mm');
    this.setData({
      startDate,
      startTime,
      startDisplay: `${startDate} ${startTime}`,
      startTimestamp: date.getTime(),
      showStartPicker: false,
      actionError: '',
    });
  },

  onEndConfirm(e) {
    const date = this.parsePickerDate(e.detail.value);
    if (!this.isValidDate(date)) {
      wx.showToast({ title: '结束时间无效', icon: 'none' });
      return;
    }
    const endDate = formatDate(date, 'YYYY-MM-DD');
    const endTime = formatDate(date, 'HH:mm');
    this.setData({
      endDate,
      endTime,
      endDisplay: `${endDate} ${endTime}`,
      endTimestamp: date.getTime(),
      showEndPicker: false,
      actionError: '',
    });
  },

  onPurposeInput(e) { this.setData({ purpose: e.detail.value, actionError: '' }); },

  parsePickerDate(value) {
    if (typeof value === 'number') return new Date(value);
    const text = String(value || '').trim();
    const match = text.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
    if (match) {
      const [, year, month, day, hour, minute, second = '0'] = match;
      return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
    }
    return new Date(value);
  },

  isValidDate(date) {
    return date instanceof Date && Number.isFinite(date.getTime());
  },

  async onSubmit() {
    if (this.data.saving) return;

    const { equipmentId, equipmentError, loadingEquipment, startTimestamp, endTimestamp, purpose } = this.data;

    if (loadingEquipment) {
      this.setData({ actionError: '器材信息加载中' });
      wx.showToast({ title: '器材信息加载中', icon: 'none' });
      return;
    }

    if (equipmentError || !equipmentId) {
      this.setData({ actionError: '请先选择有效器材' });
      wx.showToast({ title: '请先选择有效器材', icon: 'none' });
      return;
    }

    if (!startTimestamp || !endTimestamp) {
      this.setData({ actionError: '请选择预约时间' });
      wx.showToast({ title: '请选择预约时间', icon: 'none' });
      return;
    }

    const start = new Date(startTimestamp);
    const end = new Date(endTimestamp);
    if (!this.isValidDate(start) || !this.isValidDate(end)) {
      this.setData({ actionError: '预约时间无效' });
      wx.showToast({ title: '预约时间无效', icon: 'none' });
      return;
    }

    if (end <= start) {
      this.setData({ actionError: '结束时间须晚于开始时间' });
      wx.showToast({ title: '结束时间须晚于开始时间', icon: 'none' });
      return;
    }

    this.setData({ saving: true, actionError: '' });
    try {
      await reservationService.createReservation({
        equipmentId,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        purpose: purpose.trim(),
      });
      wx.showToast({ title: '预约已提交', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1500);
    } catch (err) {
      this.setData({ saving: false, actionError: err.message || '预约失败' });
      wx.showToast({ title: err.message || '预约失败', icon: 'none' });
    }
  },
});
