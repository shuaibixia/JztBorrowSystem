const { PAGE_SIZE } = require('../utils/constants');

/**
 * 分页加载 behavior
 * 在页面中使用: behaviors: [require('../../behaviors/pagination')]
 * 需要实现 _fetchList(page, pageSize) 方法，返回数组
 * 可选实现 _transformItems(items) 方法，对列表数据做转换
 */
module.exports = Behavior({
  data: {
    list: [],
    page: 1,
    hasMore: true,
    loading: false,
    refreshing: false,
    error: false,
    errorMessage: '',
  },

  methods: {
    async loadList(reset) {
      if (this.data.loading) return;
      const page = reset ? 1 : this.data.page;
      this.setData({ loading: true, error: false, errorMessage: '' });

      try {
        let list = await this._fetchList(page, PAGE_SIZE);
        if (this._transformItems) {
          list = this._transformItems(list);
        }
        this.setData({
          list: reset ? list : [...this.data.list, ...list],
          page: page + 1,
          hasMore: list.length >= PAGE_SIZE,
          loading: false,
        });
      } catch (err) {
        console.error('加载列表失败:', err);
        this.setData({
          list: reset ? [] : this.data.list,
          loading: false,
          error: true,
          errorMessage: err.message || '加载失败',
        });
      }
    },

    onRetryList() {
      this.loadList(this.data.list.length === 0);
    },

    async onPullDownRefresh() {
      this.setData({ refreshing: true });
      await this.loadList(true);
      wx.stopPullDownRefresh();
      this.setData({ refreshing: false });
    },

    onReachBottom() {
      if (this.data.hasMore && !this.data.loading) {
        this.loadList(false);
      }
    },
  },
});
