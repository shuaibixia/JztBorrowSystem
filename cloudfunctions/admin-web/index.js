const cloud = require('wx-server-sdk');
const {
  hashToken,
  readBearerToken,
  normalizePath,
  safePage,
  safePageSize,
  isActiveAdmin,
  isSuperAdmin,
  isAllowedOrigin,
} = require('./core');
const {
  VALID_EQUIPMENT_CATEGORIES,
  createEquipmentWithQrCode,
  validateEquipmentUniqueUpdate,
  retireEquipment,
  getEquipmentWriteErrorMessage,
} = require('./_shared/equipment-admin');
const {
  checkoutForMember,
  returnRecord,
  approveApproval,
  rejectApproval,
  confirmReservation,
  cancelReservation,
  addMaintenanceLog,
} = require('./_shared/admin-web-operations');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event) => {
  const request = normalizeRequest(event);
  const cors = getCorsHeaders(request.headers);

  if (request.method === 'OPTIONS') {
    return response(204, null, cors);
  }

  if (request.method === 'GET' && request.path === '/v1/health') {
    return response(200, { code: 0, data: { service: 'admin-web', auth: 'oauth-pending' } }, cors);
  }

  const auth = await requireAdminSession(request.headers);
  if (auth.error) return response(auth.error.code, { code: auth.error.code, message: auth.error.message }, cors);

  try {
    if (request.method === 'GET' && request.path === '/v1/session') {
      return response(200, { code: 0, data: publicUser(auth.user) }, cors);
    }
    if (request.method === 'GET' && request.path === '/v1/dashboard') {
      return response(200, { code: 0, data: await getDashboard() }, cors);
    }
    if (request.method === 'GET' && request.path === '/v1/equipment') {
      return response(200, { code: 0, data: await listEquipment(request.query) }, cors);
    }
    if (request.method === 'GET' && request.path.startsWith('/v1/equipment/')) {
      return response(200, { code: 0, data: await getEquipment(request.path.slice('/v1/equipment/'.length)) }, cors);
    }
    if (request.method === 'GET' && request.path === '/v1/records') {
      return response(200, { code: 0, data: await listRecords(request.query) }, cors);
    }
    if (request.method === 'POST' && request.path === '/v1/equipment') {
      return response(200, { code: 0, data: await createEquipment(request.body, auth) }, cors);
    }
    if (request.method === 'PATCH' && request.path.startsWith('/v1/equipment/')) {
      return response(200, { code: 0, data: await updateEquipment(request.path.slice('/v1/equipment/'.length), request.body, auth) }, cors);
    }
    if (request.method === 'POST' && request.path.startsWith('/v1/equipment/') && request.path.endsWith('/retire')) {
      return response(200, { code: 0, data: await retireEquipmentById(request.path.slice('/v1/equipment/'.length, -'/retire'.length), auth) }, cors);
    }
    if (request.method === 'POST' && request.path === '/v1/equipment/batch-import') {
      return response(200, { code: 0, data: await importEquipment(request.body, auth) }, cors);
    }
    if (request.method === 'POST' && request.path.startsWith('/v1/equipment/') && request.path.endsWith('/image')) {
      return response(200, { code: 0, data: await uploadEquipmentImage(request.path.slice('/v1/equipment/'.length, -'/image'.length), request.body, auth) }, cors);
    }
    if (request.method === 'GET' && request.path === '/v1/members') {
      return response(200, { code: 0, data: await listMembers(request.query) }, cors);
    }
    if (request.method === 'GET' && request.path === '/v1/students') {
      return response(200, { code: 0, data: await listStudents(request.query) }, cors);
    }
    if (request.method === 'POST' && request.path === '/v1/students') {
      return response(200, { code: 0, data: await createStudent(request.body, auth) }, cors);
    }
    if (request.method === 'POST' && request.path === '/v1/students/batch-import') {
      return response(200, { code: 0, data: await importStudents(request.body, auth) }, cors);
    }
    if (request.method === 'PATCH' && request.path.startsWith('/v1/members/') && request.path.endsWith('/role')) {
      return response(200, { code: 0, data: await updateMemberRole(request.path.slice('/v1/members/'.length, -'/role'.length), request.body, auth) }, cors);
    }
    if (request.method === 'POST' && request.path.startsWith('/v1/members/') && request.path.endsWith('/toggle-active')) {
      return response(200, { code: 0, data: await toggleMemberActive(request.path.slice('/v1/members/'.length, -'/toggle-active'.length), auth) }, cors);
    }
    if (request.method === 'GET' && request.path === '/v1/approvals') {
      return response(200, { code: 0, data: await listApprovals(request.query) }, cors);
    }
    if (request.method === 'POST' && request.path.startsWith('/v1/approvals/') && request.path.endsWith('/approve')) {
      return response(200, { code: 0, data: await approveApprovalById(request.path.slice('/v1/approvals/'.length, -'/approve'.length), request.body, auth) }, cors);
    }
    if (request.method === 'POST' && request.path.startsWith('/v1/approvals/') && request.path.endsWith('/reject')) {
      return response(200, { code: 0, data: await rejectApprovalById(request.path.slice('/v1/approvals/'.length, -'/reject'.length), request.body, auth) }, cors);
    }
    if (request.method === 'GET' && request.path === '/v1/reservations') {
      return response(200, { code: 0, data: await listReservations(request.query) }, cors);
    }
    if (request.method === 'POST' && request.path.startsWith('/v1/reservations/') && request.path.endsWith('/confirm')) {
      return response(200, { code: 0, data: await confirmReservationById(request.path.slice('/v1/reservations/'.length, -'/confirm'.length), auth) }, cors);
    }
    if (request.method === 'POST' && request.path.startsWith('/v1/reservations/') && request.path.endsWith('/cancel')) {
      return response(200, { code: 0, data: await cancelReservationById(request.path.slice('/v1/reservations/'.length, -'/cancel'.length), auth) }, cors);
    }
    if (request.method === 'GET' && request.path === '/v1/maintenance') {
      return response(200, { code: 0, data: await listMaintenance(request.query) }, cors);
    }
    if (request.method === 'POST' && request.path === '/v1/maintenance') {
      return response(200, { code: 0, data: await createMaintenance(request.body, auth) }, cors);
    }
    if (request.method === 'POST' && request.path === '/v1/records/checkout') {
      return response(200, { code: 0, data: await checkoutRecord(request.body, auth) }, cors);
    }
    if (request.method === 'POST' && request.path.startsWith('/v1/records/') && request.path.endsWith('/return')) {
      return response(200, { code: 0, data: await returnRecordById(request.path.slice('/v1/records/'.length, -'/return'.length), request.body, auth) }, cors);
    }
    if (request.method === 'GET' && request.path === '/v1/notifications') {
      return response(200, { code: 0, data: await listNotifications(request.query) }, cors);
    }
    if (request.method === 'GET' && request.path === '/v1/audit-logs') {
      return response(200, { code: 0, data: await listAuditLogs(request.query, auth) }, cors);
    }
    if (request.method === 'GET' && request.path === '/v1/system/diagnostics') {
      return response(200, { code: 0, data: await getSystemDiagnostics(auth) }, cors);
    }
    return response(404, { code: 404, message: '未找到接口' }, cors);
  } catch (err) {
    if (err && err.code) return response(err.code, { code: err.code, message: err.message }, cors);
    console.error('admin-web request failed:', err);
    return response(500, { code: 500, message: '后台服务暂时不可用' }, cors);
  }
};

function normalizeRequest(event) {
  const rawPath = event.path || event.rawPath || event.requestContext && event.requestContext.path || '/';
  const query = { ...(event.queryStringParameters || event.query || {}) };
  const headers = event.headers || {};
  const method = String(event.httpMethod || event.requestContext && event.requestContext.http && event.requestContext.http.method || 'GET').toUpperCase();
  return { method, path: normalizePath(rawPath), query, headers, body: parseJsonBody(event) };
}

function getCorsHeaders(headers) {
  const rawOrigins = String(process.env.WEB_ADMIN_ALLOWED_ORIGINS || '');
  const allowedOrigins = rawOrigins.split(',').map((item) => item.trim()).filter(Boolean);
  const origin = headers.origin || headers.Origin || '';
  const base = {
    'Content-Type': 'application/json; charset=utf-8',
    'Vary': 'Origin',
  };
  if (!isAllowedOrigin(origin, allowedOrigins)) return base;
  return {
    ...base,
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
  };
}

function response(statusCode, body, headers) {
  return {
    statusCode,
    headers,
    body: body === null ? '' : JSON.stringify(body),
  };
}

async function requireAdminSession(headers) {
  const token = readBearerToken(headers);
  if (!token) return { error: { code: 401, message: '缺少网站会话' } };

  const now = new Date();
  const sessionRes = await db.collection('webAdminSessions').where({
    tokenHash: hashToken(token),
    expiresAt: _.gt(now),
  }).limit(1).get();
  const session = sessionRes.data[0];
  if (!session) return { error: { code: 401, message: '网站会话无效或已过期' } };

  const [bindingRes, userRes] = await Promise.all([
    db.collection('webAdminBindings').doc(session.bindingId).get(),
    db.collection('users').doc(session.userId).get(),
  ]);
  const binding = bindingRes.data;
  const user = userRes.data;
  if (!binding || binding.isActive === false || !user || binding.userId !== user._id || !isActiveAdmin(user)) {
    return { error: { code: 403, message: '管理员权限已失效' } };
  }
  return { session, binding, user };
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.nickName || user.studentName || '',
    role: user.role,
  };
}

async function getDashboard() {
  const now = new Date();
  const [
    totalEquipment,
    availableEquipment,
    checkedOutEquipment,
    maintenanceEquipment,
    activeRecords,
    overdueRecords,
    pendingApprovals,
    pendingReservations,
    attentionRecords,
    attentionApprovals,
    attentionReservations,
  ] = await Promise.all([
    db.collection('equipment').count(),
    db.collection('equipment').where({ status: 'available' }).count(),
    db.collection('equipment').where({ status: 'checked_out' }).count(),
    db.collection('equipment').where({ status: 'maintenance' }).count(),
    db.collection('records').where({ status: 'active' }).count(),
    db.collection('records').where({ status: 'active', expectedReturnAt: _.lt(now) }).count(),
    db.collection('approvals').where({ status: 'pending' }).count(),
    db.collection('reservations').where({ status: 'pending' }).count(),
    db.collection('records').where({ status: 'active' }).orderBy('checkoutAt', 'desc').limit(8).get(),
    db.collection('approvals').where({ status: 'pending' }).orderBy('createdAt', 'asc').limit(8).get(),
    db.collection('reservations').where({ status: 'pending' }).orderBy('createdAt', 'asc').limit(8).get(),
  ]);

  return {
    summary: {
      equipmentTotal: totalEquipment.total,
      available: availableEquipment.total,
      checkedOut: checkedOutEquipment.total,
      maintenance: maintenanceEquipment.total,
      activeRecords: activeRecords.total,
      overdue: overdueRecords.total,
      pendingApprovals: pendingApprovals.total,
      pendingReservations: pendingReservations.total,
    },
    attention: {
      activeRecords: attentionRecords.data,
      pendingApprovals: attentionApprovals.data,
      pendingReservations: attentionReservations.data,
    },
  };
}

async function listEquipment(query) {
  const page = safePage(query.page, 1);
  const pageSize = safePageSize(query.pageSize, 20);
  const where = {};
  if (query.status) where.status = query.status;
  if (query.category) where.category = query.category;
  if (query.keyword) where.name = db.RegExp({ regexp: query.keyword, options: 'i' });
  const [countRes, listRes] = await Promise.all([
    db.collection('equipment').where(where).count(),
    db.collection('equipment').where(where).orderBy('createdAt', 'desc').skip((page - 1) * pageSize).limit(pageSize).get(),
  ]);
  return { list: listRes.data, total: countRes.total, page, pageSize };
}

async function getEquipment(id) {
  if (!id) throw { code: 400, message: '缺少器材编号' };
  try {
    const result = await db.collection('equipment').doc(id).get();
    if (!result.data) throw { code: 404, message: '器材不存在' };
    return result.data;
  } catch (err) {
    if (err && err.code) throw err;
    throw { code: 404, message: '器材不存在' };
  }
}

async function listRecords(query) {
  const page = safePage(query.page, 1);
  const pageSize = safePageSize(query.pageSize, 20);
  const where = {};
  if (query.status) where.status = query.status;
  if (query.keyword) where.equipmentName = db.RegExp({ regexp: query.keyword, options: 'i' });
  const [countRes, listRes] = await Promise.all([
    db.collection('records').where(where).count(),
    db.collection('records').where(where).orderBy('createdAt', 'desc').skip((page - 1) * pageSize).limit(pageSize).get(),
  ]);
  return { list: listRes.data, total: countRes.total, page, pageSize };
}

function parseJsonBody(event) {
  if (!event.body) return {};
  try {
    const raw = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (err) {
    return {};
  }
}

async function createEquipment(input, auth) {
  if (!String(input.name || '').trim()) throw { code: 400, message: '器材名称不能为空' };
  if (!VALID_EQUIPMENT_CATEGORIES.includes(input.category)) throw { code: 400, message: '器材类型无效' };
  try {
    const result = await createEquipmentWithQrCode(db, input);
    await writeAudit(auth.user, 'equipment.create', 'equipment', result._id, { qrCode: result.qrCode, name: input.name });
    return result;
  } catch (err) {
    throw { code: err.code || 400, message: getEquipmentWriteErrorMessage(err) };
  }
}

async function updateEquipment(id, input, auth) {
  if (!id) throw { code: 400, message: '缺少器材编号' };
  const allowedFields = ['name', 'category', 'brand', 'model', 'serialNumber', 'description', 'location', 'condition', 'purchaseDate', 'tags', 'imageUrl'];
  const updateFields = {};
  for (const key of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(input, key)) updateFields[key] = input[key];
  }
  if (Object.keys(updateFields).length === 0) throw { code: 400, message: '没有可更新字段' };
  if (updateFields.category && !VALID_EQUIPMENT_CATEGORIES.includes(updateFields.category)) throw { code: 400, message: '器材类型无效' };
  const uniqueError = await validateEquipmentUniqueUpdate(db, id, updateFields);
  if (uniqueError) throw uniqueError;
  updateFields.updatedAt = new Date();
  await db.collection('equipment').doc(id).update({ data: updateFields });
  await writeAudit(auth.user, 'equipment.update', 'equipment', id, { fields: Object.keys(updateFields).filter((key) => key !== 'updatedAt') });
  return { id };
}

async function retireEquipmentById(id, auth) {
  const result = await retireEquipment(db, id);
  if (result.code !== 0) throw result;
  await writeAudit(auth.user, 'equipment.retire', 'equipment', id, {});
  return { id, status: 'retired' };
}

async function importEquipment(input, auth) {
  const list = Array.isArray(input.list) ? input.list : [];
  if (list.length === 0) throw { code: 400, message: '导入数据不能为空' };
  const seenSerialNumbers = new Set();
  const errors = [];
  let success = 0;
  for (let index = 0; index < list.length; index++) {
    const item = list[index] || {};
    const serialNumber = String(item.serialNumber || '').trim();
    if (!VALID_EQUIPMENT_CATEGORIES.includes(item.category) || !String(item.model || '').trim() || !serialNumber) {
      errors.push(`第${index + 1}条：类型、型号和SN码不能为空`);
      continue;
    }
    if (seenSerialNumbers.has(serialNumber)) {
      errors.push(`第${index + 1}条：SN码在本次导入中重复`);
      continue;
    }
    seenSerialNumbers.add(serialNumber);
    try {
      await createEquipmentWithQrCode(db, { ...item, name: item.name || item.model, serialNumber, now: new Date() });
      success++;
    } catch (err) {
      errors.push(`第${index + 1}条：${getEquipmentWriteErrorMessage(err)}`);
    }
  }
  await writeAudit(auth.user, 'equipment.batchImport', 'equipment', '', { success, failed: errors.length });
  return { success, failed: errors.length, errors: errors.slice(0, 20) };
}

async function uploadEquipmentImage(id, input, auth) {
  const match = String(input.dataUrl || '').match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) throw { code: 400, message: '图片格式无效' };
  const content = Buffer.from(match[2], 'base64');
  if (content.length === 0 || content.length > 1500 * 1024) throw { code: 400, message: '图片需小于 1.5 MB' };
  const extension = match[1] === 'jpeg' ? 'jpg' : match[1];
  const upload = await cloud.uploadFile({ cloudPath: `web-admin/equipment/${id}-${Date.now()}.${extension}`, fileContent: content });
  await db.collection('equipment').doc(id).update({ data: { imageUrl: upload.fileID, updatedAt: new Date() } });
  await writeAudit(auth.user, 'equipment.uploadImage', 'equipment', id, { fileID: upload.fileID });
  return { fileID: upload.fileID };
}

async function listMembers(query) {
  const page = safePage(query.page, 1);
  const pageSize = safePageSize(query.pageSize, 20);
  const where = {};
  if (query.role) where.role = query.role;
  if (query.keyword) where.studentName = db.RegExp({ regexp: query.keyword, options: 'i' });
  const [countRes, listRes] = await Promise.all([
    db.collection('users').where(where).count(),
    db.collection('users').where(where).orderBy('createdAt', 'desc').skip((page - 1) * pageSize).limit(pageSize).field({ _openid: false }).get(),
  ]);
  return { list: listRes.data, total: countRes.total, page, pageSize };
}

async function listStudents(query) {
  const page = safePage(query.page, 1);
  const pageSize = safePageSize(query.pageSize, 20);
  const where = query.keyword ? { name: db.RegExp({ regexp: query.keyword, options: 'i' }) } : {};
  const [countRes, listRes] = await Promise.all([
    db.collection('students').where(where).count(),
    db.collection('students').where(where).orderBy('createdAt', 'desc').skip((page - 1) * pageSize).limit(pageSize).get(),
  ]);
  return { list: listRes.data, total: countRes.total, page, pageSize };
}

async function createStudent(input, auth) {
  const studentId = String(input.studentId || '').trim();
  const name = String(input.name || '').trim();
  if (!/^\d{12}$/.test(studentId)) throw { code: 400, message: '学号须为12位数字' };
  if (!name) throw { code: 400, message: '姓名不能为空' };
  const existing = await db.collection('students').where({ studentId }).limit(1).get();
  if (existing.data.length > 0) throw { code: 409, message: '该学号已存在' };
  const result = await db.collection('students').add({ data: { studentId, name, photo: input.photo || '', createdAt: new Date() } });
  await writeAudit(auth.user, 'student.create', 'student', result._id, { studentId });
  return { _id: result._id };
}

async function importStudents(input, auth) {
  const list = Array.isArray(input.list) ? input.list : [];
  if (list.length === 0) throw { code: 400, message: '导入数据不能为空' };
  const errors = [];
  let success = 0;
  for (let index = 0; index < list.length; index++) {
    try {
      await createStudent(list[index], auth);
      success++;
    } catch (err) {
      errors.push(`第${index + 1}条：${err.message || '导入失败'}`);
    }
  }
  await writeAudit(auth.user, 'student.batchImport', 'student', '', { success, failed: errors.length });
  return { success, failed: errors.length, errors: errors.slice(0, 20) };
}

async function updateMemberRole(id, input, auth) {
  if (!isSuperAdmin(auth.user)) throw { code: 403, message: '仅超级管理员可修改角色' };
  const role = String(input.role || '');
  if (!['member', 'admin', 'superadmin'].includes(role)) throw { code: 400, message: '无效角色' };
  await db.collection('users').doc(id).update({ data: { role, updatedAt: new Date() } });
  await writeAudit(auth.user, 'member.updateRole', 'user', id, { role });
  return { id, role };
}

async function toggleMemberActive(id, auth) {
  const result = await db.collection('users').doc(id).get();
  if (!result.data) throw { code: 404, message: '成员不存在' };
  const isActive = result.data.isActive === false;
  await db.collection('users').doc(id).update({ data: { isActive, updatedAt: new Date() } });
  await writeAudit(auth.user, 'member.toggleActive', 'user', id, { isActive });
  return { id, isActive };
}

async function writeAudit(user, action, targetType, targetId, summary) {
  try {
    await db.collection('webAdminAuditLogs').add({
      data: {
        actorUserId: user._id,
        actorName: user.nickName || user.studentName || '',
        action,
        targetType,
        targetId,
        summary: summary || {},
        createdAt: new Date(),
      },
    });
  } catch (err) {
    console.error('admin-web audit write failed:', err);
  }
}

async function listApprovals(query) {
  const page = safePage(query.page, 1);
  const pageSize = safePageSize(query.pageSize, 20);
  const where = {};
  if (query.status) where.status = query.status;
  if (query.keyword) where.equipmentName = db.RegExp({ regexp: query.keyword, options: 'i' });
  const [countRes, listRes] = await Promise.all([
    db.collection('approvals').where(where).count(),
    db.collection('approvals').where(where).orderBy('createdAt', 'desc').skip((page - 1) * pageSize).limit(pageSize).get(),
  ]);
  return { list: listRes.data, total: countRes.total, page, pageSize };
}

async function approveApprovalById(approvalId, input, auth) {
  const result = await approveApproval(db, { actor: auth.user, approvalId, remark: input.remark });
  await writeAudit(auth.user, 'approval.approve', 'approval', approvalId, {});
  return result;
}

async function rejectApprovalById(approvalId, input, auth) {
  const result = await rejectApproval(db, { actor: auth.user, approvalId, rejectReason: input.rejectReason });
  await writeAudit(auth.user, 'approval.reject', 'approval', approvalId, { rejectReason: input.rejectReason || '' });
  return result;
}

async function listReservations(query) {
  const page = safePage(query.page, 1);
  const pageSize = safePageSize(query.pageSize, 20);
  const where = {};
  if (query.status) where.status = query.status;
  if (query.keyword) where.equipmentName = db.RegExp({ regexp: query.keyword, options: 'i' });
  const [countRes, listRes] = await Promise.all([
    db.collection('reservations').where(where).count(),
    db.collection('reservations').where(where).orderBy('createdAt', 'desc').skip((page - 1) * pageSize).limit(pageSize).get(),
  ]);
  return { list: listRes.data, total: countRes.total, page, pageSize };
}

async function confirmReservationById(reservationId, auth) {
  const result = await confirmReservation(db, { reservationId });
  await writeAudit(auth.user, 'reservation.confirm', 'reservation', reservationId, {});
  return result;
}

async function cancelReservationById(reservationId, auth) {
  const result = await cancelReservation(db, { reservationId });
  await writeAudit(auth.user, 'reservation.cancel', 'reservation', reservationId, {});
  return result;
}

async function listMaintenance(query) {
  const page = safePage(query.page, 1);
  const pageSize = safePageSize(query.pageSize, 20);
  const where = query.equipmentId ? { equipmentId: query.equipmentId } : {};
  const [countRes, listRes] = await Promise.all([
    db.collection('maintenanceLogs').where(where).count(),
    db.collection('maintenanceLogs').where(where).orderBy('createdAt', 'desc').skip((page - 1) * pageSize).limit(pageSize).get(),
  ]);
  return { list: listRes.data, total: countRes.total, page, pageSize };
}

async function createMaintenance(input, auth) {
  const result = await addMaintenanceLog(db, { actor: auth.user, ...input });
  await writeAudit(auth.user, 'maintenance.add', 'maintenanceLog', result._id, { equipmentId: input.equipmentId });
  return result;
}

async function checkoutRecord(input, auth) {
  const memberId = String(input.memberId || '');
  const member = memberId ? (await db.collection('users').doc(memberId).get()).data : null;
  const result = await checkoutForMember(db, { actor: auth.user, member, equipmentId: input.equipmentId, purpose: input.purpose, expectedReturnAt: input.expectedReturnAt });
  await writeAudit(auth.user, 'record.checkoutForMember', 'record', result.recordId, { equipmentId: input.equipmentId, memberId });
  return result;
}

async function returnRecordById(recordId, input, auth) {
  const result = await returnRecord(db, { actor: auth.user, recordId, conditionAfter: input.conditionAfter, remark: input.remark });
  await writeAudit(auth.user, 'record.return', 'record', recordId, { completedReservationId: result.completedReservationId });
  return result;
}

async function listNotifications(query) {
  const page = safePage(query.page, 1);
  const pageSize = safePageSize(query.pageSize, 20);
  const where = {};
  if (query.type) where.type = query.type;
  if (query.isRead === 'true') where.isRead = true;
  if (query.isRead === 'false') where.isRead = false;
  const [countRes, listRes] = await Promise.all([
    db.collection('notifications').where(where).count(),
    db.collection('notifications').where(where).orderBy('createdAt', 'desc').skip((page - 1) * pageSize).limit(pageSize).field({ userOpenId: false }).get(),
  ]);
  return { list: listRes.data, total: countRes.total, page, pageSize };
}

async function listAuditLogs(query, auth) {
  requireSuperAdmin(auth.user);
  const page = safePage(query.page, 1);
  const pageSize = safePageSize(query.pageSize, 20);
  const where = query.action ? { action: query.action } : {};
  try {
    const [countRes, listRes] = await Promise.all([
      db.collection('webAdminAuditLogs').where(where).count(),
      db.collection('webAdminAuditLogs').where(where).orderBy('createdAt', 'desc').skip((page - 1) * pageSize).limit(pageSize).get(),
    ]);
    return { list: listRes.data, total: countRes.total, page, pageSize };
  } catch (err) {
    return { list: [], total: 0, page, pageSize, unavailable: true };
  }
}

async function getSystemDiagnostics(auth) {
  requireSuperAdmin(auth.user);
  const collections = ['users', 'students', 'equipment', 'records', 'approvals', 'reservations', 'maintenanceLogs', 'notifications', 'counters', 'webAdminBindings', 'webAdminSessions', 'webAdminAuthStates', 'webAdminAuditLogs'];
  const checks = await Promise.all(collections.map(async (name) => {
    try {
      const result = await db.collection(name).count();
      return { name, status: 'ready', count: result.total };
    } catch (err) {
      return { name, status: 'unavailable', count: null };
    }
  }));
  return {
    runtime: 'CloudBase HTTP function',
    sessionPolicy: 'opaque bearer token, 8h maximum lifetime after OAuth rollout',
    collections: checks,
    pendingSetup: checks.filter((item) => item.status !== 'ready').map((item) => item.name),
  };
}

function requireSuperAdmin(user) {
  if (!isSuperAdmin(user)) throw { code: 403, message: '仅超级管理员可查看系统信息' };
}
