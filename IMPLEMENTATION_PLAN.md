# 设备管理小程序可靠性与 UI/UX 收敛执行计划

本文件是后续分块执行记录。每完成一个 Block，必须暂停并询问用户效果，确认后再进入下一块。

## 当前目标

- 先修复设备管理核心可信度问题。
- 再完善迁移、部署和兼容收尾。
- 最后按 `AGENTS.md` 的 `UI/UX Implementation Rules` 做核心页面 UI/UX 收敛。
- 不一次性大改 UI。
- 云函数已在用户明确要求后完成部署或更新；真实数据库迁移未执行，因为 `migration.dryRun` 已确认无待迁移数据。

## 当前真实环境状态

- 云环境 ID：`studentpress-d6gj8ugww75193e6d`。
- 已部署或更新云函数：`reservation`、`maintenance`、`stats`、`migration`、`approval`、`record`、`equipment`、`user`、`notification`。
- `migration.dryRun` 已在微信开发者工具控制台成功返回 `code=0`。
- dryRun 结果：
  - `summary.hasPendingMigration=false`
  - `summary.totalPending=0`
  - `risks=[]`
  - `counts.pending.equipmentQrCodeBackfill=0`
  - `counts.pending.approvalFieldNormalize=0`
  - `counts.pending.maintenanceRecordsMove=0`
  - `counts.legacyRetained.equipmentQrCodeLegacyField=1`
- 当前不需要执行 `migration.apply`；保留的 1 个 `qr_code` 旧字段不阻断上线，因为代码不再依赖旧字段。
- 下一步是微信开发者工具和真实云环境中的业务流程回归。

## 执行规则

- 每个 Block 独立完成、独立验证、独立汇报。
- 每完成一个 Block 后，必须停止继续修改，并询问用户效果。
- 未经用户确认，不进入下一块。
- 所有 UI 改动必须先定义页面信息层级和组件结构，再实现。
- 优先使用 TDesign Mini Program，不重新发明已有 UI 组件。
- 保持原生微信小程序 + CommonJS 风格，不引入 TypeScript 或新框架。

## 当前执行状态

| Block | 名称 | 状态 | 是否需要用户确认 |
|------|------|------|------------------|
| Block 0 | 写入计划文件 | Done | Yes |
| Block 1 | 设备状态机与统一借出入口 | Done | Yes |
| Block 2 | 预约与库存强绑定 | Done | Yes |
| Block 3 | 设备编号唯一性与数据安全 | Done | Yes |
| Block 4 | 迁移、部署与兼容收尾 | Done | Yes |
| Block 5 | 核心页面 UI/UX 首轮收敛 | Done | Yes |
| Block 6 | 测试与回归基线 | Done | Yes |
| Post-Block | 云端部署与迁移预检 | Done | Yes |
| Next | 真实业务流程回归 | Pending | Yes |

## Block 0：写入计划文件

### 目标

创建本文件，明确后续分块顺序、验收标准和暂停确认规则。

### 实现范围

- 新增根目录 `IMPLEMENTATION_PLAN.md`。
- 不修改业务代码。

### 验收标准

- `IMPLEMENTATION_PLAN.md` 存在。
- 文件明确写明：完成一块后暂停并询问用户效果。

### 完成后询问

计划文件是否符合你的预期，是否进入 Block 1：设备状态机与统一借出入口？

## Block 1：设备状态机与统一借出入口

### 目标

解决设备状态分散修改、借出逻辑两套路径的问题。

### 实现范围

- 新增或扩展纯函数层，定义设备状态转换规则：
  - `available -> checked_out`
  - `checked_out -> available`
  - `available -> maintenance`
  - `maintenance -> available`
  - 非借出状态可退役
- 将扫码借出、详情页借出、审批通过后的借出，统一走同一套 checkout 核心逻辑。
- `approval.approve` 不再手写完整出库逻辑；只负责审批状态，然后调用或复用统一出库逻辑。
- 所有借出前统一检查：
  - 用户存在
  - `isActive !== false`
  - 设备状态
  - 当前持有人
  - 预约冲突

### 验收标准

- 直接借出和审批通过生成的 `records` 字段一致。
- 非法状态不能借出。
- 禁用用户不能借出。
- `npm test` 和语法检查通过。

### 完成后询问

借出、归还、审批通过流程是否符合预期？

### 完成记录

- 已扩展设备状态机、checkout/return 权限判断和统一借出记录构造。
- 已将 `record.checkout` 限制为仅管理员直接出库。
- 已将 `record.returnEquipment` 调整为持有人或管理员可归还。
- 已将 `approval.approve` 改为使用统一 checkout 记录构造，并检查申请人仍存在且账号启用。
- 已执行 `scripts/sync-cloud-shared.js` 同步云函数共享模块。
- 验证通过：
  - `tests/domain.test.js`
  - 全量 JS 语法检查
  - 旧入口/旧字段扫描，旧字段只出现在迁移函数和测试样本中。

## Block 2：预约与库存强绑定

### 目标

解决“预约已确认但设备仍可被随意借走”的问题。

### 实现范围

- 确认预约后，借出流程必须检查同一设备在目标借用时间段内是否存在冲突预约。
- 管理员即时扫码借出时，如果存在已确认预约，返回明确提示。
- 普通用户申请借用时，如果设备已有确认预约，禁止提交或提示换时间。
- 明确预约状态流：`pending -> confirmed/cancelled/expired/completed`。
- 借出或归还后按条件更新相关预约为 `completed`，不自动处理不确定匹配。

### 验收标准

- 已确认预约能阻止冲突借出。
- 已取消预约不阻止借出。
- 预约详情、预约列表状态显示不破坏。

### 完成后询问

预约和借出之间的规则是否符合实际管理方式？

### 完成记录

- 已新增 confirmed 预约冲突判断：
  - 即时出库只阻止当前时间处于预约窗口内的 confirmed 预约。
  - 若存在 `expectedReturnAt`，按当前时间到预计归还时间检查预约重叠。
  - `pending/cancelled/completed` 不阻止出库。
- 已接入 `record.checkout`：
  - 管理员直接出库前检查 confirmed 预约冲突。
  - 冲突时返回 `409` 和明确提示。
- 已接入 `approval.create`：
  - 普通成员提交借用申请前检查 confirmed 预约冲突。
- 已接入 `approval.approve`：
  - 审批通过事务内再次检查 confirmed 预约冲突，避免申请后预约状态变化。
- 已接入 `record.returnEquipment`：
  - 归还时匹配同设备、同用户、时间窗口重叠的 confirmed 预约。
  - 只完成一条最早开始的预约，更新为 `completed`，并写入 `completedAt`、`completedRecordId`、`updatedAt`。
- 验证通过：
  - `tests/domain.test.js`
  - 全量 JS 语法检查
  - 旧入口/旧字段扫描，旧字段只出现在迁移函数和测试样本中。

## Block 3：设备编号唯一性与数据安全

### 目标

解决 `count + 1` 生成二维码编号的并发和重复风险。

### 实现范围

- 新增编号生成策略：按分类维护独立计数器集合，例如 `counters/equipment_<category>`。
- 新增设备和批量导入都通过计数器生成 `qrCode`。
- `serialNumber` 和 `qrCode` 写入前都做唯一性检查。
- 批量导入时单条失败不影响其他条，返回失败原因。

### 验收标准

- 同分类连续新增编号递增。
- 批量导入不会生成重复 `qrCode`。
- 重复 SN 会失败并返回清晰错误。

### 完成后询问

编号格式和导入反馈是否满足管理需求？

### 完成记录

- 已新增设备编号纯函数：
  - 分类前缀映射：`camera/CAM`、`lens/LEN`、`tripod/TRI`、`lighting/LIT`、`audio/AUD`、`accessory/ACC`。
  - `formatEquipmentQrCode(category, seq)` 统一生成 `EQ-${prefix}-${seq}`。
  - `parseEquipmentQrSequence(qrCode, category)` 用于从已有编号提取同分类序号。
  - `getEquipmentCounterId(category)` 统一生成 `counters/equipment_${category}` 文档 ID。
- 已重构 `equipment.create`：
  - 不再使用 `count + 1`。
  - 在事务内检查 `serialNumber` 唯一性、分配 `qrCode`、检查 `qrCode` 唯一性并写入设备。
  - 计数器缺失时按现有同分类最大 `qrCode` 序号懒初始化，避免已有数据撞号。
- 已重构 `equipment.batchImport`：
  - 每条记录独立校验和独立事务写入。
  - 批量内重复 `serialNumber` 会单条失败。
  - 单条失败不影响其他合法记录。
  - 返回结构保持 `{ success, failed, errors }`。
- 已补充 `equipment.update` 中 `serialNumber/qrCode` 唯一性检查，避免更新入口写入重复值。
- 已执行 `scripts/sync-cloud-shared.js` 同步云函数共享模块。
- 验证通过：
  - `tests/domain.test.js`
  - 全量 JS 语法检查
  - 旧入口/旧字段扫描，旧字段只出现在迁移函数和测试样本中。

## Block 4：迁移、部署与兼容收尾

### 目标

把底层重构从“本地代码完成”推进到“可安全上线”。

### 实现范围

- 完善 `migration.dryRun/apply` 的输出，明确旧字段数量、维保迁移数量、风险项。
- 保留旧兼容 action，但在本文件记录移除时间点。
- 检查 `cloudbaserc.json`、部署脚本、`sync-cloud-shared` 是否完整。
- 不自动执行真实云端迁移；只准备和验证。

### 验收标准

- dryRun 输出结构清晰。
- 新旧云函数部署顺序在文档里明确。
- 本地测试和语法检查通过。

### 完成后询问

是否准备进入真实部署或迁移？

### 完成记录

- 已完善 `migration.dryRun` 输出：
  - 返回 `summary`、`counts`、`risks`、`batches`、`nextSteps`。
  - `counts.pending` 表示仍需自动迁移的数据。
  - `counts.legacyRetained` 表示保留的旧字段或旧记录，不代表迁移失败。
  - `risks` 覆盖重复 `qrCode`、重复非空 `serialNumber`、缺失二维码且无旧字段可回填、已复制维保记录等情况。
- 已完善 `migration.apply`：
  - 仍仅允许 `superadmin` 执行。
  - 返回 `before`、`result`、`remaining`、`risks`、`appliedAt`、`appliedBy`。
  - 保持幂等，不重复复制已迁移维保日志。
  - 不删除 `qr_code/applicantOpenId/reviewerOpenId` 等旧字段。
- 已在 `README.md` 和 `AGENTS.md` 写明部署与迁移顺序。
- 已记录兼容入口移除条件：
  - 完成一次真实部署。
  - `migration.dryRun/apply` 验证通过。
  - 扫描确认前端不再调用 deprecated action。
  - 后续清理任务再移除旧兼容 action。
- 已检查 `cloudbaserc.json`、`package.json` deploy scripts、`scripts/sync-cloud-shared.js` 与实际云函数列表一致。
- 验证通过：
  - `tests/domain.test.js`
  - 全量 JS 语法检查
  - `cloudbaserc.json` / `package.json` JSON 校验
  - 旧入口/旧字段扫描，旧字段只出现在迁移函数和测试样本中。

### 真实环境补充记录

- 后续已按用户要求进入真实云环境部署验证。
- 已部署或更新云函数：`reservation`、`maintenance`、`stats`、`migration`、`approval`、`record`、`equipment`、`user`、`notification`。
- 微信开发者工具 CLI 直接部署带 `_shared` 子目录的云函数时可能失败，已使用临时扁平包方式部署：
  - 将函数本地 `_shared/*.js` 拷贝到临时函数根目录。
  - 只在临时包中把 `require('./_shared/<module>')` 改成 `require('./<module>')`。
  - 仓库源码仍保持 `_shared` 目录结构。
- 曾出现一次临时包路径替换错误，导致 `migration` 云函数 `145 code exit unexpected`；已修正并重新部署 `migration`。
- `migration.dryRun` 已成功：
  - `hasPendingMigration=false`
  - `totalPending=0`
  - `risks=[]`
  - 不需要执行 `migration.apply`。

## Block 5：核心页面 UI/UX 首轮收敛

### 目标

按 `AGENTS.md` 的 UI/UX 规则，先处理最核心用户路径。

### 页面顺序

- `pages/index`
- `pages/scan`
- `pages/scan-result`
- `pages/equipment-detail`
- `pages/reservation-list`
- `pages/approval-list`

### 页面信息层级

- `pages/index`
  - 用户目标：快速判断库存、进入扫码/预约/器材列表、处理当前借出。
  - 主路径：扫码或查看器材。
  - 次路径：预约、查看全部记录、查看通知、管理员新增器材。
  - 首屏主信息：库存统计、搜索入口、快捷操作。
  - 辅助信息：逾期提醒、当前借出列表。
  - 状态区：加载、加载失败重试、空借出状态。
- `pages/scan`
  - 用户目标：快速扫码进入借还流程。
  - 主路径：点击扫码。
  - 次路径：查看正在借出的器材。
  - 首屏主信息：扫码按钮。
  - 辅助信息：最近借出。
  - 状态区：最近借出加载、空、失败。
- `pages/scan-result`
  - 用户目标：确认扫码到的器材并执行出库、申请或归还。
  - 主路径：按设备状态执行主按钮。
  - 次路径：继续扫码、查看详情。
  - 首屏主信息：设备名称、状态、编号、关键字段。
  - 辅助信息：品牌、型号、SN、位置、借出时间。
  - 状态区：加载、未找到、加载失败、提交中。
- `pages/equipment-detail`
  - 用户目标：查看设备完整信息和记录，并执行出库/归还/管理操作。
  - 主路径：底部主按钮出库或归还。
  - 次路径：编辑、二维码、预约、查看借还和维修记录。
  - 首屏主信息：设备名称、状态、编号。
  - 辅助信息：信息/借还/维修 tabs。
  - 状态区：加载、加载失败、tab 空态、提交中、删除二次确认。
- `pages/reservation-list`
  - 用户目标：查看和管理自己的预约。
  - 主路径：按状态筛选并进入详情。
  - 次路径：搜索、取消 pending/confirmed 预约。
  - 首屏主信息：状态 tabs、搜索、预约列表。
  - 辅助信息：预约时间、状态标签。
  - 状态区：加载、空、加载失败、分页加载、取消提交中。
- `pages/approval-list`
  - 用户目标：查看审批申请并进入详情处理。
  - 主路径：按状态筛选并进入审批详情。
  - 次路径：搜索设备或申请人。
  - 首屏主信息：状态 tabs、搜索、审批列表。
  - 辅助信息：申请人、时间、状态。
  - 状态区：加载、空、加载失败、分页加载。

### 实现原则

- 先写每页信息层级：
  - 用户目标
  - 主路径
  - 次路径
  - 主信息
  - 辅助信息
  - 操作区
  - 状态区
- 优先使用 TDesign Mini Program。
- 不重新发明按钮、弹窗、表单、列表、标签、loading、empty 等组件。
- 补齐正常、加载、空、错误、成功、提交中状态。
- 保持克制、清爽、微信生态工具型风格。

### 验收标准

- 移动端首屏主操作明确。
- 无明显文字溢出。
- 按钮密度合理。
- 空状态和 loading 状态完整。
- 危险操作有二次确认。
- 通过截图或预览自检常见手机尺寸。

### 完成后询问

核心页面体验是否达到预期，是否继续其他页面？

### 完成记录

- 已先写入 6 个核心页面的信息层级：
  - 用户目标、主路径、次路径、首屏主信息、辅助信息、操作区、状态区。
- 已统一核心页面状态：
  - `pages/index` 增加加载失败和重试，保留统计、搜索、快捷入口、当前借出和逾期提醒。
  - `pages/scan` 增加最近借出 loading、empty、error、retry。
  - `pages/scan-result` 区分加载中、未找到、加载失败、提交中，底部主操作保持固定。
  - `pages/equipment-detail` 增加加载失败、tab 空态、二维码弹窗，并移除 WXML 直接调用 `getButtonInfo()`。
  - `pages/reservation-list` 使用 TDesign `t-tabs`、`t-search`、`t-empty`、`t-loading`、`t-dialog`，保留取消二次确认。
  - `pages/approval-list` 使用 TDesign `t-tabs`、`t-search`、`t-empty`、`t-loading`，保留审批卡片跳转。
- 已移除 6 个核心页面 WXML 中主要内联样式，改为页面 wxss class。
- 已补充长文本省略规则，降低设备名、SN、二维码、时间范围溢出风险。
- 已补充分页 behavior 的错误态和重试入口，筛选重载失败时不保留旧列表。
- 已验证：
  - `tests/domain.test.js`
  - 全量 JS 语法检查
  - 核心页面 JSON 校验
  - 新增 TDesign/本地组件路径检查
  - 核心页面 WXML 扫描：无直接 JS 函数调用、无主要内联 style、无不存在的 `t-action-sheet-item`
- 截图/预览说明：
  - 本机存在微信开发者工具 CLI。
  - 当前未执行真实预览截图，因为需要打开微信开发者工具项目并连接实际小程序运行环境。
  - 进入人工验收时需在微信开发者工具中检查 375x667 和 390x844：首屏主操作、文字溢出、按钮密度、loading、empty、error、提交中状态。

## Block 6：测试与回归基线

### 目标

给后续继续改动建立最低回归保障。

### 实现范围

- 扩展 `tests/domain.test.js`，覆盖：
  - 状态机
  - 预约冲突
  - 编号生成
  - 权限判断
- 增加云函数语法检查脚本覆盖新增文件。
- 增加关键调用扫描，防止新代码重新调用旧兼容 action。

### 验收标准

- `npm test` 通过。
- `npm run check:syntax` 通过。
- `npm run check:compat` 通过。
- `npm run check:functions` 通过。
- `npm run check:all` 通过；若当前环境没有全局 `npm`，则 bundled Node 等价命令全部通过。
- 旧字段、旧入口扫描只在迁移函数、测试、文档或兼容层出现。

### 完成后询问

是否进入下一轮功能或视觉细化？

### 完成记录

- 已扩展 `tests/domain.test.js` 回归覆盖：
  - 禁用 `admin/superadmin` 不能直接出库或代归还。
  - 无效日期不产生预约冲突。
  - 预约窗口边界相接不冲突。
  - 归还完成预约匹配遇到无效日期或边界相接时不误匹配。
  - 未知分类使用 `UNK` fallback，编号格式和解析稳定。
  - 无待迁移数据时 `summary.hasPendingMigration=false`。
- 已新增 `scripts/check-syntax.js`：
  - 统一检查 `cloudfunctions/pages/utils/behaviors/components/custom-tab-bar/tests/scripts` 下所有 JS 语法。
- 已新增 `scripts/check-compat-scan.js`：
  - 禁止页面、service 或业务代码重新调用 deprecated compatibility action。
  - 禁止新代码写回 `qr_code/applicantOpenId/reviewerOpenId` 等旧字段。
- 已新增 `scripts/check-function-lists.js`：
  - 校验 `cloudfunctions` 目录、`cloudbaserc.json`、`package.json` deploy scripts、`scripts/sync-cloud-shared.js` 目标清单一致。
- 已更新 `package.json`：
  - `check:syntax`
  - `check:compat`
  - `check:functions`
  - `check:all`
- 已更新 `AGENTS.md` 和 `README.md` 的验证命令与回归基线说明。
- 已用 Codex bundled Node 执行等价验证：
  - `node tests/domain.test.js`
  - `node scripts/check-syntax.js`
  - `node scripts/check-compat-scan.js`
  - `node scripts/check-function-lists.js`
- 当前环境全局 `npm` 不存在，`npm run check:all` 未能直接执行；有全局 npm 的环境可使用该统一入口。
- 本块没有修改业务规则、没有改 UI、没有部署云函数、没有执行真实云数据库迁移。

## Post-Block：上线前部署与迁移预检

### 目标

确认重构后的云函数已能在真实云环境中运行，且数据迁移状态可解释。

### 完成记录

- 已通过微信开发者工具 CLI 部署或更新所有相关云函数。
- 已确认 `migration.dryRun` 最终返回 `code=0`。
- dryRun 显示无待迁移数据、无风险项。
- 当前状态不需要执行 `migration.apply`。
- 如果后续控制台只能使用 `Nodejs16.13`，不需要新建函数；优先确保函数可运行，必要时提高 `migration` 超时时间。

### 下一步

进入真实业务流程回归，优先验证：

1. 管理员扫码出库 -> 设备变为借出 -> 生成 active record。
2. 持有人或管理员归还 -> 设备变为可用 -> record 变为 returned。
3. confirmed 预约窗口内 -> 管理员即时出库被阻止。
4. 学生提交借用申请 -> 管理员审批通过/拒绝。
5. 预约创建、取消、确认。
6. 维修记录添加和统计页查看。

### 完成后询问

真实业务流程是否跑通？是否进入 deprecated 兼容入口清理或下一轮 UI/UX 精修？

## Assumptions

- 第一轮先做底层可靠性，再做 UI/UX。
- 每个 Block 独立提交式完成，完成后必须停下来问用户效果。
- 计划文件使用根目录 `IMPLEMENTATION_PLAN.md`。
- 云函数部署已在用户明确要求后执行；后续仍不要在未确认的情况下继续部署或执行写数据操作。
- 不执行真实云数据库迁移，除非后续 dryRun 出现 pending 且用户明确确认 apply。
- 不引入 TypeScript 或新框架，继续使用原生微信小程序 + TDesign Mini Program。
