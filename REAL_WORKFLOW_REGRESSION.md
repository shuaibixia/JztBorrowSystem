# 真实业务流程回归验收

本文件用于上线前真实云环境人工回归。当前阶段不是继续迁移，而是验证底层重构后的核心业务链路是否可用。

## 当前前置状态

- 云环境 ID：`studentpress-d6gj8ugww75193e6d`。
- 相关云函数已部署或更新：`reservation`、`maintenance`、`stats`、`migration`、`approval`、`record`、`equipment`、`user`、`notification`。
- `migration.dryRun` 已成功返回 `code=0`。
- `summary.hasPendingMigration=false`，`summary.totalPending=0`，`risks=[]`。
- 当前不执行新的迁移，不执行 `migration.apply`。
- 保留的旧字段如 `equipment.qr_code` 不阻断验收；代码应依赖 canonical 字段。

## 回归原则

- 三条主链路优先：`扫码出库 -> 归还`、`借用申请 -> 审批通过`、`预约确认 -> 冲突出库被阻止`。
- 三条主链路全部通过后，底层重构可视为上线前主链路通过。
- 任一主链路失败时，暂停扩展流程验收，优先修复阻断 bug。
- 主链路通过后，再执行完整流程清单。
- 业务阻断问题立即修复；非阻断 UI/UX 问题记录到后续 UI/UX 精修。
- 使用现有真实数据；如果现有数据不足，在本文档记录缺失项，再决定是否补最少测试数据。

## 本次执行记录

| 项目 | 结果 | 备注 |
|------|------|------|
| 本地领域测试 | 通过 | `node tests/domain.test.js` |
| JS 语法检查 | 通过 | `node scripts/check-syntax.js`，共 100 个 JS 文件 |
| WXML 组件注册检查 | 通过 | `node scripts/check-wxml-components.js` |
| 兼容入口/旧字段扫描 | 通过 | `node scripts/check-compat-scan.js` |
| 云函数清单检查 | 通过 | `node scripts/check-function-lists.js`，共 9 个云函数 |
| 微信开发者工具打开项目 | 通过 | CLI `open` 成功 |
| 微信开发者工具 preview | 通过 | CLI `preview` 成功，包体约 707.1 KB |
| 首页渲染 | 通过 | `pages/index/index` 可渲染，显示统计、搜索、快捷入口、当前借出 |
| 我的页渲染 | 通过 | `pages/profile/profile` 可渲染，当前用户显示为 `admin / 超管` |
| 数据管理页学生录入绑定 | 已修复 | `pages/data-import/data-import.wxml` 学生单条/批量录入曾使用不存在的 `st*` 字段和 `onSt*` 方法，已改回 JS 中实际存在的 `formStudentId/formName/batchJson` 与对应 handler |
| 我的页未绑定空白 | 已修复 | `behaviors/login.js` 在未找到当前用户时原先不触发页面进入绑定态，导致 `pages/profile/profile` 空白；已补 `onLoginRequired` 并在 profile 页显示绑定表单 |
| 绑定成功后页面不刷新 | 已修复 | `pages/profile/profile.js` 绑定成功后原先写 `this._loginChecked=false`，不会影响 data 中的 `_loginChecked`；已改为直接使用 `bindStudentId` 返回的 `userInfo` 刷新页面状态 |
| 修复后静态检查 | 通过 | bundled Node 执行 `scripts/check-wxml-components.js`、`scripts/check-syntax.js` 均通过 |
| CloudBase CLI 登录 | 通过 | 使用临时安装的 `@cloudbase/cli 3.5.9`，已能读取环境 `studentpress-d6gj8ugww75193e6d` |
| `equipment` 云函数重新部署 | 通过 | 使用 `tcb fn deploy equipment --force --env-id studentpress-d6gj8ugww75193e6d` 部署成功；修复首次缺少 `counters` 集合时新增设备失败的问题 |
| 6 个二维码测试设备写入 | 通过 | 已通过 `tcb db nosql execute` 幂等更新/新增 `相机 1/2/3`、`镜头 1/2/3`，并创建 `counters` 集合计数器文档 |
| 二维码查找验证 | 通过 | `equipment.getByQR` 对 `相机 1/2/3`、`镜头 1/2/3` 均返回设备，状态均为 `available` |
| 控制台警告 | 非阻断 | lazy loading 与 `wx.getSystemInfoSync` deprecated 警告 |
| 控制台旧错误 | 待清理后复核 | 有历史 `SystemError timeout` 日志残留；当前页面仍可渲染，profile 只读查询成功 |
| 当前能否进入三条主链路 | 可继续 | 匿名普通学生已能正常显示；6 个可用测试器材已准备完成 |

## 测试数据记录

| 项目 | 实际使用值 | 备注 |
|------|------------|------|
| 管理员账号 / openid | `admin` / 实际 openid 已脱敏 | 角色为 `superadmin`，账号启用 |
| 学生账号 / openid | 已绑定，具体 openid 待主链路操作时记录 | 另一个微信号已绑定为普通成员 |
| 学生学号 | 匿名 12 位测试学号 | 普通学生页面已正常显示 |
| 可用测试器材 A | `相机 1` / 设备文档 ID 已脱敏 / `qrCode=相机 1` / `SN=CAM-001` | 状态为 `available` |
| 可用测试器材 B | `相机 2` / 设备文档 ID 已脱敏 / `qrCode=相机 2` / `SN=CAM-002` | 状态为 `available` |
| 其他可用二维码器材 | `相机 3`、`镜头 1`、`镜头 2`、`镜头 3` | `getByQR` 均已验证命中，状态均为 `available` |
| confirmed 预约时间窗口 | 未创建 | 因缺少普通学生用户，未进入预约创建 |
| 微信开发者工具版本 | Nightly `2.02.2605292`，WeChatLib `3.16.0` | 记录用于复现 |
| 测试日期 | 2026-07-02 |  |

## 核心主链路验收

### 1. 扫码出库 -> 归还

| 步骤 | 操作 | 期望结果 | 实际结果 | 通过 |
|------|------|----------|----------|------|
| 1 | 管理员登录并进入扫码页 | 页面可打开，扫码主操作可见 |  |  |
| 2 | 扫描可用测试器材 A | 进入扫码结果页，显示设备名称、状态、编号 |  |  |
| 3 | 管理员执行出库 | 操作成功，设备状态变为 `checked_out` |  |  |
| 4 | 检查设备数据 | `currentHolder` 为持有人 openid，`checkedOutAt` 有值 |  |  |
| 5 | 检查借还记录 | 新增 `records.status=active`，`action=checkout`，设备和用户字段正确 |  |  |
| 6 | 持有人或管理员执行归还 | 操作成功，设备状态变为 `available` |  |  |
| 7 | 检查归还后设备数据 | `currentHolder=null`，`checkedOutAt=null` |  |  |
| 8 | 检查归还后记录 | 原 active 记录变为 `returned`，`returnAt` 有值 |  |  |

通过标准：

- 直接出库和归还都成功。
- 设备状态和持有人字段正确变化。
- 借还记录从 `active` 正确变为 `returned`。
- 没有控制台红色阻断错误。

### 2. 借用申请 -> 管理员审批通过

| 步骤 | 操作 | 期望结果 | 实际结果 | 通过 |
|------|------|----------|----------|------|
| 1 | 普通学生登录 | 学生账号可正常进入小程序 |  |  |
| 2 | 学生选择可用器材并提交借用申请 | 生成 `pending` 审批申请 |  |  |
| 3 | 管理员进入审批列表 | 能看到该申请 |  |  |
| 4 | 管理员打开审批详情 | 申请人、设备、用途、预计归还时间显示正确 |  |  |
| 5 | 管理员审批通过 | 审批状态变为 `approved`，设备同步出库 |  |  |
| 6 | 检查设备数据 | 设备状态为 `checked_out`，`currentHolder` 为申请人 openid |  |  |
| 7 | 检查借还记录 | 生成 active checkout record，包含 `approvalId` |  |  |

通过标准：

- 审批通过后设备必须通过统一 checkout 逻辑出库。
- 审批通过生成的 record 字段与管理员直接出库的 record 字段结构一致。
- 额外保留 `approvalId`。
- 如果审批前设备已不可用，应失败并提示，不得重复出库。

### 3. 预约确认 -> 冲突出库被阻止

| 步骤 | 操作 | 期望结果 | 实际结果 | 通过 |
|------|------|----------|----------|------|
| 1 | 学生为测试器材 B 创建预约 | 预约创建成功，状态为 `pending` |  |  |
| 2 | 管理员确认该预约 | 预约状态变为 `confirmed` |  |  |
| 3 | 确认当前时间落在预约窗口内 | `startDate <= now < endDate` |  |  |
| 4 | 管理员尝试即时扫码出库该器材 | 出库失败，提示当前已有确认预约或类似明确冲突信息 |  |  |
| 5 | 学生或管理员取消该预约 | 预约状态变为 `cancelled` |  |  |
| 6 | 管理员再次尝试出库 | 已取消预约不再阻止出库 |  |  |

通过标准：

- `confirmed` 且当前时间处于预约窗口内时，管理员即时出库必须被阻止。
- `cancelled` 预约不能继续阻止出库。
- 失败提示应明确，不能表现为白屏、无响应或通用未知错误。

## 扩展流程验收

主链路通过后再执行以下流程。

| 场景 | 操作 | 期望结果 | 实际结果 | 通过 |
|------|------|----------|----------|------|
| 学生绑定学号 | 输入 12 位学号并绑定 | 用户资料同步学生姓名，账号可用 |  |  |
| 查看器材列表 | 打开器材列表并搜索/筛选 | 列表、空态、加载态正常，点击可进详情 |  |  |
| 查看器材详情 | 打开设备详情页 | 基本信息、借还记录、维修记录 tab 正常 |  |  |
| 管理员扫码出库 | 对可用设备执行出库 | 状态和记录正确 |  |  |
| 持有人归还 | 对当前借出设备执行归还 | 状态和记录正确 |  |  |
| 学生提交借用申请 | 对可用设备提交申请 | 生成 pending 审批 |  |  |
| 管理员审批拒绝 | 拒绝 pending 申请 | 审批状态变为 rejected，设备不出库 |  |  |
| 创建预约 | 学生选择设备和时间段 | 生成 pending 预约 |  |  |
| 取消预约 | 取消 pending 或 confirmed 预约 | 预约状态变为 cancelled |  |  |
| 管理员确认预约 | 管理员确认 pending 预约 | 预约状态变为 confirmed |  |  |
| 添加维修记录 | 管理员新增维修/保养日志 | 写入 `maintenanceLogs`，详情页可见 |  |  |
| 查看统计页 | 管理员打开统计页 | 统计数据正常加载，无阻断错误 |  |  |

## 问题记录

| 编号 | 场景 | 复现步骤 | 期望 | 实际 | 控制台首个错误 | 截图/备注 | 是否阻断 |
|------|------|----------|------|------|----------------|-----------|----------|
| 1 | 测试数据不足 | 只读查询 `user.listMembers` 和 `equipment.list` | 至少存在 1 个管理员、1 个普通学生、可用测试器材 | 已补齐：匿名普通学生可显示，6 个二维码器材已写入并验证 | 无新增云函数错误；控制台存在历史 `SystemError timeout` 残留 | 原阻断已解除，可继续三条主链路回归 | 否 |
| 2 | 数据管理页学生录入绑定错误 | 进入 `pages/data-import/data-import` 的学生单条录入，在学号/姓名输入框录入数据 | 输入框应更新 `formStudentId/formName`，点击添加应调用 `user.addStudent` | WXML 原先绑定到不存在的 `stStudentId/stName/onStIdInput/onStNameInput`，会导致表单数据无法进入提交逻辑 | `Component "pages/data-import/data-import" does not have a method "onStIdInput" to handle event "change"` | 已修复 WXML 绑定，并通过 WXML 组件检查和 JS 语法检查；需重新编译后人工点添加复核 | 否 |
| 3 | 我的页未绑定用户空白 | 另一个微信号进入 `pages/profile/profile`，该 openid 尚未绑定学生 | 应显示学号输入框和绑定登录按钮 | 页面没有进入 `needsBind=true` 状态，导致内容区为空 | 待用户补充真机控制台；代码定位为登录 behavior 未处理 `checkLogin()` 返回 `null` | 已修复 `behaviors/login.js` 和 `pages/profile/profile.js`，通过 JS 语法检查；需要重新预览二维码后复测 | 是 |
| 4 | 绑定成功后仍停留在绑定表单 | 输入已预置的 12 位测试学号并绑定成功 | 绑定成功后应显示匿名成员信息和常用入口 | Toast 显示绑定成功，但页面状态未切换 | 无需新增后端日志；代码定位为 `this._loginChecked=false` 未修改 data 字段 | 已改为绑定成功后直接调用 `onLoginSuccess(userInfo)`，通过 JS 语法检查；需重新编译/预览后复测 | 是 |

## 验收结论

| 项目 | 结果 | 备注 |
|------|------|------|
| 三条主链路是否全部通过 | 未执行 | 测试数据已准备完成，下一步执行主链路 |
| 是否存在业务阻断问题 | 暂无新增阻断 | 原测试数据不足已解除；仍需实操验证扫码出库、审批、预约冲突 |
| 是否需要修复后重新回归 | 否 | 当前进入真实业务流程回归即可 |
| 是否进入 deprecated 兼容入口清理 | 否 | 主链路未通过前不进入清理 |
| 是否进入下一轮 UI/UX 精修 | 否 | 主链路未通过前不进入 UI/UX 精修 |

结论填写规则：

- 三条主链路全部通过，且无业务阻断问题：底层重构主链路通过。
- 任一主链路失败：暂停扩展验收，先修阻断 bug。
- 仅存在非阻断 UI/UX 问题：记录问题，后续进入 UI/UX 精修。
