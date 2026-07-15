async function getCurrentUser(db, openid) {
  const res = await db.collection('users').where({ _openid: openid }).get();
  return res.data[0] || null;
}

function isAdmin(user) {
  return !!user && ['admin', 'superadmin'].includes(user.role);
}

function isSuperAdmin(user) {
  return !!user && user.role === 'superadmin';
}

async function requireLogin(db, openid) {
  const user = await getCurrentUser(db, openid);
  if (!user) {
    return { error: { code: 401, message: '请先登录' } };
  }
  if (user.isActive === false) {
    return { error: { code: 403, message: '账号已停用' } };
  }
  return { user };
}

async function requireAdmin(db, openid) {
  const { user, error } = await requireLogin(db, openid);
  if (error) return { error };
  if (!isAdmin(user)) {
    return { error: { code: 403, message: '权限不足' } };
  }
  return { user };
}

async function requireSuperAdmin(db, openid) {
  const { user, error } = await requireLogin(db, openid);
  if (error) return { error };
  if (!isSuperAdmin(user)) {
    return { error: { code: 403, message: '仅超级管理员可操作' } };
  }
  return { user };
}

module.exports = {
  getCurrentUser,
  isAdmin,
  isSuperAdmin,
  requireLogin,
  requireAdmin,
  requireSuperAdmin,
};
