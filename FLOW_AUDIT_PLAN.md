# Core Workflow Page State And Entry Audit Plan

## Current Goal

This round is for systematic audit and cleanup of core workflow pages. The goal is to stop finding page problems one by one by chance, and instead verify the main equipment, scan, borrow approval, and reservation paths with a clear role/action/state matrix.

This round prioritizes UI/flow consistency. It does not redesign the visual style, change the data model, execute migration, or add new cloud functions.

## Execution Rule

Complete one block at a time, then pause and ask the user to verify the result in WeChat DevTools before continuing to the next block.

## Page Scope

- `pages/index`
- `pages/scan`
- `pages/scan-result`
- `pages/equipment-detail`
- `pages/reservation-list`
- `pages/reservation-detail`
- `pages/reservation-create`
- `pages/approval-list`
- `pages/approval-detail`

## Role And State Scope

Roles:

- Member
- Admin
- Superadmin

Equipment states:

- `available`
- `checked_out`
- `maintenance`
- `retired`

Reservation states:

- `pending`
- `confirmed`
- `cancelled`
- `completed`

Approval states:

- `pending`
- `approved`
- `rejected`

Common page states:

- Normal
- Loading
- Empty
- Error
- Submitting
- Success refresh

## Block Status

| Block | Name | Status | Pause After Completion |
| --- | --- | --- | --- |
| Block 0 | Write this plan file | Done | Yes |
| Block 1 | Page state matrix audit | Done | Yes |
| Block 2 | Reservation flow page cleanup | Done | Yes |
| Block 3 | Scan, detail, checkout, and return entry cleanup | Done | Yes |
| Block 4 | Approval flow page cleanup | Done | Yes |
| Block 5 | Unified feedback, empty states, and refresh behavior | Done | Yes |
| Block 6 | Regression verification and issue list | Done | Yes |

## Block 0: Write Plan File

### Goal

Create this document as the execution record for the workflow audit.

### Acceptance Criteria

- `FLOW_AUDIT_PLAN.md` exists in the project root.
- The document clearly states that each block must pause after completion and ask the user to verify the result.
- No business code is changed in this block.

### Result

- Status: Done
- Notes: Plan file created. Business code was not changed.

## Block 1: Page State Matrix Audit

### Goal

Build a concrete matrix for what each role should see and do on each core page, and record missing states before changing behavior.

### Work Items

- Audit page WXML/JS for direct role/status button conditions.
- Record what Member, Admin, and Superadmin can see.
- Record what appears for `available`, `checked_out`, `maintenance`, `pending`, `confirmed`, `cancelled`, `approved`, and `rejected`.
- Check whether each page has loading, empty, error, submitting, and success-refresh behavior.
- Record findings in this file.

### Acceptance Criteria

- This file contains a role/action/state matrix for all pages in scope.
- Any inconsistent or missing action is listed as a finding.
- No behavior is changed unless a clear compile/render blocker is found.

### Audit Result

Status: Done

Business code was not changed in this block.

No WXML direct JS function calls were found in the audited pages.

### Page Matrix

| Page | Member Actions | Admin / Superadmin Actions | Main States Covered | Audit Notes |
| --- | --- | --- | --- | --- |
| `pages/index` | View own active/overdue records, search, scan, reservation, equipment list | Same as member plus add FAB | Loading, error with retry, empty borrowed-record state, success refresh on show/pull-down | Good baseline. Admin-only FAB is role-gated. |
| `pages/scan` | Scan QR, view own recent active records | Same as member | Recent loading, recent error with retry, recent empty | Good baseline. Scan failure only logs non-cancel errors; acceptable unless user-facing failures recur. |
| `pages/scan-result` | Available equipment shows borrow application; checked-out own equipment shows return; checked-out by others is disabled | Available equipment shows direct checkout; checked-out equipment currently only returns if admin is also holder | Loading, not found, error with retry, action error, action loading | Needs Block 3: frontend does not expose admin delegated return although backend allows it. |
| `pages/equipment-detail` | Available equipment shows borrow application and reservation; checked-out own equipment shows return | Available equipment shows checkout; edit/QR/delete; checked-out equipment currently only returns if admin is also holder | Loading, error with retry, tab empty states, action error, action loading | Needs Block 3: keep rules aligned with scan result and expose admin delegated return. |
| `pages/reservation-list` | Search, tab filter, create reservation, cancel pending/confirmed reservation from row | Same visible cancel action; backend decides permission | Loading, full-page error, inline error, empty, loading more, end state, cancel submitting | Create entry is fixed above tabs. Need Block 2/5 to confirm empty state is not a dead end and cancel permission messaging is clear. |
| `pages/reservation-detail` | View reservation, cancel pending/confirmed | Confirm pending, cancel pending/confirmed | Loading, confirm/cancel submitting, success refresh | Needs Block 2/5: load failure only stops loading and toast; no page-level error/retry. Cancel button is shown for any pending/confirmed reservation and relies on backend permission. |
| `pages/reservation-create` | Pick time, fill purpose, submit reservation | Same path available | Saving/submitting, validation toasts | Needs Block 2/5: no page-level error state when equipment preload fails; date picker should be manually verified. |
| `pages/approval-list` | List own or relevant approvals depending service response; search and tabs | Admin approval list with tabs/search | Loading, full-page error, inline error, empty, loading more, end state | Good baseline. Empty state has no next action, but approval creation happens from equipment pages. |
| `pages/approval-detail` | View approval detail | Approve/reject pending approvals | Loading, action loading, success refresh | Needs Block 4/5: load failure has no visible page-level error/retry; approve/reject confirm lacks early `actionLoading` guard before setting true. |

### Role / Action Matrix

| Scenario | Expected Rule | Current Frontend Result | Follow-up |
| --- | --- | --- | --- |
| Member + `available` equipment | Can apply to borrow; can reserve; cannot direct checkout | Matches on scan result and equipment detail | Keep in Block 3 regression. |
| Admin/Superadmin + `available` equipment | Can direct checkout; can reserve; can manage equipment | Matches on scan result and equipment detail | Keep in Block 3 regression. |
| Holder + `checked_out` equipment | Can return | Matches on scan result and equipment detail | Keep in Block 3 regression. |
| Admin/Superadmin + equipment checked out by another user | Can delegated-return according to backend rule | Not exposed; button is disabled as "borrowed by other user" | Fix in Block 3. |
| Equipment `maintenance` | Main borrow/checkout action disabled | Matches | Keep. |
| Equipment `retired` | Main action disabled; member should not reserve retired equipment | Main action disabled; detail minor reservation action is hidden for retired | Keep. |
| Reservation `pending` | Member can cancel own; admin can confirm/cancel | Detail/list expose cancel/confirm paths; backend permissions decide owner/admin | Verify and improve error clarity in Block 2. |
| Reservation `confirmed` | Member/admin can cancel when allowed; conflict checkout blocked by backend | Cancel visible; conflict error supported in scan/detail action areas | Verify in Block 2/3. |
| Reservation `cancelled/completed` | No cancel/confirm actions | Matches list/detail button conditions | Keep. |
| Approval `pending` | Admin can approve/reject; member can view | Matches detail button condition | Improve duplicate-submit guard/error in Block 4. |
| Approval `approved/rejected` | No approve/reject actions | Matches | Keep. |

### State Coverage Matrix

| Page Group | Loading | Empty | Error / Retry | Submitting | Success Refresh |
| --- | --- | --- | --- | --- | --- |
| Home and scan entry | Covered | Covered | Covered with retry | Not applicable | Covered on show/pull-down or reload |
| Scan result and equipment detail | Covered | Not found / tab empty covered | Covered with retry/action error | Covered by `actionLoading` | Covered after checkout/return |
| Reservation list | Covered | Covered | Covered with retry | Covered for cancel | Covered after cancel/load |
| Reservation detail/create | Detail loading covered; create preload partial | Detail missing page-level empty/error; create no preload error panel | Mainly toast/console on detail/create failures | Covered by `cancelling`/`confirming`/`saving` | Covered after confirm/cancel; create navigates after success |
| Approval list | Covered | Covered | Covered with retry | Not applicable | Covered by list reload |
| Approval detail | Covered | Missing explicit not-found/failed state | Missing page-level error/retry | Covered visually, guard should be tightened | Covered after approve/reject |

### Findings For Later Blocks

| ID | Page / Area | Expected | Current | Blocker | Target Block |
| --- | --- | --- | --- | --- | --- |
| F1 | `scan-result`, `equipment-detail` | Admin/superadmin can return equipment checked out by another user | Frontend only enables return for current holder | Yes for admin delegated-return workflow | Block 3 |
| F2 | `scan-result`, `equipment-detail` | Button rules should be identical across scan and detail | Rules are nearly identical but duplicate logic can drift; both miss delegated return | Medium | Block 3 |
| F3 | `reservation-detail` | Load failure should show page-level error and retry | Failure only sets `loading=false` and shows toast | Medium | Block 2 or Block 5 |
| F4 | `approval-detail` | Load failure should show page-level error and retry | Failure only logs and stops loading | Medium | Block 4 or Block 5 |
| F5 | `approval-detail` | Repeated approve/reject confirm taps should be ignored while submitting | `actionLoading` is set but confirm handlers do not return early if already loading | Medium | Block 4 |
| F6 | `reservation-create` | Equipment preload/date submit failures should be recoverable and visible | Some failures rely on toast/console only | Low/Medium | Block 2 or Block 5 |
| F7 | List empty states | Empty pages should not feel like dead ends | Reservation list has create entry; approval list empty is acceptable because creation starts from equipment pages | Low | Block 5 |

### Result

- Status: Done
- Notes: The main logic conflict found is admin delegated return missing from frontend entry rules. Detail-page error/retry states should be improved in later blocks.

### Pause Question

Ask the user whether the audited role/action rules match the real equipment-management process.

## Block 2: Reservation Flow Page Cleanup

### Goal

Make reservation pages consistent and usable across list, detail, and create paths.

### Work Items

- Ensure the create-reservation entry is not hidden by tab/list state.
- Ensure members can cancel their own reservations when allowed.
- Ensure admins and superadmins can confirm and cancel reservations when allowed.
- Ensure date/time selection is stable and usable.
- Ensure confirmed reservation checkout conflicts show a clear visible error.

### Acceptance Criteria

- The reservation create entry is reachable from all relevant tabs.
- Admin confirm/cancel actions are visible only when valid.
- Member cancel action is visible only when valid.
- Conflict checkout failure has a visible message, not only a transient toast.
- JS syntax and WXML component checks pass.

### Result

- Status: Done
- Reservation list:
  - Kept the fixed create entry above tabs, so the reservation entry is not tied to empty/list state.
  - Kept row click for detail and row cancel as the only inline action.
- Reservation detail:
  - Added page-level `error/errorMessage` and retry.
  - Added `notFound` state with a visible empty state and return action.
  - Cancel is now shown only when the current user is admin/superadmin or the reservation owner, and status is `pending` or `confirmed`.
  - Confirm is shown only for admin/superadmin on `pending`.
  - `confirming` and `cancelling` now guard against repeated submit.
- Reservation create:
  - Added visible equipment-load error state with retry and return.
  - Added missing-equipment guard, invalid-date guard, and `saving` duplicate-submit guard.
  - Kept TDesign `t-date-time-picker`; no custom picker was introduced.
- Verification:
  - Global `node` was unavailable in shell, so bundled Codex Node was used.
  - `/Users/piphanye/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-syntax.js` passed.
  - `/Users/piphanye/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-wxml-components.js` passed.

### Pause Question

Ask the user to test reservation create, confirm, cancel, and conflict blocking in WeChat DevTools.

## Block 3: Scan, Detail, Checkout, And Return Entry Cleanup

### Goal

Make scan result and equipment detail actions consistent with the backend rules.

### Work Items

- Members must not see direct checkout for available equipment.
- Members should see borrow application and reservation paths where valid.
- Admins and superadmins can direct checkout available equipment.
- Holder, admin, and superadmin can return checked-out equipment.
- Scan result and equipment detail must use the same action rules.
- Checkout, return, and application failures must show readable inline or page-level errors.

### Acceptance Criteria

- Member on available equipment: no direct checkout; can apply or reserve.
- Admin/superadmin on available equipment: direct checkout is available.
- Holder/admin/superadmin on checked-out equipment: return is available.
- Failed action restores button usability.
- JS syntax and WXML component checks pass.

### Result

- Status: Done
- Scan result:
  - `canReturn()` now allows the current holder or admin/superadmin.
  - `getButtonInfo()` now shows `归还` for admin/superadmin when equipment is checked out by another user.
  - Member behavior is unchanged: members can only return equipment they hold.
- Equipment detail:
  - `canReturn()` now follows the same holder-or-admin rule.
  - `getButtonInfo()` now matches scan result behavior for checked-out equipment.
  - Existing `actionError` and `actionLoading` behavior was kept.
- Interfaces:
  - No service API changed.
  - Scan result still returns by `equipmentQR`.
  - Equipment detail still returns by `equipmentId`.
- Verification:
  - `/Users/piphanye/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-syntax.js` passed.
  - `/Users/piphanye/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-wxml-components.js` passed.

### Pause Question

Ask the user to test scan checkout, return, and member application entry.

## Block 4: Approval Flow Page Cleanup

### Goal

Make approval list and detail predictable for pending, approved, and rejected approvals.

### Work Items

- Ensure admins can clearly find pending approvals.
- Show approve/reject actions only for pending approvals.
- Add or verify submitting guards for approve/reject.
- Show readable errors when approval actions fail.
- Refresh or navigate cleanly after successful approval/rejection.

### Acceptance Criteria

- Student-created applications appear for admins.
- Approving a pending application checks out equipment and records `approvalId`.
- Rejecting a pending application leaves equipment unchanged.
- Repeated taps do not duplicate approval actions.
- JS syntax and WXML component checks pass.

### Result

- Status: Done
- Approval list:
  - Kept search, tabs, pagination, empty state, and retry behavior.
  - Made card tap handling tolerant of both event detail id and dataset id.
  - Did not add approve/reject actions to list rows.
- Approval detail:
  - Added page-level `error/errorMessage` and retry.
  - Added `notFound` state with visible empty state and return action.
  - Added `canReviewApproval`, true only for admin/superadmin on `pending` approvals.
  - Added early returns for approve/reject open and confirm handlers while submitting or when review is no longer allowed.
  - Added page-level `actionError` for approval action failures while retaining toast feedback.
  - Successful approve/reject closes action sheet, clears errors, refreshes detail, and hides bottom actions after status changes.
  - Replaced key inline detail layout styles with page classes for stable text wrapping and spacing.
- Verification:
  - `/Users/piphanye/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-syntax.js` passed.
  - `/Users/piphanye/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-wxml-components.js` passed.
  - `node -c` equivalent checks passed for `pages/approval-detail/approval-detail.js` and `pages/approval-list/approval-list.js`.

### Pause Question

Ask the user to test application, approval pass, and approval rejection.

## Block 5: Unified Feedback, Empty States, And Refresh Behavior

### Goal

Apply a consistency pass across core pages so missing data, loading, errors, and refreshes are handled predictably.

### Work Items

- Ensure loading states do not block the primary path indefinitely.
- Ensure empty states provide the next reasonable action.
- Ensure error states provide retry.
- Ensure submitting actions show loading and prevent repeated submit.
- Ensure list refresh keeps filters and state correct.
- Ensure successful operations refresh visible page data.

### Acceptance Criteria

- Empty pages are not dead ends.
- Network or cloud-function failures have retry or clear recovery.
- Primary actions remain reachable on common mobile sizes.
- JS syntax and WXML component checks pass.

### Result

- Status: Done
- Operation feedback:
  - `scan-result` borrow application validation and submit failures now write to `actionError`, not only toast.
  - `equipment-detail` borrow application validation and submit failures now write to `actionError`, not only toast.
  - Existing checkout/return/approval action failures continue to keep a visible page-level error and restore button usability.
- Submitting guards:
  - Scan result and equipment detail action sheets can no longer be closed while the request is submitting.
  - Reservation list/detail cancel and confirm dialogs now ignore cancel/close while submitting.
  - Approval detail approve/reject sheets now ignore cancel/close while submitting.
- Layout consistency:
  - Reservation detail and approval detail bottom action buttons no longer rely on inline `style="flex:1"`.
  - Added `.bottom-action` wrappers to keep fixed bottom buttons stable and reduce overflow risk.
- Empty state decisions:
  - Home empty borrowed-record state remains informational because scan, reservation, and equipment entries are already visible.
  - Scan recent-record empty state remains informational because the scan action is the primary first-screen action.
  - Reservation list empty state remains usable because the fixed create entry is above tabs.
  - Approval list empty state remains read-only because approval creation starts from scan result or equipment detail.
- Verification:
  - `/Users/piphanye/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-syntax.js` passed.
  - `/Users/piphanye/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-wxml-components.js` passed.
- Manual preview still required:
  - Check 375x667 and 390x844 first screens in WeChat DevTools.
  - Confirm bottom bars do not cover content and key button text does not overflow.

### Pause Question

Ask the user to inspect common phone sizes and core page first screens.

## Block 6: Regression Verification And Issue List

### Goal

Run local checks and record the remaining manual workflow status.

### Local Checks

Use global Node or the bundled Codex Node:

```sh
node tests/domain.test.js
node scripts/check-syntax.js
node scripts/check-wxml-components.js
node scripts/check-compat-scan.js
node scripts/check-function-lists.js
```

### Manual Workflow Scenarios

- Scan checkout -> return.
- Student application -> admin approval.
- Student application -> admin rejection.
- Create reservation -> admin confirmation -> conflicting checkout is blocked.
- Student cancels reservation.
- Admin cancels reservation.

### Acceptance Criteria

- Local checks pass.
- Manual workflow results are recorded in this file.
- Any remaining issue has reproduction steps, expected result, actual result, first console error if present, and blocker status.

### Result

- Status: Done
- Local checks:
  - `/Users/piphanye/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/domain.test.js` passed.
  - `/Users/piphanye/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-syntax.js` passed.
  - `/Users/piphanye/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-wxml-components.js` passed.
  - `/Users/piphanye/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-compat-scan.js` passed.
  - `/Users/piphanye/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-function-lists.js` passed.
- Environment note:
  - Global `node` is not available in this shell PATH.
  - Bundled Node used: `/Users/piphanye/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node`.
- Static blocker status:
  - No local static blocker found.
  - No new deprecated frontend action call found.
  - Cloud function list is aligned across local checks.
- Manual verification status:
  - Some main flows were previously reported by the user as passing during real-device/devtools testing.
  - This block does not mark untested scenarios as passed. Remaining manual scenarios are listed below as pending.

### Pause Question

Ask the user whether to enter UI refinement or final pre-launch acceptance.

## Issue Log

| ID | Block | Scenario | Expected | Actual | First Console Error | Blocker | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| L1 | Block 6 | Local static regression | All local checks pass | All local checks passed with bundled Node | N/A | No | Closed |
| M1 | Manual | WeChat DevTools workflow regression | Core flows pass in real mini program | Pending manual verification | Pending | Unknown | Open |

## Manual Verification Log

| Scenario | Account / Role | Equipment / Reservation | Result | Notes |
| --- | --- | --- | --- | --- |
| Scan checkout -> return | Admin / holder | Real cloud equipment | Previously reported passed | Re-test after latest UI changes before final acceptance. |
| Application -> approval pass | Member + Admin | Real cloud equipment | Previously reported passed | Re-test after latest UI changes before final acceptance. |
| Application -> rejection | Member + Admin | Real cloud equipment | Pending manual verification | Confirm rejected status and equipment unchanged. |
| Reservation confirm -> conflict blocked | Member + Admin | Confirmed reservation window | Previously reported passed | Re-test visible conflict message after UI changes. |
| Student reservation cancellation | Member | Pending/confirmed reservation | Previously reported passed | Re-test after latest UI changes before final acceptance. |
| Admin reservation cancellation | Admin/Superadmin | Pending/confirmed reservation | Previously reported passed | Re-test after latest UI changes before final acceptance. |
| Admin delegated return | Admin/Superadmin | Equipment checked out by another user | Pending manual verification | Added in Block 3; must verify button and return success. |
| Member views equipment checked out by another user | Member | Equipment checked out by another user | Pending manual verification | Button should remain disabled. |
| Common phone first-screen check | Any role | 375x667 and 390x844 | Pending manual verification | Check main action visibility, bottom bars, and text overflow. |
