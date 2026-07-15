const cloud = require('wx-server-sdk');
const { initCloud } = require('./_shared/config');
const {
  EQUIPMENT_CATEGORY_PREFIX,
  formatEquipmentQrCode,
  parseEquipmentQrSequence,
  getEquipmentCounterId,
} = require('./_shared/domain');
const {
  VALID_EQUIPMENT_CATEGORIES,
  createEquipmentWithQrCode: createEquipmentWithSharedQrCode,
  validateEquipmentUniqueUpdate: validateSharedEquipmentUniqueUpdate,
  retireEquipment: retireSharedEquipment,
  getEquipmentWriteErrorMessage: getSharedEquipmentWriteErrorMessage,
} = require('./_shared/equipment-admin');
initCloud(cloud);
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { action } = event;

  switch (action) {
    case 'getByQR':
      return handleGetByQR(event);
    case 'getById':
      return handleGetById(event);
    case 'list':
      return handleList(event);
    case 'create':
      return handleCreate(OPENID, event);
    case 'update':
      return handleUpdate(OPENID, event);
    case 'delete':
      return handleDelete(OPENID, event);
    case 'uploadImage':
      return handleUploadImage(OPENID, event);
    case 'getQrData':
      return handleGetQrData(event);
    case 'getStats':
      return handleGetStats();
    case 'batchImport':
      return handleBatchImport(OPENID, event);
    default:
      return { code: 400, message: '未知操作' };
  }
};

async function handleGetByQR({ qrCode }) {
  try {
    const res = await db.collection('equipment').where({ qrCode }).get();
    if (res.data.length === 0) return { code: 0, data: null };
    const equipment = res.data[0];
    if (equipment.currentHolder) {
      const userRes = await db.collection('users').where({ _openid: equipment.currentHolder }).get();
      if (userRes.data.length > 0) equipment.currentHolderName = userRes.data[0].nickName;
    }
    return { code: 0, data: equipment };
  } catch (err) {
    console.error('查询器材失败:', err);
    return { code: 500, message: '查询失败' };
  }
}

async function handleGetById({ id }) {
  try {
    const res = await db.collection('equipment').doc(id).get();
    const equipment = res.data;
    if (equipment.currentHolder) {
      const userRes = await db.collection('users').where({ _openid: equipment.currentHolder }).get();
      if (userRes.data.length > 0) equipment.currentHolderName = userRes.data[0].nickName;
    }
    return { code: 0, data: equipment };
  } catch (err) {
    console.error('查询器材失败:', err);
    return { code: 500, message: '查询失败' };
  }
}

async function handleList({ page = 1, pageSize = 20, category, status, keyword }) {
  try {
    const where = {};
    if (category) where.category = category;
    if (status) where.status = status;
    if (keyword) where.name = db.RegExp({ regexp: keyword, options: 'i' });

    const countRes = await db.collection('equipment').where(where).count();
    const total = countRes.total;
    const skip = (page - 1) * pageSize;
    const listRes = await db.collection('equipment')
      .where(where)
      .orderBy('createdAt', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get();

    return { code: 0, data: { list: listRes.data, total, page, pageSize } };
  } catch (err) {
    console.error('查询器材列表失败:', err);
    return { code: 500, message: '查询失败' };
  }
}

async function handleCreate(OPENID, { name, category, brand, model, serialNumber, description, location, imageUrl }) {
  try {
    const userRes = await db.collection('users').where({ _openid: OPENID }).get();
    const user = userRes.data[0];
    if (!user || !['admin', 'superadmin'].includes(user.role)) {
      return { code: 403, message: '权限不足' };
    }
    if (!VALID_EQUIPMENT_CATEGORIES.includes(category)) {
      return { code: 400, message: '器材类型无效' };
    }

    const now = new Date();
    const result = await createEquipmentWithSharedQrCode(db, {
      name,
      category,
      brand,
      model,
      serialNumber,
      description,
      location,
      imageUrl,
      now,
    });

    return { code: 0, data: result };
  } catch (err) {
    if (isRollbackCode(err, -31)) return { code: 409, message: 'SN码已存在' };
    if (isRollbackCode(err, -32)) return { code: 409, message: '二维码编号已存在，请重试' };
    console.error('新增器材失败:', err);
    return { code: 500, message: '新增失败: ' + (err.message || err.errMsg || JSON.stringify(err)) };
  }
}

async function handleUpdate(OPENID, { id, ...updateFields }) {
  try {
    const userRes = await db.collection('users').where({ _openid: OPENID }).get();
    const user = userRes.data[0];
    if (!user || !['admin', 'superadmin'].includes(user.role)) {
      return { code: 403, message: '权限不足' };
    }
    delete updateFields.qr_code;
    delete updateFields.checkedOutBy;

    const uniqueError = await validateSharedEquipmentUniqueUpdate(db, id, updateFields);
    if (uniqueError) return uniqueError;

    updateFields.updatedAt = new Date();
    await db.collection('equipment').doc(id).update({ data: updateFields });
    return { code: 0, message: '更新成功' };
  } catch (err) {
    console.error('更新器材失败:', err);
    return { code: 500, message: '更新失败' };
  }
}

async function handleDelete(OPENID, { id }) {
  try {
    const userRes = await db.collection('users').where({ _openid: OPENID }).get();
    const user = userRes.data[0];
    if (!user || !['admin', 'superadmin'].includes(user.role)) {
      return { code: 403, message: '权限不足' };
    }

    const result = await retireSharedEquipment(db, id);
    return result.code === 0 ? { code: 0, message: '删除成功' } : result;
  } catch (err) {
    console.error('删除器材失败:', err);
    return { code: 500, message: '删除失败' };
  }
}

async function handleUploadImage(OPENID, { id, fileID }) {
  try {
    const userRes = await db.collection('users').where({ _openid: OPENID }).get();
    const user = userRes.data[0];
    if (!user || !['admin', 'superadmin'].includes(user.role)) {
      return { code: 403, message: '权限不足' };
    }

    await db.collection('equipment').doc(id).update({
      data: { imageUrl: fileID, updatedAt: new Date() },
    });
    return { code: 0, data: { fileID } };
  } catch (err) {
    console.error('上传图片失败:', err);
    return { code: 500, message: '上传失败' };
  }
}

async function handleGetQrData({ id }) {
  try {
    const res = await db.collection('equipment').doc(id).get();
    const { qrCode, name } = res.data;
    return { code: 0, data: { qrCode, name } };
  } catch (err) {
    console.error('获取二维码数据失败:', err);
    return { code: 500, message: '获取失败' };
  }
}

async function handleBatchImport(OPENID, { list }) {
  try {
    const userRes = await db.collection('users').where({ _openid: OPENID }).get();
    const user = userRes.data[0];
    if (!user || !['admin', 'superadmin'].includes(user.role)) {
      return { code: 403, message: '权限不足' };
    }

    if (!Array.isArray(list)) {
      return { code: 400, message: '导入数据格式错误' };
    }

    let success = 0;
    let failed = 0;
    const errors = [];
    const seenSerialNumbers = new Set();

    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      const { category, model, serialNumber } = item;
      const rowNo = i + 1;
      const normalizedSerialNumber = String(serialNumber || '').trim();
      const normalizedModel = String(model || '').trim();

      if (!category || !VALID_EQUIPMENT_CATEGORIES.includes(category)) {
        failed++;
        errors.push(`第${rowNo}条：类型无效，须为 ${VALID_EQUIPMENT_CATEGORIES.join('/')}`);
        continue;
      }
      if (!normalizedModel) {
        failed++;
        errors.push(`第${rowNo}条：型号不能为空`);
        continue;
      }
      if (!normalizedSerialNumber) {
        failed++;
        errors.push(`第${rowNo}条：SN码不能为空`);
        continue;
      }
      if (seenSerialNumbers.has(normalizedSerialNumber)) {
        failed++;
        errors.push(`第${rowNo}条：SN码 ${normalizedSerialNumber} 在本次导入中重复`);
        continue;
      }
      seenSerialNumbers.add(normalizedSerialNumber);

      try {
        await createEquipmentWithSharedQrCode(db, {
          name: normalizedModel,
          category,
          brand: item.brand || '',
          model: normalizedModel,
          serialNumber: normalizedSerialNumber,
          description: item.description || '',
          location: item.location || '',
          imageUrl: '',
          now: new Date(),
        });
        success++;
      } catch (err) {
        failed++;
        errors.push(`第${rowNo}条：${getSharedEquipmentWriteErrorMessage(err)}`);
      }
    }

    return { code: 0, data: { success, failed, errors } };
  } catch (err) {
    console.error('批量导入器材失败:', err);
    return { code: 500, message: '导入失败' };
  }
}

async function createEquipmentWithQrCode({ name, category, brand, model, serialNumber, description, location, imageUrl, now }) {
  const createdAt = now || new Date();
  const normalizedSerialNumber = String(serialNumber || '').trim();

  await ensureCollectionExists('counters');

  return db.runTransaction(async (transaction) => {
    if (normalizedSerialNumber) {
      const serialRes = await transaction.collection('equipment')
        .where({ serialNumber: normalizedSerialNumber })
        .limit(1)
        .get();
      if (serialRes.data.length > 0) {
        await transaction.rollback(-31);
        return null;
      }
    }

    const qrCode = await allocateEquipmentQrCode(transaction, category, createdAt);
    const qrRes = await transaction.collection('equipment')
      .where({ qrCode })
      .limit(1)
      .get();
    if (qrRes.data.length > 0) {
      await transaction.rollback(-32);
      return null;
    }

    const res = await transaction.collection('equipment').add({
      data: {
        name,
        category,
        brand: brand || '',
        model: model || '',
        serialNumber: normalizedSerialNumber,
        status: 'available',
        qrCode,
        imageUrl: imageUrl || '',
        description: description || '',
        location: location || '',
        currentHolder: null,
        checkedOutAt: null,
        purchaseDate: '',
        condition: 'good',
        tags: [],
        createdAt,
        updatedAt: createdAt,
      },
    });

    return { _id: res._id, qrCode };
  });
}

async function ensureCollectionExists(collectionName) {
  if (typeof db.createCollection !== 'function') return;
  try {
    await db.createCollection(collectionName);
  } catch (err) {
    if (!isCollectionAlreadyExistsError(err)) throw err;
  }
}

async function allocateEquipmentQrCode(transaction, category, now) {
  const counterId = getEquipmentCounterId(category);
  let currentSeq = null;

  const counterRes = await transaction.collection('counters')
    .where({ _id: counterId })
    .limit(1)
    .get();
  if (counterRes.data.length > 0 && Number.isFinite(Number(counterRes.data[0].seq))) {
    currentSeq = Number(counterRes.data[0].seq);
  }

  if (currentSeq === null) {
    const maxExistingSeq = await getMaxExistingEquipmentSequence(transaction, category);
    const nextSeq = maxExistingSeq + 1;
    await transaction.collection('counters').doc(counterId).set({
      data: {
        type: 'equipment',
        category,
        seq: nextSeq,
        createdAt: now,
        updatedAt: now,
      },
    });
    return formatEquipmentQrCode(category, nextSeq);
  }

  const nextSeq = currentSeq + 1;
  await transaction.collection('counters').doc(counterId).update({
    data: {
      seq: nextSeq,
      updatedAt: now,
    },
  });
  return formatEquipmentQrCode(category, nextSeq);
}

async function getMaxExistingEquipmentSequence(transaction, category) {
  let maxSeq = 0;
  let skip = 0;
  const pageSize = 100;

  while (true) {
    const res = await transaction.collection('equipment')
      .where({ category })
      .skip(skip)
      .limit(pageSize)
      .get();

    for (const item of res.data) {
      const seq = parseEquipmentQrSequence(item.qrCode, category);
      if (seq !== null && seq > maxSeq) maxSeq = seq;
    }

    if (res.data.length < pageSize) break;
    skip += pageSize;
  }

  return maxSeq;
}

async function validateEquipmentUniqueUpdate(id, updateFields) {
  if (Object.prototype.hasOwnProperty.call(updateFields, 'serialNumber')) {
    updateFields.serialNumber = String(updateFields.serialNumber || '').trim();
    if (updateFields.serialNumber) {
      const serialRes = await db.collection('equipment').where({ serialNumber: updateFields.serialNumber }).get();
      if (serialRes.data.some((item) => item._id !== id)) {
        return { code: 409, message: 'SN码已存在' };
      }
    }
  }

  if (Object.prototype.hasOwnProperty.call(updateFields, 'qrCode')) {
    updateFields.qrCode = String(updateFields.qrCode || '').trim();
    if (!updateFields.qrCode) {
      return { code: 400, message: '二维码编号不能为空' };
    }
    const qrRes = await db.collection('equipment').where({ qrCode: updateFields.qrCode }).get();
    if (qrRes.data.some((item) => item._id !== id)) {
      return { code: 409, message: '二维码编号已存在' };
    }
  }

  return null;
}

function isRollbackCode(err, code) {
  const text = String((err && (err.errMsg || err.message)) || '');
  return err && err.errCode === -502005 && text.indexOf(String(code)) !== -1;
}

function isCollectionAlreadyExistsError(err) {
  const text = String((err && (err.errMsg || err.message)) || '');
  return text.includes('DATABASE_COLLECTION_ALREADY_EXIST')
    || text.includes('collection already exists')
    || text.includes('Collection already exists')
    || text.includes('already exist');
}

function getEquipmentWriteErrorMessage(err) {
  if (isRollbackCode(err, -31)) return 'SN码已存在';
  if (isRollbackCode(err, -32)) return '二维码编号已存在，请重试';
  return (err && (err.message || err.errMsg)) || '写入失败';
}

async function handleGetStats() {
  try {
    const [totalRes, availableRes, checkedOutRes] = await Promise.all([
      db.collection('equipment').where({ status: _.neq('retired') }).count(),
      db.collection('equipment').where({ status: 'available' }).count(),
      db.collection('equipment').where({ status: 'checked_out' }).count(),
    ]);
    return { code: 0, data: { total: totalRes.total, available: availableRes.total, checkedOut: checkedOutRes.total } };
  } catch (err) {
    console.error('获取器材统计失败:', err);
    return { code: 500, message: '获取统计失败' };
  }
}
