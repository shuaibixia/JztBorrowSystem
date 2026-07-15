# AI Handoff Notes

This file is for future AI agents or engineers working on this WeChat Mini Program. Read it before making changes.

## Project Purpose

This is a photography equipment management mini program for a student organization. It supports:

- Student login by binding a 12-digit student ID.
- Equipment browsing, QR scan checkout, return, and history.
- Borrow approval workflow for non-admin users.
- Reservation workflow.
- Admin member management, student/equipment import, maintenance logs, notifications, and stats.

The UI is not the priority right now. The current priority is keeping the backend boundaries and data model clean.

## Runtime And Style

- Framework: native WeChat Mini Program, CommonJS modules.
- Backend: WeChat Cloud Functions using `wx-server-sdk`.
- UI library: TDesign Miniprogram.
- Do not introduce TypeScript, build frameworks, or large new dependencies unless explicitly requested.
- Prefer small, explicit service wrappers in `utils/*-service.js`.
- Keep page JS focused on UI flow. Business operations should go through service modules.
- Use ASCII in new files unless existing file content clearly requires Chinese text.

## UI/UX Implementation Rules

本项目的小程序 UI/UX 必须以高质量微信生态应用为标准。后续任何页面或组件改动都必须先遵守本节，除非用户明确给出相反要求。

- 组件原则：优先使用既定组件库，例如 TDesign、WeUI、Vant；本项目默认优先使用 TDesign Mini Program。不要随意手写组件，不要重新发明已有 UI 控件。
- 页面规划：实现前必须先明确用户目标、主路径、次路径、信息层级和所有状态。
- 状态覆盖：页面和组件必须考虑正常、加载、空、错误、成功、提交中状态。
- 视觉风格：保持克制、清爽、专业，统一颜色、字号、间距、圆角、阴影和按钮样式。
- 视觉禁区：避免大面积渐变、花哨装饰、低对比度、过圆卡片和拥挤布局。
- 交互完整性：每个可点击元素必须有反馈；表单必须有校验、防重复提交和失败恢复；列表必须有刷新、分页、空状态和加载失败处理；危险操作必须二次确认。
- 移动端优先：重点检查文字溢出、点击区域过小、主按钮不可触达、弹窗遮挡、页面跳转过多等问题。
- 实现后自检：必须通过截图或预览检查移动端首屏是否清楚、主操作是否明显、状态是否完整、布局是否在常见手机尺寸下稳定。

## Current Backend Boundaries

Cloud functions are intentionally split by responsibility:

- `user`: student binding, profile, user stats, member management, student import, first admin setup.
- `equipment`: equipment CRUD, QR lookup/data, equipment stats, equipment batch import.
- `record`: checkout, return, personal records, active/overdue records, records by equipment.
- `approval`: borrow approval creation/list/detail/approve/reject only.
- `reservation`: reservation create/list/detail/cancel/confirm.
- `maintenance`: maintenance log add/list.
- `stats`: admin dashboard stats.
- `notification`: notifications, unread count, overdue checks.
- `migration`: superadmin-only data migration dry run/apply.
- `admin-web`: website-only HTTP gateway. It validates opaque web sessions and active administrator roles; it must never accept browser-supplied mini-program identity fields.

Do not put reservation logic back into `approval`.
Do not put maintenance or dashboard stats logic back into `record`.

## Compatibility Entrypoints

Some old actions are intentionally kept as compatibility forwarders for one transition period:

- `approval.createReservation`
- `approval.listReservations`
- `approval.getMyReservations`
- `approval.cancelReservation`
- `approval.confirmReservation`
- `approval.getReservationById`
- `record.getStats`
- `record.addMaintenance`
- `record.getMaintenance`

New code should not call these. New code should call:

- `reservation` cloud function via `utils/reservation-service.js`
- `maintenance` cloud function via `utils/stats-service.js`
- `stats` cloud function via `utils/stats-service.js`

## Data Model Decisions

Canonical fields:

- `equipment.qrCode`, not `qr_code`.
- `equipment.currentHolder`, not `checkedOutBy`.
- `equipment.checkedOutAt` for active checkout time.
- `approvals.requesterId/requesterOpenId/requesterName`.
- `approvals.approverId/approverOpenId`.
- Borrow/return records stay in `records`.
- Maintenance records belong in `maintenanceLogs`, not `records`.
- Reservation dates are stored as Date values in `reservations.startDate` and `reservations.endDate`.

The migration function still reads old fields such as `qr_code`, `applicantOpenId`, and `reviewerOpenId`. That is expected. Do not treat those reads as new writes.

## Shared Cloud Code

There is a source shared module directory:

- `cloudfunctions/_shared`

Each deployable cloud function also has a local vendored copy:

- `cloudfunctions/<function>/_shared`

Reason: WeChat cloud functions are commonly deployed per function directory, so cross-directory requires can fail after deployment.

If you edit `cloudfunctions/_shared`, run:

```sh
node scripts/sync-cloud-shared.js
```

`cloudfunctions/_shared/equipment-admin.js` is the canonical server-side helper for equipment QR allocation, counters initialization, SN/QR uniqueness checks and retirement. Both `equipment` and `admin-web` must use it for equipment writes.

`cloudfunctions/_shared/admin-web-operations.js` owns website-only controlled workflow operations. It must keep using the shared domain checkout/return builders, equipment state transitions and reservation conflict helpers; never add raw status-edit endpoints for records, approvals or reservations.

If global `node` is unavailable in Codex, use the bundled Node path from `load_workspace_dependencies`.

## Migration Workflow

Do not run data migration blindly.

Expected deployment sequence:

1. Sync shared modules: `npm run sync:cloud-shared`.
2. Deploy new functions: `reservation`, `maintenance`, `stats`, `migration`.
3. Deploy updated existing functions: `approval`, `record`, `equipment`, `user`, `notification`.
4. Call `migration.dryRun` as superadmin.
5. Review counts and risks.
6. Call `migration.apply` only after confirming dry-run output and only when `counts.pending` shows work to apply.

Migration behavior:

- Backfills missing `equipment.qrCode` from old `equipment.qr_code`.
- Normalizes old approval applicant/reviewer fields into requester/approver fields.
- Copies `records.type === "maintenance"` rows into `maintenanceLogs`.
- Does not delete old fields automatically.

`migration.dryRun` returns `summary`, `counts`, `risks`, `batches`, and `nextSteps`.
`counts.pending` is the data that still needs automatic migration.
`counts.legacyRetained` is expected old data that remains because old fields are not deleted.
`migration.apply` returns `before`, `result`, `remaining`, `risks`, `appliedAt`, and `appliedBy`, and must remain idempotent.

Compatibility actions should be removed only after one real deployment, successful migration verification, and a scan confirming frontend code no longer calls the deprecated actions. If `migration.dryRun` reports `hasPendingMigration=false`, `apply` is not required for that verification.

## Current Deployment And Migration Status

As of the latest handoff:

- Cloud environment: `studentpress-d6gj8ugww75193e6d`.
- The cloud functions `reservation`, `maintenance`, `stats`, `migration`, `approval`, `record`, `equipment`, `user`, and `notification` have been deployed or updated through WeChat DevTools CLI.
- `admin-web` exists only in source during the website build. It has not been deployed, has no configured OAuth credential or CORS origin, and must remain unavailable until the website-login block.
- Cloud functions are present and active in the cloud environment.
- Some functions may show `Nodejs16.13` and timeout `3s`. If Node 18 is unavailable in the console, keep Node 16; do not create replacement functions only for the runtime version. Prefer increasing `migration` timeout to `20s` if the console allows it.
- `migration.dryRun` has succeeded with `code=0`, `summary.hasPendingMigration=false`, `summary.totalPending=0`, and `risks=[]`.
- `migration.apply` should not be run in the current state because dryRun reports no pending migration.
- One retained legacy `equipment.qr_code` field may remain. This is expected because migration preserves old fields and code no longer depends on them.
- Next priority is real mini program workflow regression: checkout, return, approval, reservation conflict, maintenance, and stats.

Deployment note: WeChat DevTools CLI can fail when deploying function folders that include `_shared` subdirectories. A temporary flat deploy package was used when needed: copy each function's `_shared/*.js` files into that function's temporary root and rewrite temporary-only requires from `./_shared/<module>` to `./<module>`. Do not change the repository source layout for this workaround.

## Important Known Fixes Already Made

- `approval.reject` previously referenced an undefined `approval` variable. This is fixed.
- `approval.approve` now checks equipment availability before approving and again inside the transaction.
- `utils/cloud.js` now rejects malformed cloud function results with a clear error.
- `reservation-detail` now uses `reservation-service`, not `approval-service`, to fetch reservation details.
- New equipment writes no longer write `qr_code`.

## Validation Commands

If global Node is available:

```sh
npm test
npm run check:syntax
npm run check:wxml
npm run check:compat
npm run check:functions
npm run check:all
```

If global Node is not available, use the bundled Codex Node executable from `load_workspace_dependencies`.

Equivalent direct Node commands:

```sh
node tests/domain.test.js
node scripts/check-syntax.js
node scripts/check-wxml-components.js
node scripts/check-compat-scan.js
node scripts/check-function-lists.js
```

Expected result:

- No new service/page calls should use old compatibility actions.
- Deprecated compatibility action calls are allowed only in the compatibility forwarders.
- Legacy write-like keys such as `qr_code`, `applicantOpenId`, and `reviewerOpenId` are allowed only in migration code, tests, or documentation.
- Function lists must stay aligned across `cloudfunctions`, `cloudbaserc.json`, `package.json` deploy scripts, and `scripts/sync-cloud-shared.js`.

## Testing Coverage

Current tests are lightweight Node tests in:

- `tests/domain.test.js`
- `tests/admin-web.test.js`
- `tests/equipment-admin.test.js`
- `tests/admin-web-operations.test.js`

Covered:

- Role helpers.
- Equipment/approval/maintenance field normalization.
- Reservation time conflict logic.
- Migration plan counting.
- Equipment state transition and checkout/return record builders.
- Confirmed reservation checkout blocking and completion matching.
- Equipment QR code formatting/parsing and counter IDs.
- Website session-token parsing, hashing, path normalization, pagination bounds, role checks and CORS allowlist matching.
- Equipment category vocabulary and shared equipment-write error normalization.
- Website workflow-operation module availability; domain tests remain the source of truth for checkout/return and reservation invariants.

Before changing backend contracts, add or update tests in this area.

## Deployment Scripts

`package.json` includes deploy scripts for all cloud functions:

- `deploy:admin-web`
- `deploy:user`
- `deploy:equipment`
- `deploy:record`
- `deploy:approval`
- `deploy:notification`
- `deploy:reservation`
- `deploy:maintenance`
- `deploy:stats`
- `deploy:migration`
- `deploy:all`

Initial cloud deployment has been performed after the architecture refactor. Before any future deployment, verify credentials, cloud environment, function runtime/timeout, and whether the `_shared` flat-package workaround is still required.

## Constraints For Future Work

- There is no `.git` repository in this workspace at the time of writing. Do not assume git rollback is available.
- Make small patches and run syntax checks frequently.
- Do not overwrite user changes.
- Keep README and this file synchronized when backend boundaries or deployment steps change.
- Avoid UI redesign unless explicitly requested.
- Any future page or UI work must follow `UI/UX Implementation Rules` unless the user explicitly overrides them.
