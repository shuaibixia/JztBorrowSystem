/**
 * 云函数调用封装
 */
function callCloud(name, data = {}) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name,
      data,
      success: (res) => {
        const result = res.result;
        if (!result || typeof result !== 'object') {
          reject(new Error('云函数返回异常'));
        } else if (result.code && result.code !== 0) {
          reject(new Error(result.message || '操作失败'));
        } else {
          resolve(result);
        }
      },
      fail: (err) => {
        console.error(`云函数 ${name} 调用失败:`, err);
        reject(err);
      },
    });
  });
}

module.exports = { callCloud };
