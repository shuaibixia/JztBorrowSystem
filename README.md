# 摄影器材管理小程序

学生社团摄影器材的扫码出入库、借用记录、审批管理小程序。基于微信小程序 + 云开发 + TDesign 组件库。

面向两类用户：**学生**（扫码借还、查看记录、预约器材）和 **管理员**（审批管理、成员管理、数据统计、器材录入）。

---

## 技术栈

- 微信小程序原生框架
- 微信云开发（云函数 + 云数据库 + 云存储）
- TDesign Miniprogram 组件库
- CSS 变量驱动主题（light/dark 双主题，跟随系统自动切换）

---

## 项目结构

```
miniprogram-1/
├── app.js                    # 小程序入口，初始化云环境
├── app.json                  # 全局配置：页面路由、tabBar、组件注册
├── app.wxss                  # 全局样式：CSS 变量 + TDesign 主题 + 公共工具类
├── theme.json                # 微信主题配置（light/dark 导航栏文字颜色）
├── cloudbaserc.json          # 云开发环境配置
├── project.config.json       # 微信开发者工具项目配置
├── sitemap.json              # 小程序搜索索引配置
│
├── cloudfunctions/           # 云函数（后端逻辑）
│   ├── user/                 # 用户相关：学号绑定、个人信息、成员管理
│   ├── equipment/            # 器材相关：增删改查、二维码、库存统计
│   ├── record/               # 借还记录：扫码出库、归还、记录查询
│   ├── approval/             # 审批流程：申请、审批、列表
│   ├── reservation/          # 预约管理：创建、确认、取消、查询
│   ├── maintenance/          # 维保日志：维修/保养记录
│   ├── stats/                # 管理员统计面板
│   ├── migration/            # 数据字段迁移：dryRun/apply
│   └── notification/         # 通知系统：发送、已读、计数
│
├── utils/                    # 工具函数层（客户端调用云函数的封装）
│   ├── cloud.js              # 云函数调用封装（统一错误处理）
│   ├── auth.js               # 登录认证：checkLogin、bindStudentId、getStats
│   ├── equipment-service.js  # 器材服务：CRUD + 出入库
│   ├── record-service.js     # 记录服务：查询借还记录
│   ├── approval-service.js   # 审批服务：提交申请、审批操作
│   ├── notification-service.js # 通知服务：获取通知、标记已读
│   ├── reservation-service.js  # 预约服务：创建/取消预约
│   ├── member-service.js     # 成员管理服务：列表、改角色、启禁用
│   ├── stats-service.js      # 统计/维保服务：管理员数据面板 + 维修记录
│   ├── migration-service.js  # 数据迁移服务：dryRun/apply
│   ├── constants.js          # 常量定义：角色列表
│   └── util.js               # 通用工具：formatDate、isAdmin
│
├── behaviors/                # 可复用行为（Mixin）
│   ├── login.js              # 登录检查 behavior，页面 mixin 后自动检查登录态
│   ├── admin-guard.js        # 管理员守卫 behavior，非管理员自动拦截
│   └── pagination.js         # 分页加载 behavior，下拉刷新 + 上拉加载更多
│
├── components/               # 自定义组件
│   ├── equipment-card/       # 器材卡片（列表页中展示单个器材）
│   ├── approval-card/        # 审批卡片（审批列表中展示单条审批）
│   ├── reservation-card/     # 预约卡片（预约列表中展示单条预约）
│   ├── status-tag/           # 状态标签（统一的状态/角色标签样式）
│   ├── pull-down-list/       # 下拉选择列表组件
│   ├── qr-display/           # 二维码展示组件
│   ├── list-footer/          # 列表底部组件（loading + 空状态 + 没有更多）
│   └── trd-privacy/          # 第三方隐私协议组件
│
├── custom-tab-bar/           # 自定义底部导航栏
│   ├── index.js              # Tab 切换逻辑 + 主题监听（wx.onThemeChange）
│   ├── index.json            # 注册 t-tab-bar 组件
│   ├── index.wxml            # 四个 tab 项：首页、记录、扫码、我的
│   └── index.wxss            # 平面导航栏样式与深色模式适配
│
├── styles/                   # 公共样式（已内联到 app.wxss，保留源文件供参考）
│   ├── theme.wxss            # 设计变量定义（颜色、间距、圆角、字号）
│   └── card.wxss             # 公共卡片/容器样式类
│
└── pages/                    # 页面（19 个业务页面）
    ├── index/                # 首页：我的借出记录、器材统计、搜索入口、管理员 FAB
    ├── scan/                 # 扫码页：调用微信扫码识别器材二维码
    ├── scan-result/          # 扫码结果：器材信息 + 出库/入库/归还操作
    ├── profile/              # 我的：学号绑定登录、个人信息、统计、常用功能 + 管理功能菜单
    ├── equipment-list/       # 器材列表：全部器材浏览、搜索、筛选
    ├── equipment-detail/     # 器材详情：基本信息、借还记录、操作按钮
    ├── equipment-edit/       # 器材编辑：新增/修改器材信息（管理员）
    ├── record-list/          # 借还记录：我的记录列表
    ├── approval-list/        # 审批列表：待审批/已审批（管理员）
    ├── approval-detail/      # 审批详情：查看申请信息、批准/拒绝操作
    ├── member-list/          # 成员管理：查看成员、修改角色、启禁用（管理员）
    ├── admin-stats/          # 数据统计：器材使用率、借还趋势（管理员）
    ├── notification-center/  # 通知中心：系统通知列表、标记已读
    ├── maintenance-log/      # 维护日志：器材维修/保养记录
    ├── reservation-create/   # 创建预约：选择器材、时间段、填写用途
    ├── reservation-list/     # 预约列表：我的预约、取消预约
    ├── reservation-detail/   # 预约详情：查看预约信息、取消预约
    ├── data-import/          # 数据管理：录入学生信息（单条/批量 JSON 导入）
    └── admin-setup/          # 管理员初始化：输入激活码设置超级管理员
```

---

## 云函数详情

### `cloudfunctions/user/` — 用户管理

| action | 参数 | 说明 | 返回 |
|--------|------|------|------|
| `bindStudentId` | `studentId` (12位数字) | 绑定学号，从 students 集合同步姓名和照片 | 用户对象 |
| `getProfile` | 无 | 根据 openid 获取当前用户信息 | 用户对象或 null |
| `updateProfile` | `nickName?, avatarUrl?, phone?` | 更新用户资料 | 用户对象 |
| `getStats` | 无 | 获取当前用户的借用统计 | {totalCheckouts, activeCount, overdueCount} |
| `listMembers` | `page, pageSize, keyword?, role?` | 管理员查看成员列表 | {list, total, page, pageSize} |
| `updateRole` | `userId, role` | 超级管理员修改成员角色 | - |
| `toggleActive` | `userId` | 管理员启用/禁用成员 | {isActive} |
| `addStudent` | `studentId, name, photo?` | 管理员单条添加学生 | {_id} |
| `batchImportStudents` | `list` (数组) | 管理员批量导入学生 | {success, failed, errors} |
| `listStudents` | `page, pageSize, keyword?` | 管理员查看学生列表 | {list, total, page, pageSize} |

**users 集合字段**：`_openid`, `studentId`, `studentName`, `studentPhoto`, `role`, `department`, `phone`, `isActive`, `createdAt`, `updatedAt`

**students 集合字段**（管理员预录入）：`studentId`, `name`, `photo`, `createdAt`

### `cloudfunctions/equipment/` — 器材管理

| action | 说明 |
|--------|------|
| `getByQR` | 根据二维码查询器材 |
| `list` | 器材列表（支持分页、搜索、分类筛选） |
| `getById` | 获取单个器材详情 |
| `create` | 新增器材（管理员） |
| `update` | 修改器材信息（管理员） |
| `delete` | 删除器材（管理员） |
| `uploadImage` | 更新器材图片 |
| `getQrData` | 获取二维码展示数据 |
| `getStats` | 获取器材库存统计 |
| `batchImport` | 批量导入器材 |

**equipment 集合字段**：`name`, `category`, `brand`, `model`, `serialNumber`, `qrCode`, `imageUrl`, `location`, `status`, `currentHolder`, `checkedOutAt`, `condition`, `description`, `createdAt`, `updatedAt`

### `cloudfunctions/record/` — 借还记录

| action | 说明 |
|--------|------|
| `checkout` | 出库（器材状态变为借出） |
| `returnEquipment` | 归还（器材状态恢复可用） |
| `getMyRecords` | 查询当前用户借还记录 |
| `getByEquipment` | 查询单个器材的借还记录 |
| `getActive` | 查询借出中记录 |
| `getOverdue` | 查询逾期记录 |
| `getStats` | deprecated：转发到 `stats.getAdminStats` |
| `addMaintenance` | deprecated：转发到 `maintenance.add` |
| `getMaintenance` | deprecated：转发到 `maintenance.listByEquipment` |

**records 集合字段**：`equipmentId`, `equipmentName`, `userId`, `userOpenId`, `userName`, `purpose`, `status` (active/returned/overdue), `checkoutAt`, `expectedReturnAt`, `returnAt`, `condition_before`, `condition_after`, `remark`, `createdAt`, `updatedAt`

### `cloudfunctions/approval/` — 审批流程

| action | 说明 |
|--------|------|
| `create` | 提交借用审批申请 |
| `list` | 审批列表（支持按状态、申请人筛选） |
| `getById` | 审批详情 |
| `approve` | 批准申请（自动创建借出记录） |
| `reject` | 拒绝申请 |
| `createReservation/listReservations/getMyReservations/cancelReservation/confirmReservation/getReservationById` | deprecated：转发到 `reservation` 云函数 |

**approvals 集合字段**：`type`, `equipmentId`, `equipmentName`, `requesterId`, `requesterOpenId`, `requesterName`, `purpose`, `expectedReturnAt`, `status` (pending/approved/rejected), `approverId`, `approverOpenId`, `reviewedAt`, `createdAt`, `updatedAt`

### `cloudfunctions/reservation/` — 预约管理

| action | 说明 |
|--------|------|
| `create` | 创建预约，检查时间冲突 |
| `list` | 查询预约列表，管理员可看全部，普通用户仅看自己 |
| `getMy` | 查询当前用户预约 |
| `getById` | 查询预约详情 |
| `cancel` | 取消预约 |
| `confirm` | 管理员确认预约 |

**reservations 集合字段**：`equipmentId`, `equipmentName`, `userId`, `userOpenId`, `userName`, `startDate`, `endDate`, `purpose`, `status`, `createdAt`, `updatedAt`

### `cloudfunctions/maintenance/` — 维保日志

| action | 说明 |
|--------|------|
| `add` | 管理员添加维修/保养记录 |
| `listByEquipment` | 查询器材维保记录 |

**maintenanceLogs 集合字段**：`equipmentId`, `equipmentName`, `userId`, `userOpenId`, `userName`, `maintenanceType`, `description`, `cost`, `technician`, `partsReplaced`, `createdAt`, `updatedAt`

### `cloudfunctions/stats/` — 管理统计

| action | 说明 |
|--------|------|
| `getAdminStats` | 管理员统计面板数据 |

### `cloudfunctions/migration/` — 数据迁移

| action | 说明 |
|--------|------|
| `dryRun` | 超级管理员预检待迁移数据 |
| `apply` | 超级管理员执行字段迁移和维保记录复制 |

`dryRun` 返回 `summary`、`counts`、`risks`、`batches`、`nextSteps`：

- `counts.pending` 表示还需要自动补齐或复制的数据。
- `counts.legacyRetained` 表示旧字段或旧记录仍存在但会被保留，不代表迁移失败。
- `risks` 会提示重复 `qrCode`、重复非空 `serialNumber`、缺失二维码且无旧字段可回填、已复制过的维保记录等情况。

`apply` 返回 `before`、`result`、`remaining`、`risks`、`appliedAt`、`appliedBy`。重复执行应保持幂等：已补齐字段不会重复写入，已复制的维保记录不会重复生成。迁移不会删除 `qr_code`、`applicantOpenId`、`reviewerOpenId` 等旧字段。

### `cloudfunctions/notification/` — 通知系统

| action | 说明 |
|--------|------|
| `list` | 获取当前用户通知列表 |
| `markRead` | 标记单条通知已读 |
| `markAllRead` | 全部标记已读 |
| `getUnreadCount` | 获取未读通知数量 |

**notifications 集合字段**：`userOpenId`, `title`, `content`, `type`, `isRead`, `relatedId`, `createdAt`

### `cloudfunctions/admin-web/` — 管理网站 HTTP 网关

该函数为独立管理网站预留，不属于小程序 `wx.cloud.callFunction` 入口。它只接受 `Authorization: Bearer <opaque-session-token>`，并在每次请求时复查网站绑定、`users` 中的启用状态和 `admin/superadmin` 角色。浏览器不得提交或指定小程序 `OPENID`、`__compatOpenId`。

当前源码还实现了受控器材、成员和学生写接口：器材新增/编辑/退役/导入/单图上传，学生录入/导入，以及成员启停和仅超管可用的角色调整。业务工作台还包括指定成员出库、代归还、审批通过/拒绝、预约确认/取消和维保登记；运营端包含全局通知、仅超管可见的审计与有限系统诊断。它们复用器材编号、借还记录构造、状态转换与预约冲突规则，不允许直接修改借还、审批或预约状态。OAuth、会话签发、云端集合和部署均尚未执行。完整接口见 `web-admin/API_CONTRACT.md`。

---

## 工具函数层详情

### `utils/cloud.js` — 云函数调用封装

所有云函数调用的底层封装。统一处理错误码，非 0 code 自动 reject。

### `utils/auth.js` — 登录认证

| 函数 | 说明 |
|------|------|
| `checkLogin()` | 检查登录态：先查 globalData 缓存，再调云函数 getProfile |
| `bindStudentId(studentId)` | 绑定学号登录，调云函数 bindStudentId |
| `getStats()` | 获取当前用户借用统计 |

### `utils/equipment-service.js` — 器材服务

封装 `equipment` 云函数的各个 action，页面直接调用即可。

### 其他 service 文件同理

每个 service 文件都是对应云函数的客户端封装，统一命名：`getXxx` / `createXxx` / `updateXxx` / `deleteXxx`。

---

## 行为（Behaviors）详情

### `behaviors/login.js` — 登录检查

页面 mixin 后，`attached` 阶段自动调用 `checkLogin()`。登录成功后设置 `userInfo` 和 `isLoggedIn`，并调用页面的 `onLoginSuccess(userInfo)` 回调。

### `behaviors/admin-guard.js` — 管理员守卫

页面 mixin 后，`attached` 阶段检查登录态 + 管理员权限。非管理员弹 toast 并返回。通过后调用页面的 `onAdminReady()` 回调。

### `behaviors/pagination.js` — 分页加载

提供通用的分页逻辑：`_loadPage(reset)` / `onReachBottom()` / `onPullDownRefresh()`。页面只需实现 `_fetchPage(page, pageSize)` 返回数据即可。

---

## 页面详情

### TabBar 页面（底部导航）

| 页面 | 路径 | 说明 |
|------|------|------|
| 首页 | `pages/index/index` | 我的借出记录（优先展示）、器材统计卡片、搜索入口、管理员 FAB 按钮 |
| 扫码 | `pages/scan/scan` | 调用 `wx.scanCode` 扫描器材二维码，跳转扫码结果页 |
| 我的 | `pages/profile/profile` | 学号绑定登录、个人信息、借用统计、功能菜单入口 |

### 器材相关

| 页面 | 路径 | 说明 |
|------|------|------|
| 器材列表 | `pages/equipment-list/equipment-list` | 全部器材浏览，支持搜索和分类筛选 |
| 器材详情 | `pages/equipment-detail/equipment-detail` | 器材完整信息、借还记录、出库/入库/归还按钮 |
| 器材编辑 | `pages/equipment-edit/equipment-edit` | 新增或修改器材信息（管理员） |
| 扫码结果 | `pages/scan-result/scan-result` | 扫码后展示器材信息，提供出库/入库/归还操作 |

### 借还相关

| 页面 | 路径 | 说明 |
|------|------|------|
| 借还记录 | `pages/record-list/record-list` | 当前用户的借还记录列表 |
| 审批列表 | `pages/approval-list/approval-list` | 待审批/已审批列表（管理员） |
| 审批详情 | `pages/approval-detail/approval-detail` | 单条审批详情，批准/拒绝操作 |

### 预约相关

| 页面 | 路径 | 说明 |
|------|------|------|
| 创建预约 | `pages/reservation-create/reservation-create` | 选择时间段、填写用途，提交预约 |
| 预约列表 | `pages/reservation-list/reservation-list` | 我的预约列表，支持取消 |
| 预约详情 | `pages/reservation-detail/reservation-detail` | 预约完整信息，支持取消预约 |

### 管理功能

| 页面 | 路径 | 说明 |
|------|------|------|
| 成员管理 | `pages/member-list/member-list` | 查看成员列表、修改角色、启禁用 |
| 数据统计 | `pages/admin-stats/admin-stats` | 器材使用率、借还趋势图表 |
| 维护日志 | `pages/maintenance-log/maintenance-log` | 器材维修/保养记录 |
| 通知中心 | `pages/notification-center/notification-center` | 系统通知列表、标记已读 |
| 数据管理 | `pages/data-import/data-import` | 录入学生信息：单条录入、批量 JSON 导入、查看列表 |
| 管理员初始化 | `pages/admin-setup/admin-setup` | 输入激活码设置超级管理员（首次部署时使用） |

---

## 登录流程

```
用户打开小程序
  → 静默获取微信 openid（无需用户操作）
  → 调用 checkLogin() 查询 users 表
    → 已绑定 studentId → 自动登录，显示个人信息
    → 未绑定 / 无记录 → 显示学号输入框
      → 用户输入 12 位学号
      → 调用 bindStudentId() → 查询 students 集合
        → 学号存在 → 绑定成功，同步姓名和记者证照片
        → 学号不存在 → 提示"请联系管理员录入信息"

首次部署管理员初始化：
  → 打开 admin-setup 页面
  → 输入激活码 + 管理员姓名
  → 系统自动创建超管账号
```

---

## 部署与迁移顺序

不要直接执行真实迁移。推荐顺序：

1. 执行 `npm run sync:cloud-shared` 同步云函数共享模块。
2. 先部署新增云函数：`reservation`、`maintenance`、`stats`、`migration`。
3. 再部署更新过的云函数：`approval`、`record`、`equipment`、`user`、`notification`。
4. 使用超级管理员调用 `migration.dryRun`。
5. 人工检查 `counts.pending`、`risks` 和 `nextSteps`。
6. 确认无阻断风险后再调用 `migration.apply`。
7. 再次调用 `migration.dryRun`，确认 pending 数据已清零或只剩人工处理项。

`admin-web` 不属于上述小程序重构部署序列。它只能在网站 OAuth、HTTPS 回调域名、`WEB_ADMIN_ALLOWED_ORIGINS`、会话集合和管理员绑定完成后，单独部署。

兼容入口暂时保留一个上线验证周期。完成一次真实部署、迁移 dryRun/apply 验证、并确认前端不再调用旧入口后，再在后续清理任务移除 deprecated action。

---

## 本地验证与回归检查

推荐在修改后执行：

```sh
npm run check:all
```

等价拆分命令：

```sh
npm test
npm run check:syntax
npm run check:wxml
npm run check:compat
npm run check:functions
```

如果本机全局 `npm` 不可用，可直接使用 Node 执行：

```sh
node tests/domain.test.js
node scripts/check-syntax.js
node scripts/check-compat-scan.js
node scripts/check-function-lists.js
```

检查目标：

- 领域规则测试覆盖状态机、权限、预约冲突、预约完成匹配、编号生成和迁移计划风险。
- JS 语法检查覆盖 `cloudfunctions/pages/utils/behaviors/components/custom-tab-bar/tests/scripts`。
- 兼容扫描禁止页面或 service 重新调用 deprecated action。
- 旧字段写入检查禁止新代码写回 `qr_code`、`applicantOpenId`、`reviewerOpenId`。
- 云函数清单检查保证目录、`cloudbaserc.json`、部署脚本和 shared 同步脚本一致。
- GitHub Actions 会在每次 push 和 pull request 时运行以上小程序检查，并构建 `web-admin`。

---

## 数据库集合总览

| 集合 | 用途 | 关键字段 |
|------|------|----------|
| `users` | 用户信息 | `_openid`, `studentId`, `studentName`, `studentPhoto`, `role` |
| `students` | 学生信息（管理员预录入） | `studentId`, `name`, `photo` |
| `equipment` | 器材信息 | `name`, `qrCode`, `status`, `category`, `location`, `currentHolder` |
| `records` | 借还记录 | `equipmentId`, `userOpenId`, `status`, `checkoutAt` |
| `approvals` | 审批记录 | `equipmentId`, `requesterOpenId`, `approverOpenId`, `status` |
| `notifications` | 通知 | `userOpenId`, `title`, `isRead`, `type` |
| `reservations` | 预约 | `equipmentId`, `userOpenId`, `startDate`, `endDate`, `status` |
| `maintenanceLogs` | 维保日志 | `equipmentId`, `maintenanceType`, `cost`, `createdAt` |

---

## 角色权限

| 角色 | 权限 |
|------|------|
| `member` | 扫码借还、查看记录、预约器材 |
| `admin` | 以上 + 审批管理、成员管理、数据统计、器材编辑 |
| `superadmin` | 以上 + 修改成员角色 |

---

## 样式系统

所有设计变量在 `app.wxss` 的 `page {}` 中定义，通过 CSS 变量引用：

| 变量 | 用途 | 示例值 |
|------|------|--------|
| `--app-primary` | 主色调 | 跟随 TDesign 品牌色 |
| `--app-card-radius` | 卡片圆角 | 18rpx |
| `--app-side-margin` | 页面左右边距 | 32rpx |
| `--app-gap` | 卡片间距 | 24rpx |
| `--app-font-xl` | 大标题字号 | 36rpx |

换主题只需修改这些变量，全站生效。

### 深色模式

- `app.json` 设置 `"darkmode": true` 启用微信原生深色模式
- `theme.json` 定义 light/dark 两套主题变量（导航栏文字颜色、tabBar 背景色等）
- `app.wxss` 通过 `@media (prefers-color-scheme: dark)` 切换 TDesign CSS 变量
- 自定义组件需设置 `options.addGlobalClass: true` 才能继承页面级 CSS 变量
- 自定义 tabBar 通过 `wx.onThemeChange` 监听主题变化，动态更新样式

---

## 常见问题排查

| 问题 | 排查方向 |
|------|----------|
| 页面空白 | 检查对应 .json 的 `usingComponents` 是否注册了所有用到的组件 |
| 云函数报错 | 检查云函数是否已部署（右键云函数目录 → 上传并部署） |
| 登录后无数据 | 检查 `students` 集合是否已录入该学号 |
| 样式不生效 | 检查 CSS 变量名是否拼写正确，参考 `app.wxss` 中的定义 |
| 组件不显示 | 检查组件路径是否正确，TDesign 组件路径格式：`tdesign-miniprogram/组件名/组件名` |
| 器材新增报 E11000 | equipment 集合存在旧的 `qr` 唯一索引，需在云控制台删除该索引 |
| 深色模式 tabBar 白底 | 确认 `app.json` 设置了 `"darkmode": true`，`theme.json` 定义了 `tabBgColor` |
| 自定义组件样式不跟随主题 | 组件需设置 `options.addGlobalClass: true` |
