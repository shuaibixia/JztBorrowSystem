const {
  EQUIPMENT_CATEGORY_PREFIX,
  formatEquipmentQrCode,
  parseEquipmentQrSequence,
  getEquipmentCounterId,
} = require('./domain');

const VALID_EQUIPMENT_CATEGORIES = Object.keys(EQUIPMENT_CATEGORY_PREFIX);

async function createEquipmentWithQrCode(db, input) {
  const { name, category, brand, model, serialNumber, description, location, imageUrl, now } = input;
  const createdAt = now || new Date();
  const normalizedSerialNumber = String(serialNumber || '').trim();

  if (!VALID_EQUIPMENT_CATEGORIES.includes(category)) {
    throw createBusinessError(400, '器材类型无效');
  }

  await ensureCollectionExists(db, 'counters');
  return db.runTransaction(async (transaction) => {
    if (normalizedSerialNumber) {
      const serialRes = await transaction.collection('equipment').where({ serialNumber: normalizedSerialNumber }).limit(1).get();
      if (serialRes.data.length > 0) {
        await transaction.rollback(-31);
        return null;
      }
    }

    const qrCode = await allocateEquipmentQrCode(transaction, category, createdAt);
    const qrRes = await transaction.collection('equipment').where({ qrCode }).limit(1).get();
    if (qrRes.data.length > 0) {
      await transaction.rollback(-32);
      return null;
    }

    const res = await transaction.collection('equipment').add({
      data: {
        name: String(name || '').trim(),
        category,
        brand: String(brand || '').trim(),
        model: String(model || '').trim(),
        serialNumber: normalizedSerialNumber,
        status: 'available',
        qrCode,
        imageUrl: imageUrl || '',
        description: String(description || '').trim(),
        location: String(location || '').trim(),
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

async function validateEquipmentUniqueUpdate(db, id, updateFields) {
  if (Object.prototype.hasOwnProperty.call(updateFields, 'serialNumber')) {
    updateFields.serialNumber = String(updateFields.serialNumber || '').trim();
    if (updateFields.serialNumber) {
      const serialRes = await db.collection('equipment').where({ serialNumber: updateFields.serialNumber }).get();
      if (serialRes.data.some((item) => item._id !== id)) return { code: 409, message: 'SN码已存在' };
    }
  }
  if (Object.prototype.hasOwnProperty.call(updateFields, 'qrCode')) {
    updateFields.qrCode = String(updateFields.qrCode || '').trim();
    if (!updateFields.qrCode) return { code: 400, message: '二维码编号不能为空' };
    const qrRes = await db.collection('equipment').where({ qrCode: updateFields.qrCode }).get();
    if (qrRes.data.some((item) => item._id !== id)) return { code: 409, message: '二维码编号已存在' };
  }
  return null;
}

async function retireEquipment(db, id) {
  const result = await db.collection('equipment').doc(id).get();
  if (!result.data) return { code: 404, message: '器材不存在' };
  if (result.data.status === 'checked_out') return { code: 400, message: '器材已借出，无法退役' };
  await db.collection('equipment').doc(id).update({ data: { status: 'retired', updatedAt: new Date() } });
  return { code: 0, message: '器材已退役' };
}

async function ensureCollectionExists(db, collectionName) {
  if (typeof db.createCollection !== 'function') return;
  try {
    await db.createCollection(collectionName);
  } catch (err) {
    if (!isCollectionAlreadyExistsError(err)) throw err;
  }
}

async function allocateEquipmentQrCode(transaction, category, now) {
  const counterId = getEquipmentCounterId(category);
  const counterRes = await transaction.collection('counters').where({ _id: counterId }).limit(1).get();
  const currentSeq = counterRes.data.length > 0 && Number.isFinite(Number(counterRes.data[0].seq)) ? Number(counterRes.data[0].seq) : null;
  if (currentSeq === null) {
    const nextSeq = (await getMaxExistingEquipmentSequence(transaction, category)) + 1;
    await transaction.collection('counters').doc(counterId).set({ data: { type: 'equipment', category, seq: nextSeq, createdAt: now, updatedAt: now } });
    return formatEquipmentQrCode(category, nextSeq);
  }
  const nextSeq = currentSeq + 1;
  await transaction.collection('counters').doc(counterId).update({ data: { seq: nextSeq, updatedAt: now } });
  return formatEquipmentQrCode(category, nextSeq);
}

async function getMaxExistingEquipmentSequence(transaction, category) {
  let maxSeq = 0;
  let skip = 0;
  while (true) {
    const res = await transaction.collection('equipment').where({ category }).skip(skip).limit(100).get();
    for (const item of res.data) {
      const seq = parseEquipmentQrSequence(item.qrCode, category);
      if (seq !== null && seq > maxSeq) maxSeq = seq;
    }
    if (res.data.length < 100) return maxSeq;
    skip += 100;
  }
}

function isRollbackCode(err, code) {
  const text = String((err && (err.errMsg || err.message)) || '');
  return err && err.errCode === -502005 && text.indexOf(String(code)) !== -1;
}

function getEquipmentWriteErrorMessage(err) {
  if (err && err.code) return err.message;
  if (isRollbackCode(err, -31)) return 'SN码已存在';
  if (isRollbackCode(err, -32)) return '二维码编号已存在，请重试';
  return (err && (err.message || err.errMsg)) || '写入失败';
}

function isCollectionAlreadyExistsError(err) {
  const text = String((err && (err.errMsg || err.message)) || '');
  return text.includes('DATABASE_COLLECTION_ALREADY_EXIST') || text.includes('collection already exists') || text.includes('Collection already exists') || text.includes('already exist');
}

function createBusinessError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

module.exports = {
  VALID_EQUIPMENT_CATEGORIES,
  createEquipmentWithQrCode,
  validateEquipmentUniqueUpdate,
  retireEquipment,
  getEquipmentWriteErrorMessage,
};
