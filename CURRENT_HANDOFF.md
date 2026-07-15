# Current Project Handoff

> Last updated: 2026-07-15
>
> Read `AGENTS.md` first. Then read this file before editing anything. This is the current-state override for the older `HANDOFF_SUMMARY.md` and for the preliminary OpenDesign implementation record.

## Project And Non-Negotiables

- Project root: `/Users/piphanye/WeChatProjects/miniprogram-1`.
- Stack: native WeChat Mini Program, CommonJS, WeChat Cloud Functions, TDesign Mini Program.
- Cloud environment: `studentpress-d6gj8ugww75193e6d`.
- There is no Git repository. Do not assume rollback is available and do not overwrite unrelated user changes.
- Do not add TypeScript, a web framework, a new UI library, or backend business changes for visual work.
- Keep page JS focused on UI state. Existing calls must continue through the current service modules.

## Active Admin Website Work

The user has explicitly started a separate desktop management website. This work is independent from the mini-program visual refinement and uses the same CloudBase environment without changing existing mini-program business contracts.

- Website source: `web-admin/`, built with React 18, Vite 4, JavaScript and Fluent UI React v9. Use `pnpm dev` or `pnpm build` from that directory.
- Block 0 is complete: the local mock-only desktop shell contains overview, equipment, records, approvals, reservations, maintenance, members, notifications and system pages. `web-admin/PRODUCT.md` and `web-admin/DESIGN.md` are the design contract.
- Block 1 is complete in source: `cloudfunctions/admin-web` is an HTTP gateway with read-only `/v1` endpoints and opaque Bearer-session verification. It does not use or accept mini-program OPENID / `__compatOpenId`.
- Block 2 is complete in source: equipment and member/student management endpoints were added to `admin-web`. `cloudfunctions/_shared/equipment-admin.js` now centralizes equipment QR allocation, counter initialization, uniqueness checks and retirement for both the mini-program and website paths.
- Block 3 is complete in source: `cloudfunctions/_shared/admin-web-operations.js` supplies controlled website workflows for selected-member checkout, return, approvals, reservations and maintenance. It reuses shared domain builders and reservation conflict rules rather than allowing raw lifecycle edits.
- Block 4 is complete in source: `admin-web` now has notifications, superadmin audit history and limited system diagnostics endpoints. The production web bundle is split into React, Fluent and application chunks. Desktop validation at 1024/1280/1440 remains manual pending.
- `admin-web` is registered in `cloudbaserc.json`, package deploy scripts and shared-module synchronization, but is **not deployed**. No web-admin collection, OAuth credential, session, origin allowlist or binding has been created.
- Read `ADMIN_WEB_IMPLEMENTATION_PLAN.md` and `web-admin/API_CONTRACT.md` before continuing. The next proposed website task is Block 5 (OAuth and deployment), but pause for the user to confirm each completed block.

## Backend And Workflow Status

The architecture refactor is complete and should not be reopened during the current UI work.

- Cloud functions are split by domain: `user`, `equipment`, `record`, `approval`, `reservation`, `maintenance`, `stats`, `notification`, and `migration`.
- `migration.dryRun` has returned `code=0`, `hasPendingMigration=false`, `totalPending=0`, and `risks=[]`.
- Do **not** run `migration.apply`; there is nothing pending to migrate.
- No cloud deployment, database changes, or migration are needed for the current visual task.

Based on the user's real-device/manual checks, the important business paths are working:

- Student binding works.
- Admin checkout -> return works.
- Borrow request -> admin approval works.
- Admin rejection works.
- Reservation creation, member cancellation, admin cancellation, and admin confirmation work.
- Confirmed reservations can block conflicting checkout.
- Admin proxy return works.
- A regular member cannot return equipment held by another member.

The remaining workflow checks are visual/mobile-size checks, not a reason to refactor the backend.

## Test Data And Accounts

- An anonymized regular-member account was used for testing; its live name and student ID are intentionally omitted from this public repository.
- Existing test equipment: `相机 1` through `相机 3`, and `镜头 1` through `镜头 3`.
- The six existing QR codes contain Chinese text and are valid for current testing. A future formal release can move to stable identifiers such as `EQ-CAM-001`, but do not change that as part of UI work.

## OpenDesign Source

- Source folder: `为一个大学学生组织设计摄影器材管理微/`.
- Start with `为一个大学学生组织设计摄影器材管理微/DESIGN-HANDOFF.md` and `index.html`.
- The relevant mobile visual reference screens include `home.html`, `equipment-list.html`, `equipment-detail.html`, `scan.html`, `my-records.html`, `profile.html`, `reservation.html`, `approval-center.html`, `admin-dashboard.html`, `statistics.html`, `equipment-manage.html`, and `maintenance.html`.
- The exported PNGs are visual references only. Never ship them as application content.

## Critical Current UI Status

**The OpenDesign visual implementation is not accepted.**

A broad first pass changed global tokens, cards, navigation, and many WXML/WXSS files. It passes all static checks, but the user has explicitly said that the compiled result is still far from the design reference.

Do not describe the current UI as design-faithful, complete, or ready for visual acceptance. The problem is not a Mini Program limitation. The previous pass mostly preserved old WXML page structures and applied a new color/card system. That cannot reproduce the design's layout geometry, visual rhythm, control proportions, and first-screen hierarchy.

`OPENDESIGN_UI_IMPLEMENTATION_PLAN.md` is a record of that preliminary pass and its checks. Its "complete" wording means code was touched, **not** that the user accepted the visual fidelity. This file overrides it for current work.

## Active Three-Skill UI Work

The current visual work follows `impeccable` as the product-UI standard, `baseline-ui` for native spacing/state hygiene, and the anti-template rules from `taste-skill`. These skills are design guidance only; the implementation remains native WXML/WXSS with TDesign Mini Program.

- **Block 0 - design contract:** implemented. `DESIGN.md` and `.impeccable/design.json` now freeze the current tokens: system font stack, `24/18/15/14/12px` hierarchy, 4px spacing grid, 8px control radius, 12px content radius, one `#245F92` primary accent, semantic-only state colors, and the no border-plus-wide-shadow rule.
- **Block 1 - home and four-tab navigation:** implemented, awaiting manual visual confirmation. `app.wxss` now removes the broad card/fixed-bar shadows, `custom-tab-bar/index.wxss` is flat, and `pages/index/index.wxml` / `index.wxss` were structurally rebuilt. The home screen now uses a unified metric strip, a low-friction search field, a white scan-first action row plus two secondary actions, a compact overdue alert, and a grouped current-loan list.
- **First screenshot correction (2026-07-15):** the fixed `t-navbar` already renders a safe-area placeholder, so the old `176rpx` home page top padding created an accidental large blank band. `pages/index/index.wxss` now overrides it with a 16px gap. The original full-width bright-blue scan surface was also rejected as template-like; the design now uses a white primary action row and a quieter `#245F92` steel-blue accent. A fresh screenshot is still required before acceptance.
- **Block 2 - equipment, scan, and records:** implemented at the user's request without waiting for a second home screenshot. `equipment-list` now begins with search and restrained filters instead of a duplicate page hero; `equipment-card` is a real image-first two-column card with the status on media rather than crowded in its title; `equipment-detail` and `scan-result` now use compact media areas and non-overlapping information groups; `scan` has one honest QR-scan entry; and `record-list` is a compact divided list instead of repeated floating cards. All six existing JS files and service calls were preserved. `scripts/check-syntax.js`, `scripts/check-wxml-components.js`, and one-file JS syntax checks passed on 2026-07-15.
- **Block 3 - profile, reservation, and approval:** implemented at the user's request. `profile` retains a deep identity header but now uses a flat stats strip and square icon vocabulary; reservation and approval list pages start with the actual controls rather than duplicate page heroes; reservation/approval details use semantic status panels instead of colored side stripes; their forms and action sheets keep existing validation, duplicate-submit guards, and service calls. Shared `approval-card` and `reservation-card` were flattened into row-compatible components. Static WXML, syntax, and one-file JS checks passed on 2026-07-15.
- **Block 4 - admin and support surfaces:** implemented at the user's request to continue without a visual pause. `admin-stats` now uses one divided metric surface and line-style tabs instead of full-blue pills; `equipment-edit`, `data-import`, and `admin-setup` now begin below the navbar without a duplicate page title and use compact form grouping; `maintenance-log`, `member-list`, and `notification-center` now use grouped rows instead of repeated floating cards. Existing JS, permissions, chart calculations, import actions, dialogs, and cloud calls were not changed.
- **Block 5 - cross-page state and fixed-action baseline:** implemented. The shared bottom bar now has a fixed stacking baseline and safe-area sizing; reservation list, detail, and create pages use the same icon-led page-level action-error treatment as equipment and approval pages. A static scan confirms the only remaining `style=` values in application UI are the intentional dynamic width/height values in `admin-stats` charts (plus the pull-down component's dynamic height).
- `pages/index/index.js` was deliberately not changed. Existing data loading, permissions, routes, and event handlers remain intact.
- Static checks after Blocks 4 and 5: `tests/domain.test.js`, `scripts/check-syntax.js`, `scripts/check-wxml-components.js`, `scripts/check-compat-scan.js`, and `scripts/check-function-lists.js` all passed on 2026-07-15.

**Visual acceptance status:** the user explicitly asked to continue the remaining UI implementation without pausing for a simulator screenshot. The current implementation is therefore code-complete for the planned blocks but is **not visually accepted**. The next required step is one focused WeChat DevTools preview pass, beginning with `pages/index/index`, then checking equipment, reservation/approval, and admin/support pages at `375x667` and `390x844`. Do not describe the UI as design-faithful or ready for release until that rendering review happens.

## Latest Screenshot Feedback

- **2026-07-15, `pages/record-list`:** the first rendered record-list screenshot showed the status tabs and first list group packed too tightly below the navbar, despite available screen height. The user asked for a calmer, more premium sense of space rather than another dense tool-panel layout.
- **Implemented response:** `pages/record-list/record-list.wxml` now adds a small `按状态查看` context line and a truthful current-list count. `record-list.wxss` increases the top rhythm, uses four equal-width 44px tab targets across the whole screen, adds a larger gap before the grouped list, and gives each record row more internal padding. No JavaScript, data fetching, routes, or record actions changed.
- **Verification:** `scripts/check-syntax.js`, `scripts/check-wxml-components.js`, and a direct parse check of `pages/record-list/record-list.js` passed on 2026-07-15.
- **Still needed:** recompile `pages/record-list/record-list` and review it at the same simulator width before accepting this adjustment. Use the next screenshot to judge whether the page now feels intentionally spacious without becoming sparse.
- **2026-07-15, `pages/scan`:** the rendered scan screen put the only scan entry immediately below the navbar, which the user identified as too high and inconvenient to reach. The top instruction duplicated information already contained in the action row.
- **Implemented response:** `pages/scan/scan.wxml` now places the action row in a dedicated `scan-primary-zone`; `scan.wxss` removes the duplicate instruction, reserves 88px of deliberate top space after the navbar, enlarges the entry slightly, and begins the current-borrowed section only after that primary zone. The QR scan event and the recent-records behavior remain unchanged.
- **Verification:** `scripts/check-syntax.js`, `scripts/check-wxml-components.js`, and a direct parse check of `pages/scan/scan.js` passed on 2026-07-15.
- **Still needed:** recompile `pages/scan/scan` at the same simulator size and confirm that the scan action now sits in a comfortably reachable upper-middle position without pushing the current-borrowed list too far below the fold.

## Current Visual Changes Already Present

The following files were changed in the preliminary pass. Work with them; do not blindly revert them.

- Global/navigation: `app.wxss`, `app.json`, `theme.json`, `custom-tab-bar/index.*`.
- Member pages: `pages/index`, `pages/scan`, `pages/scan-result`, `pages/record-list`, `pages/profile`, `pages/equipment-list`, `pages/equipment-detail`.
- Workflow pages: `pages/reservation-list`, `pages/reservation-detail`, `pages/reservation-create`, `pages/approval-list`, `pages/approval-detail`.
- Admin/support pages: `pages/admin-stats`, `pages/equipment-edit`, `pages/maintenance-log`, `pages/member-list`, `pages/notification-center`, `pages/data-import`, `pages/admin-setup`.
- Shared cards: `components/equipment-card`, `components/approval-card`, `components/reservation-card`.

Some visual-only state fields were added to `pages/admin-stats/admin-stats.js` and `pages/maintenance-log/maintenance-log.js` for retryable loading errors. Do not remove them without reason.

## Correct Next Approach: Page-By-Page Fidelity Work

Do not attempt another whole-site token pass. Implement and verify one reference page at a time.

### First Page: Home

1. Recompile `pages/index/index` and obtain a current `375x667` or `390x844` screenshot from WeChat DevTools.
2. Compare it directly with `为一个大学学生组织设计摄影器材管理微/home.html` and the exported PNG references, accounting for the approved one-primary/two-secondary quick-action deviation.
3. Verify nav, greeting, metrics, search, quick actions, overdue alert, current-loan list, and tab bar for geometry, density, long-text handling, and safe-area spacing.
4. Preserve existing data fields, event handlers, status handling, and navigation methods in `pages/index/index.js`; the current rebuilt WXML/WXSS already follow this rule.
5. Pause for user feedback before moving to the next page group unless the user explicitly chooses to proceed without a preview.

### Follow-On Page Order

1. `pages/index` (home visual benchmark).
2. `pages/equipment-list`, `components/equipment-card`, `pages/equipment-detail`, `pages/scan-result`.
3. `pages/scan` and `pages/record-list`.
4. `pages/profile`.
5. Reservation pages, then approval pages.
6. Admin dashboard and support pages.

For every page, preserve normal/loading/empty/error/submitting states and mobile safe-area behavior. Do not fabricate statistics or add business entries merely to make a screenshot look fuller.

## Visual Rules

- Desired system: cool-gray background, white surfaces, blue primary actions, restrained status colors, small shadows, and dense but breathable mobile layouts.
- Avoid browser artifacts, OpenDesign red dashed annotations, desktop backgrounds, heavy gradients, glass blur, large marketing heroes, excessive rounded cards, and decorative orbs.
- Use the exact design's information hierarchy before tuning colors.
- Long device names, QR codes, serial numbers, and Chinese labels must not overflow.
- Fixed bottom actions require content bottom padding and safe-area padding.
- Do not use generic CSS changes as a substitute for structural layout work.

## WeChat DevTools Reality

- The project is open in WeChat DevTools.
- The previous automated inspection found the simulator on its welcome page, not on a compiled Mini Program screen.
- Computer-use screenshot capture subsequently failed with a macOS `ScreenCaptureKit` stream error, so do not claim automatic visual verification has happened.
- Ask the user for a current simulator screenshot whenever actual rendering is needed. The user has explicitly said not to waste time when a manual GUI action is faster.

## Required Checks After Each UI Block

Use the bundled Node executable when `node` is absent from `PATH`:

```sh
/Users/piphanye/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/domain.test.js
/Users/piphanye/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-syntax.js
/Users/piphanye/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-wxml-components.js
/Users/piphanye/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-compat-scan.js
/Users/piphanye/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-function-lists.js
```

All five checks passed after the preliminary UI pass on 2026-07-14.

The only remaining `style=` uses in core files are dynamic chart width/height values in `pages/admin-stats/admin-stats.wxml`; they are intentional.

## Existing Documentation

- `AGENTS.md`: architecture, runtime, boundaries, deployment constraints, and UI rules.
- `HANDOFF_SUMMARY.md`: broader historical backend and migration record.
- `REAL_WORKFLOW_REGRESSION.md`: real-environment test scenarios and results.
- `FLOW_AUDIT_PLAN.md`: earlier flow-state audit history.
- `UI_REFINEMENT_PLAN.md`: earlier incremental UI cleanup history.
- `OPENDESIGN_UI_IMPLEMENTATION_PLAN.md`: preliminary OpenDesign implementation record, superseded for acceptance status by this file.
- `DESIGN.md`: current three-skill design contract and hard visual guardrails.

## User Collaboration Preference

- The user wants proactive implementation, but does not want time spent repeatedly attempting an unavailable GUI or external action.
- When a task is genuinely blocked by local GUI state, ask the user to perform the smallest manual step and provide a screenshot or result.
- For UI work, show concrete visual progress page by page rather than declaring a broad redesign complete without a rendered comparison.
