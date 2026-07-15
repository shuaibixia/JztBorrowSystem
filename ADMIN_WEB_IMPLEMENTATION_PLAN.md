# Admin Web Implementation Record

## Status

- Block 0: Done.
- Block 1: Done.
- Block 2: Done.
- Block 3: Done.
- Block 4: Done.
- Block 5: Not started.
- No CloudBase HTTP function, database collection, OAuth configuration, deployment or migration has been performed in this block.

## Block 0 Deliverables

- `web-admin/` is an isolated React 18 + Vite 4 + Fluent UI React v9 application.
- The local mock shell exposes all target modules: overview, equipment, records, approvals, reservations, maintenance, members, notifications and system.
- `VITE_ADMIN_AUTH_MODE=mock` (and Vite local development) enables only a visual mock administrator. A production build without this setting shows the OAuth-pending screen.
- The foundation deliberately does not call CloudBase or expose a database credential.

## Verification Record

- `web-admin`: `pnpm build` passed on 2026-07-15.
- Root domain tests passed.
- Root JS syntax, WXML component, compatibility and cloud-function-list checks passed.
- A local `1280px` browser preview was inspected: sidebar, grouped summary strip, attention queue, activity panel and records table render with the intended operational density.
- At `1024px`, a page-level horizontal overflow caused by wide tables was found and corrected by constraining table surfaces and their scroll containers. The production build passed after the correction; manual visual confirmation at `1024px` remains pending because the local browser preview connection closed before the re-check.
- Build note: the first Fluent bundle is about `156 kB` gzip. Block 4 will introduce route-level code splitting before production deployment if the real bundle remains this size.

## Design And Security Decisions

- Desktop operational console, not a card-heavy marketing dashboard.
- Browser data access will go only through a future `admin-web` HTTP function with `Authorization: Bearer` opaque sessions stored in `sessionStorage`.
- Future OAuth needs website AppID/secret in cloud-function variables and an HTTPS callback domain. Neither exists in this source tree.
- Future backend collections: `webAdminBindings`, `webAdminSessions`, `webAdminAuthStates`, `webAdminAuditLogs`.

## Manual Preview Checklist

| View | Expected result | Status |
| --- | --- | --- |
| Overview | Task queue reads as the primary surface; summary is a single grouped strip | Pending |
| Equipment | Search, grouped table and details dialog are readable | Pending |
| Desktop widths | 1024, 1280 and 1440 px show stable sidebar, toolbar and tables | Pending |
| Auth pending | Production-mode build does not offer mock access | Pending |

## Block 1 Deliverables

- Added `cloudfunctions/admin-web` as a Node 18 HTTP-function source and registered it in `cloudbaserc.json`, deploy scripts and shared-module synchronization.
- Added `GET /v1/health`, `GET /v1/session`, `GET /v1/dashboard`, `GET /v1/equipment`, `GET /v1/equipment/:id`, and `GET /v1/records`.
- Every protected endpoint requires an opaque Bearer token, validates its SHA-256 hash in `webAdminSessions`, then rechecks the linked active `webAdminBindings` and `users` administrator role.
- Added the website API client and `API_CONTRACT.md`; it is intentionally not connected to the mock UI until real OAuth can provide a session.
- Added `tests/admin-web.test.js` and included it in `npm test`.

## Block 1 Limits

- The source has not been deployed. No database collection, session, web identity, CORS allowlist or OAuth variable has been created.
- With no website OAuth identity available, real browser data reads cannot be safely exercised yet. The local dashboard remains mock-only by design.
- Write endpoints, data editing and CloudBase deployment remain later blocks.

## Block 1 Verification

- `tests/domain.test.js` passed.
- `tests/admin-web.test.js` passed.
- `scripts/check-syntax.js`, `scripts/check-wxml-components.js`, `scripts/check-compat-scan.js`, and `scripts/check-function-lists.js` passed. The function inventory now contains 10 source functions.
- `web-admin`: `pnpm build` passed.

## Block 2 Deliverables

- Moved the canonical QR allocation, counters initialization, SN/QR uniqueness validation and retirement logic into `cloudfunctions/_shared/equipment-admin.js`; both the mini-program `equipment` function and `admin-web` use it.
- Added protected source endpoints for equipment create/update/retire/import/image upload, students list/create/import, member list/enable/disable, and superadmin-only role updates.
- Added browser API-client methods and local mock forms for equipment creation/editing and student roster entry. The UI continues to label these as local simulation until OAuth creates a real session.
- Added `tests/equipment-admin.test.js`.

## Block 2 Verification

- `tests/domain.test.js`, `tests/admin-web.test.js`, and `tests/equipment-admin.test.js` passed.
- Syntax, WXML components, compatibility scan and function-list checks passed.
- `web-admin`: `pnpm build` passed.

## Block 2 Limits

- No CloudBase collection, file, audit log, CORS origin, OAuth credential or user session has been created because the HTTP gateway remains undeployed.
- Image upload accepts only a protected JSON data URL after deployment; the current local mock UI does not upload a real file.

## Block 3 Deliverables

- Added `cloudfunctions/_shared/admin-web-operations.js` with controlled workflows for selected-member checkout, return, approval approval/rejection, reservation confirmation/cancellation and maintenance logging.
- Added global list and action endpoints for approvals, reservations and maintenance, plus checkout/return endpoints for records.
- Website checkout permits a matching confirmed reservation holder, but keeps other confirmed reservations as checkout blockers. Returns can complete matching confirmed reservations.
- Added local confirmation flows for approval, reservation and return state changes, plus a maintenance-entry mock form. These remain local simulation until website OAuth can issue a real session.
- Added `tests/admin-web-operations.test.js`.

## Block 3 Verification

- All four Node test files passed.
- Syntax, WXML components, compatibility scan and function-list checks passed.
- `web-admin`: `pnpm build` passed.

## Block 3 Limits

- The new HTTP source remains undeployed and has not created real audit records, maintenance logs, records, approvals or reservations through the website.
- The local checkout action is intentionally not enabled as a fake mutation until the real authenticated member/equipment data is available.

## Block 4 Deliverables

- Added protected global notifications, superadmin-only audit-log and superadmin-only diagnostics endpoints.
- Diagnostics report collection/counter readiness only; they do not expose OAuth secrets, session tokens, raw OpenIDs or arbitrary database contents.
- The local system page now distinguishes simulated-ready, waiting-deployment and waiting-OAuth states. The superadmin route remains hidden from simulated standard admins.
- Split the web production output into React, Fluent UI and application chunks.

## Block 4 Verification

- All four Node test files passed.
- Syntax, WXML components, compatibility scan and function-list checks passed.
- `web-admin`: `pnpm build` passed with an application chunk of `9.04 kB` gzip, React `8.32 kB` gzip and Fluent UI `143.57 kB` gzip.

## Block 4 Remaining Manual Check

- Open the local desktop site at `1024`, `1280` and `1440` px widths; check sidebar width, toolbar search, wide tables, dialogs and long Chinese names. This remains pending because the automated browser preview connection was unavailable after the first visual check.
