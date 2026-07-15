const API_BASE = String(import.meta.env.VITE_ADMIN_API_BASE || '').replace(/\/$/, '');

export function hasAdminApi() {
  return Boolean(API_BASE);
}

export function getSessionToken() {
  return window.sessionStorage.getItem('studentpress-admin-session') || '';
}

export function setSessionToken(token) {
  if (!token) window.sessionStorage.removeItem('studentpress-admin-session');
  else window.sessionStorage.setItem('studentpress-admin-session', token);
}

export async function adminGet(path, params = {}) {
  return adminRequest('GET', path, undefined, params);
}

export async function adminRequest(method, path, body, params = {}) {
  if (!API_BASE) throw new Error('后台 API 尚未配置');
  const url = new URL(`${API_BASE}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  });
  const token = getSessionToken();
  const response = await fetch(url.toString(), {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.code !== 0) throw new Error(payload.message || '后台请求失败');
  return payload.data;
}

export const adminApi = {
  getSession: () => adminGet('/v1/session'),
  getDashboard: () => adminGet('/v1/dashboard'),
  listEquipment: (params) => adminGet('/v1/equipment', params),
  getEquipment: (id) => adminGet(`/v1/equipment/${encodeURIComponent(id)}`),
  listRecords: (params) => adminGet('/v1/records', params),
  createEquipment: (input) => adminRequest('POST', '/v1/equipment', input),
  updateEquipment: (id, input) => adminRequest('PATCH', `/v1/equipment/${encodeURIComponent(id)}`, input),
  retireEquipment: (id) => adminRequest('POST', `/v1/equipment/${encodeURIComponent(id)}/retire`, {}),
  importEquipment: (list) => adminRequest('POST', '/v1/equipment/batch-import', { list }),
  uploadEquipmentImage: (id, dataUrl) => adminRequest('POST', `/v1/equipment/${encodeURIComponent(id)}/image`, { dataUrl }),
  listMembers: (params) => adminGet('/v1/members', params),
  listStudents: (params) => adminGet('/v1/students', params),
  createStudent: (input) => adminRequest('POST', '/v1/students', input),
  importStudents: (list) => adminRequest('POST', '/v1/students/batch-import', { list }),
  updateMemberRole: (id, role) => adminRequest('PATCH', `/v1/members/${encodeURIComponent(id)}/role`, { role }),
  toggleMemberActive: (id) => adminRequest('POST', `/v1/members/${encodeURIComponent(id)}/toggle-active`, {}),
  listApprovals: (params) => adminGet('/v1/approvals', params),
  approveApproval: (id, remark) => adminRequest('POST', `/v1/approvals/${encodeURIComponent(id)}/approve`, { remark }),
  rejectApproval: (id, rejectReason) => adminRequest('POST', `/v1/approvals/${encodeURIComponent(id)}/reject`, { rejectReason }),
  listReservations: (params) => adminGet('/v1/reservations', params),
  confirmReservation: (id) => adminRequest('POST', `/v1/reservations/${encodeURIComponent(id)}/confirm`, {}),
  cancelReservation: (id) => adminRequest('POST', `/v1/reservations/${encodeURIComponent(id)}/cancel`, {}),
  listMaintenance: (params) => adminGet('/v1/maintenance', params),
  createMaintenance: (input) => adminRequest('POST', '/v1/maintenance', input),
  checkoutForMember: (input) => adminRequest('POST', '/v1/records/checkout', input),
  returnRecord: (id, input) => adminRequest('POST', `/v1/records/${encodeURIComponent(id)}/return`, input),
  listNotifications: (params) => adminGet('/v1/notifications', params),
  listAuditLogs: (params) => adminGet('/v1/audit-logs', params),
  getSystemDiagnostics: () => adminGet('/v1/system/diagnostics'),
};
