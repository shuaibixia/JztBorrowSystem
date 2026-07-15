const { callCloud } = require('../../utils/cloud');

Page({
  data: {
    setupCode: '',
    adminName: '',
    loading: false,
  },

  onCodeInput(e) {
    this.setData({ setupCode: e.detail.value });
  },

  onNameInput(e) {
    this.setData({ adminName: e.detail.value });
  },

  async onSubmit() {
    const { setupCode, adminName } = this.data;
    if (!setupCode.trim()) {
      wx.showToast({ title: '请输入设置口令', icon: 'none' });
      return;
    }
    if (!adminName.trim()) {
      wx.showToast({ title: '请输入姓名', icon: 'none' });
      return;
    }

    this.setData({ loading: true });
    try {
      const res = await callCloud('user', {
        action: 'firstSetup',
        name: adminName.trim(),
        code: setupCode.trim(),
      });
      const app = getApp();
      app.globalData.userInfo = res.data;
      app.globalData.isLoggedIn = true;
      wx.showToast({ title: '管理员创建成功', icon: 'success' });
      setTimeout(() => {
        wx.switchTab({ url: '/pages/profile/profile' });
      }, 1500);
    } catch (err) {
      this.setData({ loading: false });
      wx.showToast({ title: err.message || '设置失败', icon: 'none' });
    }
  },
});
