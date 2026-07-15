const { callCloud } = require('../../utils/cloud');
const { checkLogin } = require('../../utils/auth');
const { isAdmin, getStatusInfo } = require('../../utils/util');
const { CATEGORIES } = require('../../utils/constants');

Page({
  data: {
    isLoggedIn: false,
    isAdminUser: false,

    // Tab
    mainTab: 0,
    subTab: 0,
    equipmentTabs: ['单条录入', '批量导入', '器材列表'],
    studentTabs: ['单条录入', '批量导入', '学生列表'],

    // 学生-单条录入
    formStudentId: '',
    formName: '',
    formPhoto: '',
    fileList: [],
    submitting: false,

    // 学生-批量导入
    batchJson: '',
    batchLoading: false,
    batchResult: null,

    // 学生-列表
    studentList: [],
    listLoading: false,
    listPage: 1,
    listTotal: 0,
    keyword: '',

    // 器材-分类
    categoryLabels: CATEGORIES.map(c => c.label),
    categoryValues: CATEGORIES.map(c => c.value),

    // 器材-单条录入
    eqCategoryIndex: -1,
    eqModel: '',
    eqSerialNumber: '',
    eqSubmitting: false,

    // 器材-批量导入
    eqBatchJson: '',
    eqBatchLoading: false,
    eqBatchResult: null,

    // 器材-列表
    equipmentList: [],
    eqListLoading: false,
    eqListTotal: 0,
    eqKeyword: '',
  },

  onLoad() {
    this.checkAdmin();
  },

  async checkAdmin() {
    const userInfo = await checkLogin();
    if (!userInfo || !isAdmin(userInfo)) {
      wx.showToast({ title: '权限不足', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }
    this.setData({ isLoggedIn: true, isAdminUser: true });
    this.loadEquipmentList();
  },

  // ===== Tab 切换 =====

  onMainTabChange(e) {
    const index = Number(e.currentTarget.dataset.index);
    this.setData({ mainTab: index, subTab: 0 });
    if (index === 0) this.loadEquipmentList();
    if (index === 1) this.loadStudents();
  },

  onSubTabChange(e) {
    const index = Number(e.currentTarget.dataset.index);
    this.setData({ subTab: index });
    if (this.data.mainTab === 0 && index === 2) this.loadEquipmentList();
    if (this.data.mainTab === 1 && index === 2) this.loadStudents();
  },

  // ===== 学生-单条录入 =====

  onStudentIdInput(e) {
    this.setData({ formStudentId: e.detail.value.replace(/\D/g, '') });
  },

  onNameInput(e) {
    this.setData({ formName: e.detail.value });
  },

  onUploadSuccess(e) {
    const file = e.detail.files[0];
    this.setData({
      formPhoto: file.url || file.tempFilePath || '',
      fileList: e.detail.files,
    });
  },

  onUploadRemove() {
    this.setData({ formPhoto: '', fileList: [] });
  },

  async onSubmitStudent() {
    const { formStudentId, formName, formPhoto } = this.data;
    if (formStudentId.length !== 12) {
      wx.showToast({ title: '学号须为12位数字', icon: 'none' });
      return;
    }
    if (!formName.trim()) {
      wx.showToast({ title: '请输入姓名', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });
    try {
      await callCloud('user', {
        action: 'addStudent',
        studentId: formStudentId,
        name: formName.trim(),
        photo: formPhoto,
      });
      wx.showToast({ title: '添加成功', icon: 'success' });
      this.setData({
        formStudentId: '',
        formName: '',
        formPhoto: '',
        fileList: [],
        submitting: false,
      });
    } catch (err) {
      this.setData({ submitting: false });
      wx.showToast({ title: err.message || '添加失败', icon: 'none' });
    }
  },

  // ===== 学生-批量导入 =====

  onBatchJsonInput(e) {
    this.setData({ batchJson: e.detail.value });
  },

  async onBatchImport() {
    const { batchJson } = this.data;
    let list;
    try {
      list = JSON.parse(batchJson.trim());
      if (!Array.isArray(list)) throw new Error();
    } catch {
      wx.showToast({ title: 'JSON 格式错误，须为数组', icon: 'none' });
      return;
    }

    this.setData({ batchLoading: true, batchResult: null });
    try {
      const res = await callCloud('user', {
        action: 'batchImportStudents',
        list,
      });
      this.setData({ batchLoading: false, batchResult: res.data });
    } catch (err) {
      this.setData({ batchLoading: false });
      wx.showToast({ title: err.message || '导入失败', icon: 'none' });
    }
  },

  // ===== 学生-列表 =====

  async loadStudents() {
    this.setData({ listLoading: true });
    try {
      const res = await callCloud('user', {
        action: 'listStudents',
        page: 1,
        pageSize: 50,
        keyword: this.data.keyword,
      });
      this.setData({
        studentList: res.data.list,
        listTotal: res.data.total,
        listLoading: false,
        listPage: 1,
      });
    } catch (err) {
      this.setData({ listLoading: false });
    }
  },

  onSearchInput(e) {
    this.setData({ keyword: e.detail.value });
  },

  onSearch() {
    this.loadStudents();
  },

  // ===== 器材-单条录入 =====

  onEqCategoryChange(e) {
    this.setData({ eqCategoryIndex: Number(e.detail.value) });
  },

  onEqModelInput(e) {
    this.setData({ eqModel: e.detail.value });
  },

  onEqSnInput(e) {
    this.setData({ eqSerialNumber: e.detail.value });
  },

  async onSubmitEquipment() {
    const { eqCategoryIndex, eqModel, eqSerialNumber, categoryValues } = this.data;
    if (eqCategoryIndex < 0) {
      wx.showToast({ title: '请选择器材类型', icon: 'none' });
      return;
    }
    if (!eqModel.trim()) {
      wx.showToast({ title: '请输入型号', icon: 'none' });
      return;
    }
    if (!eqSerialNumber.trim()) {
      wx.showToast({ title: '请输入SN码', icon: 'none' });
      return;
    }

    this.setData({ eqSubmitting: true });
    try {
      await callCloud('equipment', {
        action: 'create',
        category: categoryValues[eqCategoryIndex],
        model: eqModel.trim(),
        serialNumber: eqSerialNumber.trim(),
        name: eqModel.trim(),
      });
      wx.showToast({ title: '添加成功', icon: 'success' });
      this.setData({
        eqCategoryIndex: -1,
        eqModel: '',
        eqSerialNumber: '',
        eqSubmitting: false,
      });
    } catch (err) {
      this.setData({ eqSubmitting: false });
      wx.showToast({ title: err.message || '添加失败', icon: 'none' });
    }
  },

  // ===== 器材-批量导入 =====

  onEqBatchJsonInput(e) {
    this.setData({ eqBatchJson: e.detail.value });
  },

  async onEqBatchImport() {
    const { eqBatchJson } = this.data;
    let list;
    try {
      list = JSON.parse(eqBatchJson.trim());
      if (!Array.isArray(list)) throw new Error();
    } catch {
      wx.showToast({ title: 'JSON 格式错误，须为数组', icon: 'none' });
      return;
    }

    this.setData({ eqBatchLoading: true, eqBatchResult: null });
    try {
      const res = await callCloud('equipment', {
        action: 'batchImport',
        list,
      });
      this.setData({ eqBatchLoading: false, eqBatchResult: res.data });
    } catch (err) {
      this.setData({ eqBatchLoading: false });
      wx.showToast({ title: err.message || '导入失败', icon: 'none' });
    }
  },

  // ===== 器材-列表 =====

  async loadEquipmentList() {
    this.setData({ eqListLoading: true });
    try {
      const res = await callCloud('equipment', {
        action: 'list',
        page: 1,
        pageSize: 50,
        keyword: this.data.eqKeyword || undefined,
      });
      const list = res.data.list.map(item => ({
        ...item,
        categoryLabel: (CATEGORIES.find(c => c.value === item.category) || {}).label || item.category,
        statusInfo: getStatusInfo(item.status),
      }));
      this.setData({
        equipmentList: list,
        eqListTotal: res.data.total,
        eqListLoading: false,
      });
    } catch (err) {
      this.setData({ eqListLoading: false });
    }
  },

  onEqSearchInput(e) {
    this.setData({ eqKeyword: e.detail.value });
  },

  onEqSearch() {
    this.loadEquipmentList();
  },
});
