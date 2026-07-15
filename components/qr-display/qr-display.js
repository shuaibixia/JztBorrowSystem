import drawQrcode from 'weapp-qrcode';

Component({
  properties: {
    qrCode: { type: String, value: '' },
    name: { type: String, value: '' },
  },

  observers: {
    qrCode(val) {
      if (val) {
        this._drawQr(val);
      }
    },
  },

  lifetimes: {
    ready() {
      if (this.data.qrCode) {
        this._drawQr(this.data.qrCode);
      }
    },
  },

  methods: {
    _drawQr(text) {
      const query = this.createSelectorQuery();
      query.select('#qrCanvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res[0]) return;
          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          const dpr = wx.getWindowInfo().pixelRatio;
          canvas.width = 200 * dpr;
          canvas.height = 200 * dpr;

          drawQrcode({
            canvas,
            ctx,
            width: 200,
            height: 200,
            text,
            padding: 10,
            background: '#ffffff',
            foreground: '#000000',
            typeNumber: -1,
            correctLevel: 2,
          });
        });
    },

    onSaveToAlbum() {
      if (!this.data.qrCode) return;
      const query = this.createSelectorQuery();
      query.select('#qrCanvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res[0]) {
            wx.showToast({ title: '生成失败', icon: 'none' });
            return;
          }
          const canvas = res[0].node;
          wx.canvasToTempFilePath({
            canvas,
            success: (fileRes) => {
              wx.saveImageToPhotosAlbum({
                filePath: fileRes.tempFilePath,
                success: () => wx.showToast({ title: '已保存到相册', icon: 'success' }),
                fail: (err) => {
                  if (err.errMsg.indexOf('auth deny') !== -1 || err.errMsg.indexOf('authorize') !== -1) {
                    wx.showToast({ title: '请授权相册权限', icon: 'none' });
                  } else {
                    wx.showToast({ title: '保存失败', icon: 'none' });
                  }
                },
              });
            },
            fail: () => wx.showToast({ title: '生成失败', icon: 'none' }),
          });
        });
    },
  },
});
