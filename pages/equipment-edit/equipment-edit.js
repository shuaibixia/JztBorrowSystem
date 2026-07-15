const equipmentService = require('../../utils/equipment-service');
const { CATEGORIES, CONDITIONS } = require('../../utils/constants');
const adminGuard = require('../../behaviors/admin-guard');

Page({
  behaviors: [adminGuard],

  data: {
    isEdit: false,
    id: '',
    name: '',
    categoryIndex: 0,
    categoryOptions: CATEGORIES.map((c) => c.label),
    brand: '',
    model: '',
    serialNumber: '',
    location: '',
    description: '',
    conditionIndex: 1,
    conditionOptions: CONDITIONS.map((c) => c.label),
    imageUrl: '',
    fileList: [],
    saving: false,
    showDeleteDialog: false,
  },

  onLoad(options) {
    this._pendingOptions = options;
  },

  onAdminReady() {
    const options = this._pendingOptions || {};
    if (options.id) {
      this.setData({ isEdit: true, id: options.id });
      wx.setNavigationBarTitle({ title: '编辑器材' });
      this.loadEquipment();
    } else {
      wx.setNavigationBarTitle({ title: '新增器材' });
    }
  },

  async loadEquipment() {
    try {
      const res = await equipmentService.getById(this.data.id);
      const eq = res.data;
      const categoryIndex = CATEGORIES.findIndex((c) => c.value === eq.category);
      const conditionIndex = CONDITIONS.findIndex((c) => c.value === eq.condition);

      const fileList = eq.imageUrl
        ? [{ url: eq.imageUrl, name: '器材图片' }]
        : [];

      this.setData({
        name: eq.name,
        categoryIndex: categoryIndex >= 0 ? categoryIndex : 0,
        brand: eq.brand || '',
        model: eq.model || '',
        serialNumber: eq.serialNumber || '',
        location: eq.location || '',
        description: eq.description || '',
        conditionIndex: conditionIndex >= 0 ? conditionIndex : 1,
        imageUrl: eq.imageUrl || '',
        fileList,
      });
    } catch (err) {
      console.error('加载器材失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  onNameInput(e) { this.setData({ name: e.detail.value }); },
  onCategoryChange(e) { this.setData({ categoryIndex: e.detail.value }); },
  onBrandInput(e) { this.setData({ brand: e.detail.value }); },
  onModelInput(e) { this.setData({ model: e.detail.value }); },
  onSerialInput(e) { this.setData({ serialNumber: e.detail.value }); },
  onLocationInput(e) { this.setData({ location: e.detail.value }); },
  onDescInput(e) { this.setData({ description: e.detail.value }); },
  onConditionChange(e) { this.setData({ conditionIndex: e.detail.value }); },

  onUploadSuccess(e) {
    const { file } = e.detail;
    this.setData({ imageUrl: file.url || file.tempFilePath, fileList: [file] });
  },

  onUploadRemove() {
    this.setData({ imageUrl: '', fileList: [] });
  },

  async onSave() {
    const { name, categoryIndex, brand, model, serialNumber, location, description, conditionIndex, imageUrl, isEdit, id } = this.data;

    if (!name.trim()) {
      wx.showToast({ title: '请输入器材名称', icon: 'none' });
      return;
    }

    this.setData({ saving: true });
    try {
      const data = {
        name: name.trim(),
        category: CATEGORIES[categoryIndex].value,
        brand: brand.trim(),
        model: model.trim(),
        serialNumber: serialNumber.trim(),
        location: location.trim(),
        description: description.trim(),
        condition: CONDITIONS[conditionIndex].value,
        imageUrl,
      };

      if (isEdit) {
        await equipmentService.updateEquipment(id, data);
        wx.showToast({ title: '保存成功', icon: 'success' });
      } else {
        const res = await equipmentService.createEquipment(data);
        wx.showToast({ title: '创建成功', icon: 'success' });
        setTimeout(() => {
          wx.redirectTo({ url: '/pages/equipment-edit/equipment-edit?id=' + res.data._id });
        }, 1500);
      }
      this.setData({ saving: false });
    } catch (err) {
      this.setData({ saving: false });
      wx.showToast({ title: err.message || '保存失败', icon: 'none' });
    }
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

  onShowQr() {
    if (this.data.id) {
      wx.navigateTo({ url: '/pages/equipment-detail/equipment-detail?id=' + this.data.id });
    }
  },
});
