const { checkLogin } = require('../utils/auth');

/**
 * 登录检查 behavior
 * 在页面中使用: behaviors: [require('../../behaviors/login')]
 */
module.exports = Behavior({
  data: {
    _loginChecked: false,
    _loginLoading: false,
  },

  lifetimes: {
    attached() {
      this._checkLogin();
    },
  },

  methods: {
    async _checkLogin() {
      if (this.data._loginChecked) return;
      this.setData({ _loginLoading: true });
      try {
        const userInfo = await checkLogin();
        if (userInfo) {
          this.setData({ userInfo, isLoggedIn: true, _loginChecked: true });
          this.onLoginSuccess && this.onLoginSuccess(userInfo);
        } else {
          this.setData({ userInfo: null, isLoggedIn: false, _loginChecked: true });
          this.onLoginRequired && this.onLoginRequired();
        }
      } catch (err) {
        console.error('登录检查失败:', err);
        this.setData({ userInfo: null, isLoggedIn: false, _loginChecked: true });
        this.onLoginRequired && this.onLoginRequired(err);
      } finally {
        this.setData({ _loginLoading: false });
      }
    },
  },
});
