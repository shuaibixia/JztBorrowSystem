# admin-web HTTP Function

This function is the only browser-facing entry point for the future management website.

- It accepts opaque website sessions through `Authorization: Bearer <token>`.
- It validates `webAdminSessions`, `webAdminBindings`, and the linked active `users` admin role on every request.
- It never accepts a mini-program OPENID or `__compatOpenId` from the browser.
- Current Block 1 endpoints are read-only: `/v1/health`, `/v1/session`, `/v1/dashboard`, `/v1/equipment`, `/v1/equipment/:id`, `/v1/records`.

Required deployment-time environment variables are documented in `web-admin/API_CONTRACT.md`. Do not deploy the function before OAuth, allowed origins, and session collections are configured.
