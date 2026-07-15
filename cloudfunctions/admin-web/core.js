const crypto = require('crypto');

const ADMIN_ROLES = ['admin', 'superadmin'];

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token || '')).digest('hex');
}

function readBearerToken(headers) {
  const values = headers || {};
  const authorization = values.authorization || values.Authorization || '';
  const match = String(authorization).match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : '';
}

function normalizePath(rawPath) {
  const value = String(rawPath || '/').split('?')[0];
  const apiIndex = value.indexOf('/v1/');
  if (apiIndex >= 0) return value.slice(apiIndex);
  return value || '/';
}

function safePage(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function safePageSize(value, fallback) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, 100);
}

function isActiveAdmin(user) {
  return !!user && user.isActive !== false && ADMIN_ROLES.includes(user.role);
}

function isSuperAdmin(user) {
  return !!user && user.isActive !== false && user.role === 'superadmin';
}

function isAllowedOrigin(origin, allowedOrigins) {
  if (!origin) return false;
  return (allowedOrigins || []).includes(origin);
}

module.exports = {
  hashToken,
  readBearerToken,
  normalizePath,
  safePage,
  safePageSize,
  isActiveAdmin,
  isSuperAdmin,
  isAllowedOrigin,
};
