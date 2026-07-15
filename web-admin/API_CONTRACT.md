# Admin Web API Contract: Block 1

The browser calls a future CloudBase HTTP function named `admin-web`. All paths are relative to its deployed HTTPS endpoint.

## Authentication

Protected requests require `Authorization: Bearer <opaque-session-token>`. The browser stores that token only in `sessionStorage`. The function stores only `SHA-256(token)` in `webAdminSessions` and validates the linked binding and active `admin` or `superadmin` user on every request.

The public health endpoint is `GET /v1/health`. It intentionally returns no environment, user, collection or credential information.

## Read-only endpoints

| Method | Path | Result |
| --- | --- | --- |
| `GET` | `/v1/session` | Current website administrator's public name and role |
| `GET` | `/v1/dashboard` | Operational counts and attention queues |
| `GET` | `/v1/equipment?page=&pageSize=&status=&category=&keyword=` | Paginated equipment list |
| `GET` | `/v1/equipment/:id` | Equipment detail |
| `GET` | `/v1/records?page=&pageSize=&status=&keyword=` | Global paginated borrow records |

## Management endpoints: Block 2

All endpoints below require an active `admin` session. Role changes additionally require `superadmin`.

| Method | Path | Result |
| --- | --- | --- |
| `POST` | `/v1/equipment` | Create equipment and allocate a canonical QR code |
| `PATCH` | `/v1/equipment/:id` | Update allowlisted equipment fields and validate SN/QR uniqueness |
| `POST` | `/v1/equipment/:id/retire` | Retire equipment; checked-out equipment is rejected |
| `POST` | `/v1/equipment/batch-import` | Import validated equipment rows |
| `POST` | `/v1/equipment/:id/image` | Upload one JPEG/PNG/WebP data URL, maximum 1.5 MB |
| `GET` | `/v1/members` | Paginated member accounts without mini-program OPENIDs |
| `PATCH` | `/v1/members/:id/role` | Superadmin-only role change |
| `POST` | `/v1/members/:id/toggle-active` | Enable or disable a member |
| `GET` | `/v1/students` | Paginated pre-registered student roster |
| `POST` | `/v1/students` | Create one validated 12-digit student record |
| `POST` | `/v1/students/batch-import` | Import validated student rows |

Each successful write attempts to append a record to `webAdminAuditLogs`. Audit logging must never make a completed business action fail.

## Workflow endpoints: Block 3

These endpoints are controlled workflows, never generic record/status updates.

| Method | Path | Result |
| --- | --- | --- |
| `POST` | `/v1/records/checkout` | Admin selects an active member and equipment; conflicting confirmed reservations still block checkout unless the selected member is the matching reservation holder |
| `POST` | `/v1/records/:id/return` | Holder or administrator returns one active record and may complete its matching reservation |
| `GET` | `/v1/approvals` | Global approval queue |
| `POST` | `/v1/approvals/:id/approve` | Approve and perform the existing checkout transaction |
| `POST` | `/v1/approvals/:id/reject` | Reject one pending approval with an optional reason |
| `GET` | `/v1/reservations` | Global reservation queue |
| `POST` | `/v1/reservations/:id/confirm` | Confirm one pending reservation |
| `POST` | `/v1/reservations/:id/cancel` | Cancel a pending or confirmed reservation |
| `GET` | `/v1/maintenance` | Global maintenance log list, optionally filtered by equipment |
| `POST` | `/v1/maintenance` | Add one maintenance log for existing equipment |

The source implementation shares checkout/return record builders, equipment status transitions, confirmed-reservation conflict detection and completion matching with the established mini-program domain code.

## Operations endpoints: Block 4

| Method | Path | Role | Result |
| --- | --- | --- | --- |
| `GET` | `/v1/notifications` | admin | Global paginated notification visibility without recipient OpenIDs |
| `GET` | `/v1/audit-logs` | superadmin | Paginated website write-audit history; reports an empty unavailable view before the collection exists |
| `GET` | `/v1/system/diagnostics` | superadmin | Collection/counter readiness and pending website setup collection names |

System diagnostics deliberately expose collection readiness and counts only. They do not return function credentials, OAuth secrets, session tokens, OpenIDs or raw user records.

Every response uses `{ code, data }` on success or `{ code, message }` on failure. The gateway returns `401` for missing or expired sessions, and `403` when the linked user is not an active administrator.

## Future OAuth configuration

Do not set these values in Vite or commit them to source control:

- `WECHAT_WEB_APP_ID`
- `WECHAT_WEB_APP_SECRET`
- `WECHAT_WEB_REDIRECT_URI`
- `WEB_ADMIN_ALLOWED_ORIGINS` as a comma-separated exact HTTPS origin allowlist

OAuth session issuance and all write endpoints are intentionally deferred until later Blocks.
