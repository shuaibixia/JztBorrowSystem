export const summary = {
  equipmentTotal: 48,
  available: 31,
  checkedOut: 12,
  maintenance: 3,
  overdue: 2,
  pendingApprovals: 4,
  pendingReservations: 3,
};

export const equipment = [
  { id: 'eq-001', name: '相机 1', category: 'camera', code: 'EQ-CAM-001', sn: 'CAM-A7M4-001', status: '可用', location: '器材柜 A-01', holder: '-', updatedAt: '今天 14:25' },
  { id: 'eq-002', name: '相机 2', category: 'camera', code: 'EQ-CAM-002', sn: 'CAM-R6-002', status: '借出中', location: '器材柜 A-02', holder: '成员甲', updatedAt: '今天 13:40' },
  { id: 'eq-003', name: '镜头 1', category: 'lens', code: 'EQ-LEN-001', sn: 'LEN-2470-001', status: '可用', location: '器材柜 B-04', holder: '-', updatedAt: '昨天 18:10' },
  { id: 'eq-004', name: '补光灯 1', category: 'lighting', code: 'EQ-LIT-001', sn: 'LIT-60X-001', status: '维修中', location: '维修架 M-01', holder: '-', updatedAt: '7 月 12 日' },
  { id: 'eq-005', name: '三脚架 1', category: 'tripod', code: 'EQ-TRI-001', sn: 'TRI-CF-001', status: '借出中', location: '器材柜 C-02', holder: '成员丙', updatedAt: '7 月 11 日' },
];

export const records = [
  { id: 'rec-001', equipment: '相机 2', member: '成员甲', status: '借出中', checkoutAt: '今天 13:40', expectedReturnAt: '今天 20:00', purpose: '社团活动拍摄' },
  { id: 'rec-002', equipment: '三脚架 1', member: '成员丙', status: '逾期', checkoutAt: '7 月 10 日 09:20', expectedReturnAt: '7 月 12 日 18:00', purpose: '人物专题' },
  { id: 'rec-003', equipment: '镜头 2', member: '成员丁', status: '已归还', checkoutAt: '7 月 8 日 14:00', expectedReturnAt: '7 月 8 日 20:00', purpose: '采访拍摄' },
];

export const approvals = [
  { id: 'app-001', equipment: '相机 1', member: '成员戊', purpose: '校运会拍摄', status: '待审批', createdAt: '今天 11:08', returnAt: '今天 19:00' },
  { id: 'app-002', equipment: '镜头 1', member: '成员己', purpose: '人物采访', status: '待审批', createdAt: '今天 09:36', returnAt: '明天 12:00' },
  { id: 'app-003', equipment: '录音笔 1', member: '成员丁', purpose: '播客录制', status: '已通过', createdAt: '昨天 18:20', returnAt: '今天 18:00' },
];

export const reservations = [
  { id: 'res-001', equipment: '相机 3', member: '成员甲', window: '今天 16:00 - 20:00', status: '待确认', purpose: '校园夜景拍摄' },
  { id: 'res-002', equipment: '镜头 3', member: '成员丙', window: '明天 09:00 - 12:00', status: '已确认', purpose: '毕业季人像' },
  { id: 'res-003', equipment: '三脚架 2', member: '成员戊', window: '7 月 18 日 14:00 - 18:00', status: '待确认', purpose: '活动直播' },
];

export const maintenance = [
  { id: 'm-001', equipment: '补光灯 1', type: '故障维修', person: '器材组', createdAt: '7 月 12 日 15:20', status: '处理中', description: '电源接口接触不稳定，需要更换接口。' },
  { id: 'm-002', equipment: '相机 3', type: '定期保养', person: '成员乙', createdAt: '7 月 8 日 10:15', status: '已完成', description: '完成传感器清洁与快门次数检查。' },
];

export const members = [
  { id: 'u-001', name: '成员甲', studentId: '202400000001', role: '成员', active: '启用', records: 1, updatedAt: '今天 13:40' },
  { id: 'u-002', name: '成员乙', studentId: '202400000002', role: '管理员', active: '启用', records: 0, updatedAt: '今天 10:25' },
  { id: 'u-003', name: '成员丙', studentId: '202400000003', role: '成员', active: '启用', records: 1, updatedAt: '7 月 10 日' },
  { id: 'u-004', name: '成员丁', studentId: '202400000004', role: '成员', active: '停用', records: 0, updatedAt: '6 月 29 日' },
];

export const students = [
  { id: 's-001', name: '成员甲', studentId: '202400000001', photo: '已录入', createdAt: '今天 13:40' },
  { id: 's-002', name: '成员戊', studentId: '202400000005', photo: '未上传', createdAt: '7 月 12 日' },
  { id: 's-003', name: '成员丙', studentId: '202400000003', photo: '已录入', createdAt: '7 月 10 日' },
];

export const notifications = [
  { id: 'n-001', title: '器材归还提醒', target: '成员丙', type: '逾期', createdAt: '今天 09:00', read: '未读' },
  { id: 'n-002', title: '预约申请已提交', target: '成员甲', type: '预约', createdAt: '今天 08:45', read: '已读' },
  { id: 'n-003', title: '借用申请已通过', target: '成员丁', type: '审批', createdAt: '昨天 18:35', read: '已读' },
];
