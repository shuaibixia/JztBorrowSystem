const assert = require('assert');
const {
  VALID_EQUIPMENT_CATEGORIES,
  getEquipmentWriteErrorMessage,
} = require('../cloudfunctions/_shared/equipment-admin');

assert.deepStrictEqual(VALID_EQUIPMENT_CATEGORIES, ['camera', 'lens', 'tripod', 'lighting', 'audio', 'accessory']);
assert.strictEqual(getEquipmentWriteErrorMessage({ code: 400, message: '器材类型无效' }), '器材类型无效');
assert.strictEqual(getEquipmentWriteErrorMessage({ message: 'unexpected write failure' }), 'unexpected write failure');

console.log('equipment-admin tests passed');
