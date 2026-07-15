# OpenDesign UI Implementation Record

## Status

- First implementation pass: complete.
- Native Mini Program visual preview: pending manual verification in WeChat DevTools.
- Business logic, cloud functions, services, data fields, and permission rules: unchanged by this visual pass.

## Source And Adaptation Rules

- Visual source: `为一个大学学生组织设计摄影器材管理微` and its `DESIGN-HANDOFF.md`.
- Native target: every existing page under `pages/` plus the custom tab bar and reusable list cards.
- Visual tokens are centralized in `app.wxss`: cool-gray page background, white surfaces, low-saturation `#245F92` primary actions, restrained status colors, compact card radius, and flat-by-default elevation.
- The exported red dashed annotations, browser canvas, hover-only effects, desktop-only layouts, and heavy blur/gradient treatments are intentionally not rendered in the Mini Program.
- Equipment images always use live `equipment.imageUrl`; an icon placeholder is used when no live image exists. Export images are reference material only.
- Dark mode keeps a dedicated native palette through `app.wxss` and `theme.json`.

## Navigation

The custom tab bar now follows the exported information architecture without changing routes or workflow boundaries:

| Label | Existing route | Status |
| --- | --- | --- |
| 首页 | `pages/index/index` | Complete |
| 记录 | `pages/record-list/record-list` | Complete |
| 扫码 | `pages/scan/scan` | Complete |
| 我的 | `pages/profile/profile` | Complete |

## Page Mapping And Completion

| Export reference | Native page or component | Completed visual work |
| --- | --- | --- |
| `home.html` | `pages/index` | OpenDesign home hierarchy retained: greeting, live metrics, search, quick actions, overdue notice, current loans, loading/error/empty states. |
| `equipment-list.html` | `pages/equipment-list`, `components/equipment-card` | Two-column equipment discovery grid, safer image placeholder, status, code and long-text handling. |
| `equipment-detail.html` | `pages/equipment-detail`, `pages/scan-result` | Shared hero, status, information sheet, description, long-field protection, action error and fixed action bar treatment. |
| `scan.html`, `admin-scan.html` | `pages/scan`, `pages/scan-result` | Compact two-mode scan entry, clear recent-operation hierarchy, result action sheet treatment. |
| `my-records.html` | `pages/record-list` | Existing card-and-filter presentation retained under the new global token system. |
| `profile.html` | `pages/profile` | Full-width native profile header, user stats, service and admin workbench cards. |
| `reservation.html` | `pages/reservation-list`, `pages/reservation-detail`, `pages/reservation-create`, `components/reservation-card` | Title/search/create hierarchy, card list rhythm, status summary, fixed actions, form spacing and failure states. |
| `approval-center.html` | `pages/approval-list`, `pages/approval-detail`, `components/approval-card` | Approval search and list hierarchy, card treatment, status summary, fixed review actions and submission feedback. |
| `admin-dashboard.html`, `statistics.html` | `pages/admin-stats` | Overview metric grid, category/member/trend panels, retryable loading failure state. |
| `equipment-manage.html` | `pages/equipment-edit`, `pages/data-import` | Structured editor, data-management tabs, import forms, list views and result panels. |
| `maintenance.html` | `pages/maintenance-log` | Maintenance header, card list, retryable failure state and structured add sheet. |
| Shared admin support | `pages/member-list`, `pages/notification-center`, `pages/admin-setup` | Consistent toolbar, search/list cards, empty/error states, setup form and action affordances. |

## Shared Components Updated

- `app.wxss`: design tokens, TDesign color variables, consistent cards, forms, bottom bars, error panels, and safe-area spacing.
- `custom-tab-bar`: flat four-item OpenDesign-compatible navigation treatment.
- `components/equipment-card`: two-column equipment card with stable image and text behavior.
- `components/approval-card` and `components/reservation-card`: surfaced list cards with status-first hierarchy.

## Deliberate Native Differences

- Native Mini Program does not reproduce web hover, CSS blur, browser scrollbars, or desktop breakpoint behavior from the export.
- TDesign Mini Program supplies buttons, tabs, empty states, action sheets, dialogs, skeletons, and form controls instead of reimplemented web controls.
- Forms and destructive actions continue to use existing TDesign confirmation and loading behavior; no backend rules were moved into WXML or WXSS.
- Some design-reference metrics are not rendered when the project has no real data source for them. The implementation does not create placeholder business values merely to match a screenshot.

## Verification Record

Completed with bundled Node:

```sh
/Users/piphanye/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/domain.test.js
/Users/piphanye/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-syntax.js
/Users/piphanye/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-wxml-components.js
/Users/piphanye/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-compat-scan.js
/Users/piphanye/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-function-lists.js
```

Results: all passed on 2026-07-14.

## Manual Preview Checklist

The next step is a visual pass in WeChat DevTools. Use the real cloud environment, but do not deploy cloud functions or run migration for this UI check.

| View | What to verify | Result |
| --- | --- | --- |
| 375x667 | Tab bar, first viewport hierarchy, long Chinese names, fixed action bars and action sheets | Pending manual verification |
| 390x844 | Card spacing, safe-area padding, list cards, profile header, chart labels | Pending manual verification |
| Homepage and scan | Four tab items, quick actions, recent records, error and empty states | Pending manual verification |
| Equipment | Grid card images, details, scan result, checkout/application/return action sheets | Pending manual verification |
| Reservation and approval | Search, statuses, forms, confirmation/rejection/cancel actions and fixed buttons | Pending manual verification |
| Admin support | Statistics, import, member, notification, maintenance and editor layouts | Pending manual verification |
| Core workflows | Checkout/return, application/approval, reservation/confirm/conflict block | Pending regression after visual preview |

## Follow-up Log

| Page | Requested change | Status |
| --- | --- | --- |
| All pages | First OpenDesign visual implementation | Complete, awaiting visual feedback |
| WeChat DevTools preview | Capture concrete visual issues at 375x667 and 390x844 | Pending |
| Business logic | No changes requested or made in this visual pass | Preserved |
