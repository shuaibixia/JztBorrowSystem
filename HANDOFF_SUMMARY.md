# 项目交接摘要

本文档用于上下文丢失后快速恢复工作状态。后续 AI 或工程师接手时，应先读 `AGENTS.md`、`IMPLEMENTATION_PLAN.md`，再读本文件。

## 当前状态

- 项目路径：`/Users/piphanye/WeChatProjects/miniprogram-1`
- 项目类型：原生微信小程序 + 微信云开发 + TDesign Mini Program。
- 云环境 ID：`studentpress-d6gj8ugww75193e6d`
- 当前重点：底层重构已完成，正在做上线前真实环境验收。
- 不需要继续扩大底层重构范围，除非验收发现阻断问题。
- UI 已做过核心页面首轮收敛，但还没有完成完整人工视觉验收。
- CloudBase CLI 已临时安装在 `/tmp/codex-cloudbase-cli`，版本为 `3.5.9`；运行时需要把 bundled Node 加入 `PATH`。
- 2026-07-03 已使用 CloudBase CLI 成功重新部署 `equipment` 云函数。
- 6 个二维码测试器材已写入云端并通过 `equipment.getByQR` 验证：`相机 1`、`相机 2`、`相机 3`、`镜头 1`、`镜头 2`、`镜头 3`。

## 已完成的重构块

`IMPLEMENTATION_PLAN.md` 中 Block 0 到 Block 6 均已完成：

- Block 0：写入分块执行计划。
- Block 1：设备状态机与统一 checkout/return 入口。
- Block 2：confirmed 预约与库存强绑定。
- Block 3：设备编号唯一性与计数器生成 `qrCode`。
- Block 4：迁移、部署与兼容文档收尾。
- Block 5：核心页面 UI/UX 首轮收敛。
- Block 6：测试与回归检查基线。

## 后端职责边界

云函数职责已经拆开，后续不要再混回去：

- `user`：用户、学生绑定、成员管理、学生导入、初始化管理员。
- `equipment`：器材 CRUD、二维码、库存统计、批量导入。
- `record`：出库、归还、借还记录、逾期记录。
- `approval`：借用审批创建、列表、详情、批准、拒绝。
- `reservation`：预约创建、列表、详情、取消、确认。
- `maintenance`：维修/保养日志。
- `stats`：管理员统计面板。
- `migration`：超管 dryRun/apply 数据迁移。
- `notification`：通知与逾期检查。

旧兼容 action 暂时保留，但新代码不得调用：

- `approval.createReservation`
- `approval.listReservations`
- `approval.getMyReservations`
- `approval.cancelReservation`
- `approval.confirmReservation`
- `approval.getReservationById`
- `record.getStats`
- `record.addMaintenance`
- `record.getMaintenance`

## 数据模型决策

Canonical 字段：

- `equipment.qrCode`，不是 `qr_code`。
- `equipment.currentHolder`，不是 `checkedOutBy`。
- `equipment.checkedOutAt` 表示当前借出时间。
- `approvals.requesterId/requesterOpenId/requesterName`。
- `approvals.approverId/approverOpenId`。
- 借还记录继续放在 `records`。
- 维保记录放在 `maintenanceLogs`，不再混进 `records`。
- `reservations.startDate/endDate` 使用 Date 值。

迁移函数仍会读取旧字段，这是预期行为；不要把这些读取误判为新写入。

## 已验证的本地检查

使用 Codex bundled Node：

`/Users/piphanye/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node`

已通过：

- `node tests/domain.test.js`
- `node scripts/check-syntax.js`
- `node scripts/check-wxml-components.js`
- `node scripts/check-compat-scan.js`
- `node scripts/check-function-lists.js`
- JSON 解析：`app.json`、`package.json`、`project.config.json`

`package.json` 中也有：

- `npm test`
- `npm run check:syntax`
- `npm run check:wxml`
- `npm run check:compat`
- `npm run check:functions`
- `npm run check:all`

如果全局 `node/npm` 不可用，使用上面的 bundled Node 逐个执行脚本。

## 已修复的渲染阻断问题

之前“编译不出画面”的主要风险来自 WXML 中使用了未注册或不存在的 TDesign 组件。

已处理：

- 补齐多个页面和组件 JSON 中缺失的 TDesign 组件注册。
- 移除不存在的 `<t-action-sheet-item>`。
- 新增 `scripts/check-wxml-components.js` 防止 WXML 组件注册再次遗漏。

微信开发者工具当前能渲染首页；日志中 `Lazy code loading`、`wx.getSystemInfoSync is deprecated` 属于警告，不是白屏主因。

## 云函数部署状态

已通过微信开发者工具 CLI 部署或更新过以下云函数：

- `reservation`
- `maintenance`
- `stats`
- `migration`
- `approval`
- `record`
- `equipment`
- `user`
- `notification`

已确认云端存在并处于 `Active` 的函数：

- `approval`
- `record`
- `equipment`
- `user`
- `notification`
- `reservation`
- `maintenance`
- `stats`
- `migration`

注意：微信开发者工具 CLI 直接部署带 `_shared` 子目录的函数时，曾出现目录读取问题。因此部署时使用过临时扁平包：

- 把 `cloudfunctions/<fn>/_shared/*.js` 拷贝到函数根目录。
- 只在临时包中把 `require('./_shared/config')` 改成 `require('./config')`。
- 不修改仓库源码的 `_shared` 结构。

曾经出现过一次临时包替换错误，把 `require('./_shared/config')` 错替换成 `require('./')`，导致 `migration` 云函数 `145 code exit unexpected`。该问题已经修复，并重新部署了 `migration`。

## Node 运行时情况

云端部分新函数可能显示为：

- `Nodejs16.13`
- timeout `3s`

如果控制台只能选 Node 16，则继续使用 `Nodejs16.13`，不需要为了 Node 18 新建函数。

更重要的是超时时间：

- 能改 timeout 时，建议 `migration` 设置为 `20s`。
- 如果不能改 timeout，也可以继续尝试；当前 dryRun 已经成功过。

## migration 当前结果

用户已在微信开发者工具控制台执行：

```js
wx.cloud.callFunction({ name: 'migration', data: { action: 'dryRun' } })
  .then(r => console.log('MIGRATION_DRYRUN', JSON.stringify(r.result, null, 2)))
  .catch(e => console.error('MIGRATION_DRYRUN_ERROR', e))
```

最终成功结果：

```json
{
  "code": 0,
  "data": {
    "summary": {
      "hasPendingMigration": false,
      "totalPending": 0,
      "legacyFieldsArePreserved": true
    },
    "counts": {
      "pending": {
        "equipmentQrCodeBackfill": 0,
        "approvalFieldNormalize": 0,
        "maintenanceRecordsMove": 0
      },
      "legacyRetained": {
        "equipmentQrCodeLegacyField": 1,
        "approvalLegacyFields": 0,
        "maintenanceRecordsInRecords": 0
      }
    },
    "risks": []
  }
}
```

结论：

- 不需要执行 `migration.apply`。
- `hasPendingMigration=false`。
- `totalPending=0`。
- `risks=[]`。
- 只剩 1 条设备保留旧字段 `qr_code`，但 canonical 字段已经满足当前代码需要；旧字段保留不是失败。

## 当前下一步

下一步应进入真实业务流程回归，不是继续迁移。

当前测试数据已经补齐：

- 管理员：`admin` / `superadmin` / 实际 openid 已脱敏
- 普通学生：匿名测试成员 / 实际学号已脱敏
- 可用测试器材：
  - `相机 1` / `qrCode=相机 1` / `SN=CAM-001`
  - `相机 2` / `qrCode=相机 2` / `SN=CAM-002`
  - `相机 3` / `qrCode=相机 3` / `SN=CAM-003`
  - `镜头 1` / `qrCode=镜头 1` / `SN=LEN-001`
  - `镜头 2` / `qrCode=镜头 2` / `SN=LEN-002`
  - `镜头 3` / `qrCode=镜头 3` / `SN=LEN-003`

注意：这批二维码是用户网页临时生成的中文内容二维码，适合当前测试；正式上线建议改为稳定编号格式，如 `EQ-CAM-001`。

优先验证三条主链路：

1. 管理员扫码出库 -> 设备变为借出 -> 生成 active record。
2. 持有人或管理员归还 -> 设备变为可用 -> record 变为 returned。
3. confirmed 预约窗口内 -> 管理员即时出库被阻止。

然后验证完整流程：

- 学生绑定学号。
- 查看器材列表和详情。
- 学生提交借用申请。
- 管理员审批通过。
- 管理员审批拒绝。
- 创建预约。
- 取消预约。
- 管理员确认预约。
- 添加维修记录。
- 查看统计页。

如果主链路失败，先修阻断 bug。
如果只是视觉体验问题，记录到下一轮 UI/UX 精修，不要打断业务验收。

## 微信开发者工具控制台常用命令

重新执行 dryRun：

```js
wx.cloud.callFunction({ name: 'migration', data: { action: 'dryRun' } })
  .then(r => console.log('MIGRATION_DRYRUN', JSON.stringify(r.result, null, 2)))
  .catch(e => console.error('MIGRATION_DRYRUN_ERROR', e))
```

只有 dryRun 出现 pending 且无 blocker risk 时，才考虑 apply：

```js
wx.cloud.callFunction({ name: 'migration', data: { action: 'apply' } })
  .then(r => console.log('MIGRATION_APPLY', JSON.stringify(r.result, null, 2)))
  .catch(e => console.error('MIGRATION_APPLY_ERROR', e))
```

当前状态下不要执行 apply，因为 dryRun 已显示无需迁移。

## 后续清理任务

完成真实部署和人工验收后，可单独开清理块：

- 移除 deprecated 兼容 action。
- 扫描并确认前端没有调用旧入口。
- 视情况清理历史旧字段，例如 `qr_code`。
- 继续 UI/UX 精修，重点检查移动端首屏、文字溢出、按钮密度、空状态、loading 状态和错误恢复。

## 重要约束

- 不要重新发明 UI 组件；页面改动优先使用 TDesign Mini Program。
- 页面/UI 改动必须遵守 `AGENTS.md` 的 `UI/UX Implementation Rules`。
- 不引入 TypeScript 或大型框架。
- 不把 reservation 逻辑塞回 `approval`。
- 不把 maintenance/stats 逻辑塞回 `record`。
- 没有 `.git` 仓库时，不要假设可以 git rollback。
