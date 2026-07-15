const memberService = require('../../utils/member-service');
const { formatDate } = require('../../utils/util');
const { ROLES } = require('../../utils/constants');
const adminGuard = require('../../behaviors/admin-guard');
const paginationBehavior = require('../../behaviors/pagination');

Page({
  behaviors: [adminGuard, paginationBehavior],

  data: {
    keyword: '',
    roleIndex: 0,
    roleOptions: ['全部角色', ...ROLES.map(r => r.label)],
    roleValues: ['', ...ROLES.map(r => r.value)],
    showAction: false,
    selectedMember: null,
    actions: [
      { name: 'setAdmin', label: '设为管理员' },
      { name: 'setMember', label: '设为成员' },
      { name: 'toggleActive', label: '禁用/启用' },
    ],
  },

  onLoad() { this.loadList(true); },

  async _fetchList(page, pageSize) {
    const { keyword, roleIndex, roleValues } = this.data;
    const params = { page, pageSize };
    if (keyword) params.keyword = keyword;
    if (roleValues[roleIndex]) params.role = roleValues[roleIndex];
    const res = await memberService.listMembers(params);
    return (res.data || res).list || [];
  },

  _transformItems(items) {
    return items.map(m => ({
      ...m,
      createdAtStr: formatDate(m.createdAt, 'YYYY-MM-DD'),
      roleLabel: ROLES.find(r => r.value === m.role)?.label || '未知',
    }));
  },

  onSearchChange(e) {
    this.setData({ keyword: e.detail.value });
    clearTimeout(this._searchTimer);
    this._searchTimer = setTimeout(() => this.loadList(true), 300);
  },

  onClearSearch() {
    this.setData({ keyword: '' });
    this.loadList(true);
  },

  onRoleChange(e) {
    this.setData({ roleIndex: Number(e.detail.value) });
    this.loadList(true);
  },

  onMemberTap(e) {
    const id = e.currentTarget.dataset.id;
    const member = this.data.list.find(m => m._id === id);
    if (member) this.setData({ selectedMember: member, showAction: true });
  },

  onActionCancel() { this.setData({ showAction: false, selectedMember: null }); },

  async onActionSelect(e) {
    const { name } = e.detail;
    const { selectedMember } = this.data;
    this.setData({ showAction: false });
    if (!selectedMember) return;

    try {
      if (name === 'setAdmin') {
        await memberService.updateRole(selectedMember._id, 'admin');
        wx.showToast({ title: '已设为管理员', icon: 'success' });
      } else if (name === 'setMember') {
        await memberService.updateRole(selectedMember._id, 'member');
        wx.showToast({ title: '已设为成员', icon: 'success' });
      } else if (name === 'toggleActive') {
        const res = await memberService.toggleActive(selectedMember._id);
        wx.showToast({ title: res.data.isActive ? '已启用' : '已禁用', icon: 'success' });
      }
      await this.loadList(true);
    } catch (err) {
      wx.showToast({ title: err.message || '操作失败', icon: 'none' });
    }
    this.setData({ selectedMember: null });
  },
});
