// 器材分类
const CATEGORIES = [
  { value: 'camera', label: '相机', prefix: 'CAM' },
  { value: 'lens', label: '镜头', prefix: 'LEN' },
  { value: 'tripod', label: '三脚架', prefix: 'TRI' },
  { value: 'lighting', label: '灯光', prefix: 'LIT' },
  { value: 'audio', label: '音频', prefix: 'AUD' },
  { value: 'accessory', label: '配件', prefix: 'ACC' },
];

// 器材状态
const EQUIPMENT_STATUS = [
  { value: 'available', label: '可用', color: 'green' },
  { value: 'checked_out', label: '已借出', color: 'orange' },
  { value: 'maintenance', label: '维修中', color: 'grey' },
  { value: 'retired', label: '已退役', color: 'grey' },
];

// 器材状况
const CONDITIONS = [
  { value: 'excellent', label: '优秀' },
  { value: 'good', label: '良好' },
  { value: 'fair', label: '一般' },
  { value: 'poor', label: '较差' },
];

// 用户角色
const ROLES = [
  { value: 'member', label: '成员' },
  { value: 'admin', label: '管理员' },
  { value: 'superadmin', label: '超级管理员' },
];

// 记录状态
const RECORD_STATUS = [
  { value: 'active', label: '借出中', color: 'orange' },
  { value: 'returned', label: '已归还', color: 'green' },
  { value: 'overdue', label: '已逾期', color: 'red' },
];

// 审批状态
const APPROVAL_STATUS = [
  { value: 'pending', label: '待审批', color: 'orange' },
  { value: 'approved', label: '已通过', color: 'green' },
  { value: 'rejected', label: '已拒绝', color: 'red' },
];

// 预约状态
const RESERVATION_STATUS = [
  { value: 'pending', label: '待确认', color: 'orange' },
  { value: 'confirmed', label: '已确认', color: 'green' },
  { value: 'cancelled', label: '已取消', color: 'grey' },
  { value: 'expired', label: '已过期', color: 'grey' },
  { value: 'completed', label: '已完成', color: 'blue' },
];

// 维保类型
const MAINTENANCE_TYPES = [
  { value: 'repair', label: '维修' },
  { value: 'cleaning', label: '清洁' },
  { value: 'calibration', label: '校准' },
  { value: 'upgrade', label: '升级' },
  { value: 'inspection', label: '检查' },
];

// 分页默认值
const PAGE_SIZE = 20;

module.exports = {
  CATEGORIES,
  EQUIPMENT_STATUS,
  CONDITIONS,
  ROLES,
  RECORD_STATUS,
  APPROVAL_STATUS,
  RESERVATION_STATUS,
  MAINTENANCE_TYPES,
  PAGE_SIZE,
};
