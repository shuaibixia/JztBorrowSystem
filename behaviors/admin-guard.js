const { checkLogin } = require('../utils/auth');
const { isAdmin } = require('../utils/util');

module.exports = Behavior({
  data: {
    _guardReady: false,
  },

  lifetimes: {
    attached() {
      this._checkAdmin();
    },
  },

  methods: {
    async _checkAdmin() {
      try {
        const userInfo = await checkLogin();
        if (!userInfo || !isAdmin(userInfo)) {
          wx.showToast({ title: '无权限访问', icon: 'none' });
          setTimeout(() => wx.navigateBack(), 1500);
          return;
        }
        this.setData({ _guardReady: true, userInfo });
        if (this.onAdminReady) this.onAdminReady();
      } catch (err) {
        console.error('权限校验失败:', err);
        wx.navigateBack();
      }
    },
  },
});
