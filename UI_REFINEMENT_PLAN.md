# UI Refinement Plan

## Current Goal

Refine the mini program UI for the core equipment-management workflows without redesigning the whole product. The target is a restrained, clean, WeChat-ecosystem tool UI that keeps the now-working business flows stable.

This round does not change backend rules, cloud functions, data migration, or service contracts.

## Execution Rule

Complete one block at a time, then pause and ask the user to verify the result in WeChat DevTools before continuing.

Before implementing a page, define its information hierarchy in this document:

- User goal
- Primary path
- Secondary path
- First-screen primary information
- Action area
- Required states
- Out of scope

## UI Rules

- Use TDesign Mini Program components first.
- Do not reinvent buttons, dialogs, lists, tabs, search, loading, empty, or form controls.
- Keep the style restrained, clean, professional, and consistent with WeChat tool apps.
- Avoid broad gradients, decorative effects, oversized rounded cards, low contrast, and crowded layouts.
- Every clickable element should have visible feedback or state.
- Forms need validation, duplicate-submit prevention, and failure recovery.
- Lists need loading, empty, error, retry, refresh, and pagination states where relevant.
- Dangerous actions need confirmation.
- Check common mobile sizes before considering a block complete.

## Page Priority

| Priority | Pages | Reason |
| --- | --- | --- |
| 1 | `pages/index`, `pages/scan` | First impression and primary entry points. |
| 2 | `pages/equipment-list`, `pages/equipment-detail`, `pages/scan-result` | Core equipment discovery and borrow/return operations. |
| 3 | `pages/reservation-list`, `pages/reservation-detail`, `pages/reservation-create` | Reservation flow needs clear status and time selection. |
| 4 | `pages/approval-list`, `pages/approval-detail` | Admin review flow needs low-friction decisions and readable status. |
| 5 | Cross-page visual consistency | Spacing, buttons, state colors, dark-mode risk, and text overflow. |
| 6 | WeChat DevTools preview acceptance | Real viewport checks and final issue list. |

## Block Status

| Block | Name | Status | Pause After Completion |
| --- | --- | --- | --- |
| Block 0 | Write this UI refinement plan | Done | Yes |
| Block 1 | Home and scan entry refinement | Done | Yes |
| Block 2 | Equipment list, detail, and scan result refinement | Done | Yes |
| Block 3 | Reservation flow refinement | Done | Yes |
| Block 4 | Approval flow refinement | Done | Yes |
| Block 5 | Cross-page visual consistency pass | Done | Yes |
| Block 6 | WeChat DevTools preview acceptance | Pending | Yes |

## Block 0: Write This UI Refinement Plan

### Goal

Create a dedicated plan file for UI refinement.

### Acceptance Criteria

- `UI_REFINEMENT_PLAN.md` exists in the project root.
- The plan states that implementation must proceed block by block.
- The plan includes page hierarchy, preview, and issue recording sections.
- No business code is changed in this block.

### Result

- Status: Done
- Notes: Plan file created. Business code was not changed.

## Block 1: Home And Scan Entry Refinement

### Pages

- `pages/index`
- `pages/scan`

### Information Hierarchy

| Page | User Goal | Primary Path | Secondary Path | First-Screen Information | Action Area | Required States | Out Of Scope |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Home | Quickly understand personal borrowing status and enter common actions. | Scan, view equipment, reservation, search. | View notifications, admin add entry. | Greeting/profile context, active/overdue reminder, key stats, quick actions. | Quick action grid, admin FAB if admin. | Loading, error/retry, empty borrowed records, overdue alert. | Backend stats logic, notification logic. |
| Scan | Start QR scan and see recent active borrowed items. | Tap scan. | Open recently borrowed equipment detail. | Clear scan primary action and recent active records. | Scan primary button, retry recent list. | Recent loading, recent error/retry, recent empty, scan cancel. | QR parsing rules, checkout rules. |

### Acceptance Criteria

- Main action is obvious in the first screen.
- No crowded or marketing-style hero layout.
- Empty states do not feel broken.
- Text does not overflow common phone width.

### Result

- Status: Done
- Home:
  - Added a compact summary area with greeting, workflow description, and current borrowed count.
  - Kept stats, search, and quick actions in the first-screen path.
  - Clarified quick action labels: scan borrow/return, reservation, equipment.
  - Added secondary quick-action text with single-line overflow protection.
  - Kept empty borrowed-record state informational because primary entries already exist on the page.
- Scan:
  - Reworked the scan primary area into a clear row-style main action.
  - Kept recent active records as secondary content below the scan action.
  - Added a compact "recent 3" section label.
  - Preserved loading, error/retry, and empty states.
- Verification:
  - `/Users/piphanye/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-syntax.js` passed.
  - `/Users/piphanye/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-wxml-components.js` passed.
  - `node -c` equivalent checks passed for `pages/index/index.js` and `pages/scan/scan.js`.
- Manual preview still required:
  - Home 375x667 and 390x844: confirm quick actions remain visible and not crowded.
  - Scan 375x667 and 390x844: confirm scan action is visually primary and recent list does not dominate.

## Block 2: Equipment List, Detail, And Scan Result Refinement

### Pages

- `pages/equipment-list`
- `pages/equipment-detail`
- `pages/scan-result`

### Information Hierarchy

| Page | User Goal | Primary Path | Secondary Path | First-Screen Information | Action Area | Required States | Out Of Scope |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Equipment list | Find equipment by status/category/search. | Search/filter and open detail. | Admin add/import if existing entry exists. | Search, filters, equipment rows/cards. | Row tap, filters, pagination. | Loading, empty, error/retry, loading more. | Equipment CRUD rules. |
| Equipment detail | Decide whether to reserve, apply, checkout, return, or manage equipment. | Bottom primary action based on role/status. | View records, maintenance, QR/edit/delete as admin. | Equipment name, status, category, QR/SN, holder/time if checked out. | Stable bottom bar and secondary actions. | Loading, error/retry, tab empty, action error, submitting. | Backend borrow/return rules. |
| Scan result | Quickly act on scanned equipment. | Checkout/apply/return based on role/status. | Scan again, view detail. | Equipment name, status, category, QR/SN, checked-out info. | Bottom primary action and small secondary actions. | Loading, not found, error/retry, action error, submitting. | Scan API and cloud calls. |

### Acceptance Criteria

- Detail and scan result action rules look consistent.
- Bottom bar does not cover content.
- Long equipment names, QR codes, SNs, and holder names do not overflow.
- Status tags are readable and restrained.

### Result

- Status: Done
- Equipment list:
  - Replaced the main search, category filter, count, empty, and error layout with stable wxss classes.
  - Added first-screen `t-empty` error state with retry.
  - Added empty states that distinguish between no equipment and no search result.
  - Kept search, category filtering, pagination, and item navigation behavior unchanged.
- Equipment card:
  - Added long text protection for brand, model, and location fields.
  - Kept the existing card component and tap behavior unchanged.
- Equipment detail and scan result:
  - Kept existing checkout, application, return, reservation, and admin-management behavior unchanged.
  - Adjusted long info values such as QR code, SN, and location to wrap safely instead of overflowing.
- Verification:
  - `/Users/piphanye/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-syntax.js` passed.
  - `/Users/piphanye/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-wxml-components.js` passed.
  - `node -c` equivalent checks passed for `pages/equipment-list/equipment-list.js`, `pages/equipment-detail/equipment-detail.js`, `pages/scan-result/scan-result.js`, and `components/equipment-card/index.js`.
- Manual preview still required:
  - Equipment list 375x667 and 390x844: confirm search, category filters, empty/error states, and long equipment names are stable.
  - Equipment detail 375x667 and 390x844: confirm equipment name, QR code, SN, and bottom actions do not overflow or cover content.
  - Scan result 375x667 and 390x844: confirm not-found, loading/error, action error, and long text states render clearly.

## Block 3: Reservation Flow Refinement

### Pages

- `pages/reservation-list`
- `pages/reservation-detail`
- `pages/reservation-create`

### Information Hierarchy

| Page | User Goal | Primary Path | Secondary Path | First-Screen Information | Action Area | Required States | Out Of Scope |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Reservation list | See and manage reservations by status. | Filter/search, open detail, create reservation. | Cancel valid reservation. | Search, create entry, tabs, list rows. | Fixed create entry, row cancel, detail tap. | Loading, empty, error/retry, inline error, loading more. | Reservation backend status rules. |
| Reservation detail | Understand reservation status and act if allowed. | Confirm or cancel when valid. | Return to list. | Status, equipment, time window, purpose, created time. | Bottom confirm/cancel actions. | Loading, not found, error/retry, submitting. | Inventory conflict logic. |
| Reservation create | Pick a valid equipment time window and submit. | Select start/end time and submit. | Retry equipment load, return. | Equipment name, start/end time, purpose. | Submit button. | Equipment loading/error, date validation, submitting. | Date picker component internals. |

### Acceptance Criteria

- Create entry is always easy to find.
- Time selection is understandable and not cramped.
- Confirm/cancel actions are not ambiguous.
- Empty and error states have recovery paths.

### Result

- Status: Done
- Reservation list:
  - Kept the create entry visible above all tabs and made it a clearer reservation action block.
  - Separated reservation time and purpose into stable row metadata to reduce crowding around the status tag.
  - Added page-level action error for cancellation failures while preserving the current list state.
  - Kept search, tab switching, pagination, detail navigation, and cancellation behavior unchanged.
- Reservation detail:
  - Replaced plain status text with a clearer status summary area.
  - Added page-level action error for confirm/cancel failures.
  - Added loading/disabled states to bottom confirm/cancel buttons during submission.
  - Kept existing permission behavior: pending can be confirmed by admin and cancelled by valid operators; confirmed can be cancelled; cancelled/completed show no bottom action.
- Reservation create:
  - Added a concise form header and clearer visual grouping around equipment, time, and purpose sections.
  - Added page-level action error for validation and submit failures.
  - Kept TDesign date-time picker, existing date validation, duplicate-submit guard, and service call unchanged.
- Verification:
  - `/Users/piphanye/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-syntax.js` passed.
  - `/Users/piphanye/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-wxml-components.js` passed.
  - `node -c` equivalent checks passed for `pages/reservation-list/reservation-list.js`, `pages/reservation-detail/reservation-detail.js`, and `pages/reservation-create/reservation-create.js`.
- Manual preview still required:
  - Reservation list 375x667 and 390x844: confirm create entry is visible in all tabs and row text does not overflow.
  - Reservation detail 375x667 and 390x844: confirm status summary, action errors, and bottom actions do not overlap content.
  - Reservation create 375x667 and 390x844: confirm date-time pickers open correctly and validation errors are visible.

## Block 4: Approval Flow Refinement

### Pages

- `pages/approval-list`
- `pages/approval-detail`

### Information Hierarchy

| Page | User Goal | Primary Path | Secondary Path | First-Screen Information | Action Area | Required States | Out Of Scope |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Approval list | Find pending/reviewed applications. | Filter/search and open detail. | Scroll/paginate. | Search, tabs, approval rows. | Row tap. | Loading, empty, error/retry, inline error, loading more. | Approval creation path. |
| Approval detail | Review one application and approve/reject if allowed. | Approve or reject pending request. | Read requester/equipment/purpose/status. | Status, requester, equipment, purpose, timing. | Bottom approve/reject and action sheet. | Loading, not found, error/retry, action error, submitting. | Backend checkout transaction. |

### Acceptance Criteria

- Pending approvals are easy for admins to recognize.
- Approve/reject actions are visible only when valid.
- Long purpose/reason text wraps safely.
- Rejection and approval sheets are not cramped.

### Result

- Status: Done
- Approval list:
  - Added a concise approval header to clarify that list pages are for filtering and entering detail.
  - Kept search, tabs, pagination, pull-down refresh, and detail navigation behavior unchanged.
  - Updated empty state copy to distinguish no approvals from no search match.
- Approval card:
  - Strengthened card hierarchy with equipment name, status tag, requester, relative time, and optional purpose.
  - Added long text protection for equipment, requester, time, and purpose fields.
  - Kept approve/reject actions out of list cards; actions remain in detail.
- Approval detail:
  - Replaced plain status text with a status summary area.
  - Kept applicant, equipment, purpose, timestamps, remark, and reject reason in a readable info list.
  - Added loading/disabled states to bottom approve/reject buttons and action-sheet confirm buttons.
  - Cleared stale action errors when opening or editing approval/rejection sheets.
  - Kept backend approval/rejection behavior and service calls unchanged.
- Verification:
  - `/Users/piphanye/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-syntax.js` passed.
  - `/Users/piphanye/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-wxml-components.js` passed.
  - `node -c` equivalent checks passed for `pages/approval-list/approval-list.js`, `pages/approval-detail/approval-detail.js`, and `components/approval-card/approval-card.js`.
- Manual preview still required:
  - Approval list 375x667 and 390x844: confirm tabs, search, empty states, and card text are stable.
  - Approval detail 375x667 and 390x844: confirm status summary, long purpose/reject reason, bottom actions, and action sheets do not overlap content.

## Block 5: Cross-Page Visual Consistency Pass

### Goal

Make the refined core pages feel like one product.

### Checks

- Spacing uses existing global variables where possible.
- Button size, hierarchy, and danger styling are consistent.
- Status colors are consistent and readable.
- Cards/list rows avoid excessive radius and shadow.
- Empty/loading/error states use TDesign and consistent spacing.
- Fixed bottom bars leave enough page bottom padding.
- Dark-mode CSS variables do not produce low contrast.

### Acceptance Criteria

- No obvious one-off visual styles remain in core paths.
- Core pages do not read as a one-color or decorative palette.
- No large hero/marketing layout appears in tool pages.

### Result

- Status: Done
- Global style cleanup:
  - Added shared style variables for error background, fixed bottom spacing, state panel padding, and error padding in `app.wxss`.
  - Added lightweight shared base classes for `state-panel`, `inline-error`, `action-error`, `bottom-bar`, and `bottom-action`.
  - Added `--app-page-top` and `--app-page-bottom-form` aliases so form pages can share the same page spacing tokens.
- Cross-page consistency:
  - Unified bottom page padding and fixed bottom bar padding across equipment detail, scan result, reservation detail, and approval detail.
  - Unified page-level error background and padding across equipment, scan result, reservation, approval, and home overdue states.
  - Unified list empty/error state spacing for equipment list, reservation list, and approval list.
  - Preserved each page's existing layout structure and business behavior.
- Static scan:
  - No unnecessary `style=` remained in the refined core pages.
  - No `linear-gradient` or `box-shadow` appeared in the refined core pages.
  - No old inconsistent `rgba(220, 38, 38, 0.08)` error background remained.
- Verification:
  - `/Users/piphanye/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-syntax.js` passed.
  - `/Users/piphanye/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-wxml-components.js` passed.
- Manual preview still required:
  - 375x667 and 390x844: confirm fixed bottom bars do not cover content.
  - Confirm empty, loading, and error states look consistent across list/detail pages.
  - Confirm the global spacing tokens do not make any page feel too loose on short screens.

## Block 6: WeChat DevTools Preview Acceptance

### Goal

Record manual preview results after the UI refinement blocks.

### Required Viewports

- 375x667
- 390x844

### Required Checks

- First-screen purpose is clear.
- Main action is visible.
- Text does not overflow.
- Buttons are reachable and not too dense.
- Fixed bottom bars do not cover content.
- Loading, empty, error, and submitting states are complete.

## Preview Log

| Page | Viewport | First Screen Clear | Main Action Visible | Text Overflow | Button / Bottom Bar Issue | State Coverage | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Home | 375x667 | Pending | Pending | Pending | Pending | Pending |  |
| Home | 390x844 | Pending | Pending | Pending | Pending | Pending |  |
| Scan | 375x667 | Pending | Pending | Pending | Pending | Pending |  |
| Scan | 390x844 | Pending | Pending | Pending | Pending | Pending |  |
| Equipment list | 375x667 | Pending | Pending | Pending | Pending | Pending |  |
| Equipment detail | 375x667 | Pending | Pending | Pending | Pending | Pending |  |
| Scan result | 375x667 | Pending | Pending | Pending | Pending | Pending |  |
| Reservation list | 375x667 | Pending | Pending | Pending | Pending | Pending |  |
| Reservation detail | 375x667 | Pending | Pending | Pending | Pending | Pending |  |
| Reservation create | 375x667 | Pending | Pending | Pending | Pending | Pending |  |
| Approval list | 375x667 | Pending | Pending | Pending | Pending | Pending |  |
| Approval detail | 375x667 | Pending | Pending | Pending | Pending | Pending |  |

## Issue Log

| ID | Block | Page | Problem | Reproduction | Severity | Status |
| --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |
