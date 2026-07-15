Component({
  properties: {
    loading: { type: Boolean, value: false },
    list: { type: Array, value: [] },
    hasMore: { type: Boolean, value: true },
    emptyIcon: { type: String, value: 'browse' },
    emptyDesc: { type: String, value: '暂无数据' },
    skeleton: { type: Boolean, value: true },
  },
});
