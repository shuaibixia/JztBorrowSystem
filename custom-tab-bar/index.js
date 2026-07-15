Component({
  options: {
    addGlobalClass: true,
  },

  data: {
    value: 'home',
    theme: 'light',
  },

  lifetimes: {
    attached() {
      this.updateTheme();
      wx.onThemeChange((res) => {
        this.updateTheme(res.theme);
      });
    },
    detached() {
      wx.offThemeChange();
    },
  },

  methods: {
    updateTheme(theme) {
      const currentTheme = theme || wx.getSystemInfoSync().theme || 'light';
      this.setData({ theme: currentTheme });
    },

    onChange(e) {
      const value = e.detail.value;
      this.setData({ value });
      const routes = {
        home: '/pages/index/index',
        records: '/pages/record-list/record-list',
        scan: '/pages/scan/scan',
        profile: '/pages/profile/profile',
      };
      wx.switchTab({ url: routes[value] });
    },
  },
});
