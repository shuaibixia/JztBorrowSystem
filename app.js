App({
  globalData: {
    userInfo: null,
    isLoggedIn: false,
  },

  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
      return;
    }
    wx.cloud.init({
      env: 'studentpress-d6gj8ugww75193e6d', // 替换为你的云开发环境 ID
      traceUser: true,
    });
  },
});
