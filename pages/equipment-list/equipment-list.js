const equipmentService = require('../../utils/equipment-service');
const { CATEGORIES } = require('../../utils/constants');
const paginationBehavior = require('../../behaviors/pagination');

Page({
  behaviors: [paginationBehavior],

  data: {
    keyword: '',
    categoryIndex: 0,
    categoryOptions: [{ label: '全部分类', value: '' }, ...CATEGORIES],
  },

  onLoad() {
    this.loadList(true);
  },

  async _fetchList(page, pageSize) {
    const { keyword, categoryIndex } = this.data;
    const params = { page, pageSize };
    if (keyword) params.keyword = keyword;
    if (categoryIndex > 0) params.category = CATEGORIES[categoryIndex - 1].value;

    const res = await equipmentService.list(params);
    const data = res.data || res;
    return data.list || [];
  },

  onSearchChange(e) {
    this.setData({ keyword: e.detail.value });
    if (this._searchTimer) clearTimeout(this._searchTimer);
    this._searchTimer = setTimeout(() => {
      this.loadList(true);
    }, 300);
  },

  onCategoryTap(e) {
    const index = Number(e.currentTarget.dataset.index);
    if (index === this.data.categoryIndex) return;
    this.setData({ categoryIndex: index });
    this.loadList(true);
  },

  onClearSearch() {
    this.setData({ keyword: '' });
    this.loadList(true);
  },

  onItemTap(e) {
    const id = e.detail.id;
    wx.navigateTo({ url: `/pages/equipment-detail/equipment-detail?id=${id}` });
  },
});
