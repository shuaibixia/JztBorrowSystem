const { EQUIPMENT_STATUS, CATEGORIES, CONDITIONS, RECORD_STATUS, APPROVAL_STATUS, RESERVATION_STATUS, MAINTENANCE_TYPES } = require('./constants');

function formatDate(date, format = 'YYYY-MM-DD HH:mm') {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hour)
    .replace('mm', minute);
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 6) return '夜深了';
  if (h < 11) return '早上好';
  if (h < 14) return '中午好';
  if (h < 18) return '下午好';
  return '晚上好';
}

function getStatusInfo(status) {
  return EQUIPMENT_STATUS.find((s) => s.value === status) || { label: '未知', color: 'grey' };
}

function getCategoryInfo(category) {
  return CATEGORIES.find((c) => c.value === category) || { label: '未知', prefix: 'UNK' };
}

function getConditionInfo(condition) {
  return CONDITIONS.find((c) => c.value === condition) || { label: '未知' };
}

function getRecordStatusInfo(status) {
  return RECORD_STATUS.find((s) => s.value === status) || { label: '未知', color: 'grey' };
}

function getApprovalInfo(status) {
  return APPROVAL_STATUS.find((s) => s.value === status) || { label: '未知', color: 'grey' };
}

function getReservationInfo(status) {
  return RESERVATION_STATUS.find((s) => s.value === status) || { label: '未知', color: 'grey' };
}

function getMaintenanceTypeInfo(type) {
  return MAINTENANCE_TYPES.find((t) => t.value === type) || { label: '未知' };
}

function formatRelativeTime(date) {
  if (!date) return '';
  const now = Date.now();
  const d = new Date(date).getTime();
  const diff = now - d;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < 0) return formatDate(date, 'MM-DD HH:mm');
  if (diff < minute) return '刚刚';
  if (diff < hour) return `${Math.floor(diff / minute)}分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)}小时前`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}天前`;
  return formatDate(date, 'MM-DD HH:mm');
}

function isAdmin(user) {
  return user && ['admin', 'superadmin'].includes(user.role);
}

function daysUntil(date) {
  if (!date) return null;
  const now = new Date();
  const target = new Date(date);
  return Math.ceil((target - now) / (24 * 60 * 60 * 1000));
}

module.exports = {
  formatDate,
  getGreeting,
  getStatusInfo,
  getCategoryInfo,
  getConditionInfo,
  getRecordStatusInfo,
  getApprovalInfo,
  getReservationInfo,
  getMaintenanceTypeInfo,
  formatRelativeTime,
  isAdmin,
  daysUntil,
};
