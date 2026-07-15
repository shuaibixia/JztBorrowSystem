const { createNotification } = require('./notification');
const {
  canDirectCheckout,
  canReturnEquipment,
  canTransitionEquipmentStatus,
  buildCheckoutRecord,
  buildCheckoutEquipmentUpdate,
  buildReturnEquipmentUpdate,
  buildReturnRecordUpdate,
  hasConfirmedReservationConflict,
  findCompletableReservation,
} = require('./domain');

async function checkoutForMember(db, { actor, member, equipmentId, purpose, expectedReturnAt }) {
  if (!canDirectCheckout(actor)) throw businessError(403, '权限不足');
  if (!member || member.isActive === false) throw businessError(400, '借用成员不可用');
  if (!equipmentId) throw businessError(400, '请选择器材');
  const now = new Date();
  try {
    const result = await db.runTransaction(async (transaction) => {
      const equipmentRes = await transaction.collection('equipment').doc(equipmentId).get();
      const equipment = equipmentRes.data;
      if (!equipment || !canTransitionEquipmentStatus(equipment.status, 'checked_out')) {
        await transaction.rollback(-31);
        return;
      }
      const conflictRes = await transaction.collection('reservations').where({ equipmentId, status: 'confirmed' }).get();
      if (hasConfirmedReservationConflict(conflictRes.data, now, expectedReturnAt || null, { allowedUserOpenId: member._openid })) {
        await transaction.rollback(-32);
        return;
      }
      await transaction.collection('equipment').doc(equipmentId).update({ data: buildCheckoutEquipmentUpdate(member._openid, now) });
      const recordRes = await transaction.collection('records').add({
        data: buildCheckoutRecord({ equipment, user: member, purpose, expectedReturnAt, checkoutAt: now }),
      });
      return { equipment, recordId: recordRes._id };
    });
    await createNotification(db, member._openid, 'checkout', '器材已出库', `您已借出「${result.equipment.name}」，请按时归还`, result.recordId, 'record');
    return { recordId: result.recordId, equipmentId };
  } catch (err) {
    throw normalizeTransactionError(err, {
      '-31': [400, '器材当前不可出库'],
      '-32': [409, '该器材当前已有确认预约，暂不可出库'],
    }, '出库失败');
  }
}

async function returnRecord(db, { actor, recordId, conditionAfter, remark }) {
  if (!recordId) throw businessError(400, '缺少借还记录');
  const now = new Date();
  try {
    const result = await db.runTransaction(async (transaction) => {
      const recordRes = await transaction.collection('records').doc(recordId).get();
      const record = recordRes.data;
      if (!record || record.status !== 'active') {
        await transaction.rollback(-41);
        return;
      }
      const equipmentRes = await transaction.collection('equipment').doc(record.equipmentId).get();
      const equipment = equipmentRes.data;
      if (!equipment || !canTransitionEquipmentStatus(equipment.status, 'available') || !canReturnEquipment(actor, equipment)) {
        await transaction.rollback(-42);
        return;
      }
      await transaction.collection('equipment').doc(equipment._id).update({ data: buildReturnEquipmentUpdate(equipment, conditionAfter, now) });
      await transaction.collection('records').doc(recordId).update({ data: buildReturnRecordUpdate(conditionAfter, remark, now) });
      const reservationRes = await transaction.collection('reservations').where({ equipmentId: equipment._id, userOpenId: record.userOpenId, status: 'confirmed' }).get();
      const reservation = findCompletableReservation(reservationRes.data, { equipmentId: equipment._id, userOpenId: record.userOpenId, checkoutAt: record.checkoutAt, returnAt: now });
      if (reservation) {
        await transaction.collection('reservations').doc(reservation._id).update({ data: { status: 'completed', completedAt: now, completedRecordId: recordId, updatedAt: now } });
      }
      return { holderOpenId: record.userOpenId, equipmentName: equipment.name, completedReservationId: reservation && reservation._id || '' };
    });
    await createNotification(db, result.holderOpenId, 'return', '器材已归还', `您已归还「${result.equipmentName}」`, recordId, 'record');
    return { recordId, completedReservationId: result.completedReservationId };
  } catch (err) {
    throw normalizeTransactionError(err, {
      '-41': [400, '该借还记录已处理'],
      '-42': [403, '无权归还该器材，或器材状态已变更'],
    }, '归还失败');
  }
}

async function approveApproval(db, { actor, approvalId, remark }) {
  if (!approvalId) throw businessError(400, '缺少审批编号');
  const approvalRes = await db.collection('approvals').doc(approvalId).get();
  const approval = approvalRes.data;
  if (!approval || approval.status !== 'pending') throw businessError(400, '该审批已处理');
  const requesterRes = await db.collection('users').where({ _openid: approval.requesterOpenId }).limit(1).get();
  const requester = requesterRes.data[0];
  if (!requester || requester.isActive === false) throw businessError(400, '申请人不可用');
  const now = new Date();
  try {
    await db.runTransaction(async (transaction) => {
      const txApproval = (await transaction.collection('approvals').doc(approvalId).get()).data;
      if (!txApproval || txApproval.status !== 'pending') { await transaction.rollback(-51); return; }
      const equipment = (await transaction.collection('equipment').doc(approval.equipmentId).get()).data;
      if (!equipment || !canTransitionEquipmentStatus(equipment.status, 'checked_out')) { await transaction.rollback(-52); return; }
      const reservations = await transaction.collection('reservations').where({ equipmentId: equipment._id, status: 'confirmed' }).get();
      if (hasConfirmedReservationConflict(reservations.data, now, approval.expectedReturnAt || null, { allowedUserOpenId: approval.requesterOpenId })) { await transaction.rollback(-53); return; }
      await transaction.collection('approvals').doc(approvalId).update({ data: { status: 'approved', approverId: actor._id, approverOpenId: actor._openid, remark: remark || '', reviewedAt: now, updatedAt: now } });
      await transaction.collection('equipment').doc(equipment._id).update({ data: buildCheckoutEquipmentUpdate(requester._openid, now) });
      await transaction.collection('records').add({ data: buildCheckoutRecord({ equipment, user: requester, purpose: approval.purpose, expectedReturnAt: approval.expectedReturnAt, checkoutAt: now, approvalId }) });
    });
    await createNotification(db, approval.requesterOpenId, 'approval_approved', '借用申请已通过', `您借用「${approval.equipmentName}」的申请已通过，器材已出库`, approvalId, 'approval');
    return { approvalId, status: 'approved' };
  } catch (err) {
    throw normalizeTransactionError(err, {
      '-51': [400, '该审批已处理'],
      '-52': [400, '器材当前不可用，无法通过审批'],
      '-53': [409, '该器材当前已有确认预约，无法通过审批'],
    }, '审批通过失败');
  }
}

async function rejectApproval(db, { actor, approvalId, rejectReason }) {
  const approval = (await db.collection('approvals').doc(approvalId).get()).data;
  if (!approval || approval.status !== 'pending') throw businessError(400, '该审批已处理');
  const now = new Date();
  await db.collection('approvals').doc(approvalId).update({ data: { status: 'rejected', approverId: actor._id, approverOpenId: actor._openid, rejectReason: rejectReason || '', reviewedAt: now, updatedAt: now } });
  await createNotification(db, approval.requesterOpenId, 'approval_rejected', '借用申请被拒绝', `您借用「${approval.equipmentName}」的申请被拒绝${rejectReason ? `，原因：${rejectReason}` : ''}`, approvalId, 'approval');
  return { approvalId, status: 'rejected' };
}

async function confirmReservation(db, { reservationId }) {
  const reservation = (await db.collection('reservations').doc(reservationId).get()).data;
  if (!reservation || reservation.status !== 'pending') throw businessError(400, '该预约已处理');
  await db.collection('reservations').doc(reservationId).update({ data: { status: 'confirmed', updatedAt: new Date() } });
  await createNotification(db, reservation.userOpenId, 'reservation_confirmed', '预约已确认', `您预约「${reservation.equipmentName}」的申请已确认`, reservationId, 'reservation');
  return { reservationId, status: 'confirmed' };
}

async function cancelReservation(db, { reservationId }) {
  const reservation = (await db.collection('reservations').doc(reservationId).get()).data;
  if (!reservation || !['pending', 'confirmed'].includes(reservation.status)) throw businessError(400, '该预约无法取消');
  await db.collection('reservations').doc(reservationId).update({ data: { status: 'cancelled', updatedAt: new Date() } });
  await createNotification(db, reservation.userOpenId, 'reservation_cancelled', '预约已取消', `您预约「${reservation.equipmentName}」的申请已取消`, reservationId, 'reservation');
  return { reservationId, status: 'cancelled' };
}

async function addMaintenanceLog(db, { actor, equipmentId, maintenanceType, description, cost, technician, partsReplaced }) {
  if (!equipmentId) throw businessError(400, '缺少器材 ID');
  const equipment = (await db.collection('equipment').doc(equipmentId).get()).data;
  if (!equipment) throw businessError(404, '器材不存在');
  const now = new Date();
  const result = await db.collection('maintenanceLogs').add({ data: { equipmentId, equipmentName: equipment.name, userId: actor._id, userOpenId: actor._openid, userName: actor.nickName || actor.studentName || '', maintenanceType: maintenanceType || 'repair', description: description || '', cost: Number(cost || 0), technician: technician || '', partsReplaced: partsReplaced || '', createdAt: now, updatedAt: now } });
  return { _id: result._id };
}

function normalizeTransactionError(err, mapping, fallback) {
  if (err && err.code) return err;
  const text = String((err && (err.errMsg || err.message)) || '');
  for (const [rollbackCode, [code, message]] of Object.entries(mapping)) {
    if (err && err.errCode === -502005 && text.includes(rollbackCode)) return businessError(code, message);
  }
  return businessError(500, fallback);
}

function businessError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

module.exports = {
  checkoutForMember,
  returnRecord,
  approveApproval,
  rejectApproval,
  confirmReservation,
  cancelReservation,
  addMaintenanceLog,
};
