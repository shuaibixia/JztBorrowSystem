const cloud = require('wx-server-sdk');
const { initCloud, SETUP_CODE } = require('./_shared/config');
initCloud(cloud);
const db = cloud.database();

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { action } = event;

  switch (action) {
    case 'bindStudentId':
      return handleBindStudentId(OPENID, event);
    case 'getProfile':
      return handleGetProfile(OPENID);
    case 'updateProfile':
      return handleUpdateProfile(OPENID, event);
    case 'getStats':
      return handleGetStats(OPENID);
    case 'listMembers':
      return handleListMembers(OPENID, event);
    case 'updateRole':
      return handleUpdateRole(OPENID, event);
    case 'toggleActive':
      return handleToggleActive(OPENID, event);
    case 'addStudent':
      return handleAddStudent(OPENID, event);
    case 'batchImportStudents':
      return handleBatchImportStudents(OPENID, event);
    case 'listStudents':
      return handleListStudents(OPENID, event);
    case 'firstSetup':
      return handleFirstSetup(OPENID, event);
    default:
      return { code: 400, message: '未知操作' };
  }
};

async function handleBindStudentId(OPENID, { studentId }) {
  const now = new Date();
  try {
    // 校验学号格式
    if (!/^\d{12}$/.test(studentId)) {
      return { code: 400, message: '学号格式错误，须为12位数字' };
    }

    // 查询 students 集合
    let studentRes;
    try {
      studentRes = await db.collection('students').where({ studentId }).get();
    } catch (e) {
      return { code: 404, message: '学号未录入，请联系管理员' };
    }
    if (studentRes.data.length === 0) {
      return { code: 404, message: '学号未录入，请联系管理员' };
    }
    const student = studentRes.data[0];

    // 查 users 表是否已有记录
    const existing = await db.collection('users').where({ _openid: OPENID }).get();

    const userData = {
      studentId: student.studentId,
      studentName: student.name,
      studentPhoto: student.photo || '',
      updatedAt: now,
    };

    if (existing.data.length > 0) {
      // 已有用户记录 → 更新绑定信息
      await db.collection('users').doc(existing.data[0]._id).update({ data: userData });
      const updated = await db.collection('users').doc(existing.data[0]._id).get();
      return { code: 0, data: updated.data };
    }

    // 新用户 → 检查是否为第一个用户（自动成为超级管理员）
    const allUsers = await db.collection('users').count();
    const role = allUsers.total === 0 ? 'superadmin' : 'member';

    const res = await db.collection('users').add({
      data: {
        _openid: OPENID,
        ...userData,
        role,
        department: 'photography',
        phone: '',
        isActive: true,
        createdAt: now,
      },
    });
    const newUser = await db.collection('users').doc(res._id).get();
    return { code: 0, data: newUser.data };
  } catch (err) {
    console.error('绑定学号失败:', err);
    return { code: 500, message: '绑定失败' };
  }
}

async function handleGetProfile(OPENID) {
  try {
    const res = await db.collection('users').where({ _openid: OPENID }).get();
    if (res.data.length === 0) return { code: 0, data: null };
    return { code: 0, data: res.data[0] };
  } catch (err) {
    // 集合不存在时查询会报错，返回 null（未登录状态）
    return { code: 0, data: null };
  }
}

async function handleUpdateProfile(OPENID, { nickName, avatarUrl, phone }) {
  try {
    const updateData = { updatedAt: new Date() };
    if (nickName !== undefined) updateData.nickName = nickName;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (phone !== undefined) updateData.phone = phone;
    await db.collection('users').where({ _openid: OPENID }).update({ data: updateData });
    const res = await db.collection('users').where({ _openid: OPENID }).get();
    return { code: 0, data: res.data[0] };
  } catch (err) {
    console.error('更新用户信息失败:', err);
    return { code: 500, message: '更新失败' };
  }
}

async function handleGetStats(OPENID) {
  try {
    const [totalRes, activeRes, overdueRes] = await Promise.all([
      db.collection('records').where({ userOpenId: OPENID }).count(),
      db.collection('records').where({ userOpenId: OPENID, status: 'active' }).count(),
      db.collection('records').where({ userOpenId: OPENID, status: 'overdue' }).count(),
    ]);
    return {
      code: 0,
      data: {
        totalCheckouts: totalRes.total,
        activeCount: activeRes.total,
        overdueCount: overdueRes.total,
      },
    };
  } catch (err) {
    console.error('获取统计失败:', err);
    return { code: 500, message: '获取统计失败' };
  }
}

async function handleListMembers(OPENID, { page = 1, pageSize = 20, keyword, role }) {
  try {
    const userRes = await db.collection('users').where({ _openid: OPENID }).get();
    const user = userRes.data[0];
    if (!user || !['admin', 'superadmin'].includes(user.role)) {
      return { code: 403, message: '权限不足' };
    }

    const where = {};
    if (role) where.role = role;
    if (keyword) {
      where.nickName = db.RegExp({ regexp: keyword, options: 'i' });
    }

    const countRes = await db.collection('users').where(where).count();
    const total = countRes.total;
    const skip = (page - 1) * pageSize;

    const listRes = await db.collection('users')
      .where(where)
      .orderBy('createdAt', 'desc')
      .skip(skip)
      .limit(pageSize)
      .field({
        _id: true,
        _openid: true,
        studentId: true,
        studentName: true,
        studentPhoto: true,
        nickName: true,
        avatarUrl: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true,
      })
      .get();

    return { code: 0, data: { list: listRes.data, total, page, pageSize } };
  } catch (err) {
    console.error('查询成员列表失败:', err);
    return { code: 500, message: '查询失败' };
  }
}

async function handleUpdateRole(OPENID, { userId, role }) {
  try {
    const userRes = await db.collection('users').where({ _openid: OPENID }).get();
    const user = userRes.data[0];
    if (!user || user.role !== 'superadmin') {
      return { code: 403, message: '仅超级管理员可修改角色' };
    }

    if (!['member', 'admin', 'superadmin'].includes(role)) {
      return { code: 400, message: '无效角色' };
    }

    await db.collection('users').doc(userId).update({
      data: { role, updatedAt: new Date() },
    });

    return { code: 0, message: '角色已更新' };
  } catch (err) {
    console.error('更新角色失败:', err);
    return { code: 500, message: '更新失败' };
  }
}

async function handleToggleActive(OPENID, { userId }) {
  try {
    const userRes = await db.collection('users').where({ _openid: OPENID }).get();
    const user = userRes.data[0];
    if (!user || !['admin', 'superadmin'].includes(user.role)) {
      return { code: 403, message: '权限不足' };
    }

    const targetRes = await db.collection('users').doc(userId).get();
    const target = targetRes.data;

    await db.collection('users').doc(userId).update({
      data: { isActive: !target.isActive, updatedAt: new Date() },
    });

    return { code: 0, data: { isActive: !target.isActive } };
  } catch (err) {
    console.error('切换状态失败:', err);
    return { code: 500, message: '操作失败' };
  }
}

async function handleAddStudent(OPENID, { studentId, name, photo }) {
  try {
    const userRes = await db.collection('users').where({ _openid: OPENID }).get();
    const user = userRes.data[0];
    if (!user || !['admin', 'superadmin'].includes(user.role)) {
      return { code: 403, message: '权限不足' };
    }

    if (!studentId || !/^\d{12}$/.test(studentId)) {
      return { code: 400, message: '学号须为12位数字' };
    }
    if (!name || !name.trim()) {
      return { code: 400, message: '姓名不能为空' };
    }

    let existing;
    try {
      existing = await db.collection('students').where({ studentId }).get();
    } catch (e) {
      existing = { data: [] };
    }
    if (existing.data.length > 0) {
      return { code: 409, message: '该学号已存在' };
    }

    const res = await db.collection('students').add({
      data: {
        studentId,
        name: name.trim(),
        photo: photo || '',
        createdAt: new Date(),
      },
    });

    return { code: 0, data: { _id: res._id } };
  } catch (err) {
    console.error('添加学生失败:', err);
    return { code: 500, message: '添加失败' };
  }
}

async function handleBatchImportStudents(OPENID, { list }) {
  try {
    const userRes = await db.collection('users').where({ _openid: OPENID }).get();
    const user = userRes.data[0];
    if (!user || !['admin', 'superadmin'].includes(user.role)) {
      return { code: 403, message: '权限不足' };
    }

    if (!Array.isArray(list) || list.length === 0) {
      return { code: 400, message: '数据不能为空' };
    }

    const now = new Date();
    let success = 0;
    let failed = 0;
    const errors = [];

    for (const item of list) {
      try {
        if (!item.studentId || !/^\d{12}$/.test(item.studentId) || !item.name) {
          failed++;
          errors.push(`${item.studentId || '未知'}: 格式错误`);
          continue;
        }
        let existing;
        try {
          existing = await db.collection('students').where({ studentId: item.studentId }).get();
        } catch (e) {
          existing = { data: [] };
        }
        if (existing.data.length > 0) {
          failed++;
          errors.push(`${item.studentId}: 已存在`);
          continue;
        }
        await db.collection('students').add({
          data: {
            studentId: item.studentId,
            name: item.name.trim(),
            photo: item.photo || '',
            createdAt: now,
          },
        });
        success++;
      } catch (e) {
        failed++;
        errors.push(`${item.studentId}: ${e.message}`);
      }
    }

    return { code: 0, data: { success, failed, errors: errors.slice(0, 10) } };
  } catch (err) {
    console.error('批量导入失败:', err);
    return { code: 500, message: '导入失败' };
  }
}

async function handleListStudents(OPENID, { page = 1, pageSize = 20, keyword }) {
  try {
    const userRes = await db.collection('users').where({ _openid: OPENID }).get();
    const user = userRes.data[0];
    if (!user || !['admin', 'superadmin'].includes(user.role)) {
      return { code: 403, message: '权限不足' };
    }

    const where = {};
    if (keyword) {
      where.name = db.RegExp({ regexp: keyword, options: 'i' });
    }

    const countRes = await db.collection('students').where(where).count();
    const total = countRes.total;
    const skip = (page - 1) * pageSize;

    const listRes = await db.collection('students')
      .where(where)
      .orderBy('createdAt', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get();

    return { code: 0, data: { list: listRes.data, total, page, pageSize } };
  } catch (err) {
    console.error('查询学生列表失败:', err);
    return { code: 500, message: '查询失败' };
  }
}

async function handleFirstSetup(OPENID, { name, code }) {
  const now = new Date();
  try {
    // 校验设置口令
    if (code !== SETUP_CODE) {
      return { code: 403, message: '口令错误' };
    }

    console.log('[firstSetup] OPENID:', OPENID, 'name:', name);

    // 仅当 users 集合为空时允许
    try {
      const countRes = await db.collection('users').count();
      console.log('[firstSetup] users count:', countRes.total);
      if (countRes.total > 0) {
        return { code: 403, message: '管理员已存在，无法重复设置' };
      }
    } catch (e) {
      console.log('[firstSetup] users count error (collection may not exist):', e.message);
    }

    if (!name || !name.trim()) {
      return { code: 400, message: '请输入姓名' };
    }

    console.log('[firstSetup] creating user...');
    const res = await db.collection('users').add({
      data: {
        _openid: OPENID,
        studentId: '',
        studentName: name.trim(),
        studentPhoto: '',
        role: 'superadmin',
        department: 'photography',
        phone: '',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    });
    console.log('[firstSetup] user created, _id:', res._id);
    const newUser = await db.collection('users').doc(res._id).get();
    return { code: 0, data: newUser.data };
  } catch (err) {
    console.error('[firstSetup] error:', err.message, err.stack);
    return { code: 500, message: '设置失败: ' + err.message };
  }
}
