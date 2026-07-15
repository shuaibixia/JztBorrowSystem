const { callCloud } = require('./cloud');

/**
 * 获取用户登录状态
 */
function checkLogin() {
  const app = getApp();
  if (app.globalData.userInfo) {
    return Promise.resolve(app.globalData.userInfo);
  }
  return callCloud('user', { action: 'getProfile' })
    .then((res) => {
      if (res.data) {
        app.globalData.userInfo = res.data;
        app.globalData.isLoggedIn = true;
        return res.data;
      }
      return null;
    })
    .catch(() => null);
}

/**
 * 绑定学号登录
 */
function bindStudentId(studentId) {
  const app = getApp();
  return callCloud('user', {
    action: 'bindStudentId',
    studentId,
  }).then((res) => {
    app.globalData.userInfo = res.data;
    app.globalData.isLoggedIn = true;
    return res.data;
  });
}

/**
 * 获取用户统计
 */
function getStats() {
  return callCloud('user', { action: 'getStats' });
}

module.exports = {
  checkLogin,
  bindStudentId,
  getStats,
};
