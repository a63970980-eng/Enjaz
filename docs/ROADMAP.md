# ENJAZ Roadmap

## Implementation snapshot — 2026-10-18

- **Workspace employee builder:** Implemented on `main` in PR #52 (not yet production-deployed). It uses the workforce/tool catalog endpoints when available, falls back to a custom role if the role catalog is unavailable, and preserves explicit tool assignment and the existing human-approval policy.
- **Recurring automations:** Workspace UI is connected to the existing routine API and scheduler; managers can create, pause, and resume routines.
- **Analytics and billing:** Initial usage dashboard is implemented. It reads current runtime, subscription, and limit data; it does **not** issue invoices or collect payments. See [Analytics and Billing Design](./ANALYTICS_AND_BILLING_DESIGN.md).
- **Access-control baseline:** Implemented in the current RBAC feature branch; review/merge is pending. It uses a centralized, deny-by-default API permission resolver and domain-specific route gates. `member` and `viewer` remain read-only; custom role storage is not implemented.
- **Invitations, SSO, and SCIM:** Not implemented. Invitation acceptance is blocked until the auth bridge source/contract and profile schema are reconciled. Neither migration track defines `users.platform_role` or `public.assign_first_platform_admin`; the Supabase track only revokes privileges on that function, while onboarding reads/calls both. A clean migration may fail and workspace bootstrap may fail at runtime. See [Enterprise Identity Design](./ENTERPRISE_IDENTITY_RBAC_SSO_SCIM_DESIGN.md).

## Implementation update — 2026-10-18 (merged to main; not yet a production release)

- **Teams and departments:** Workspace managers can create and list tenant-scoped teams, optionally assign an active employee as team manager, and add a new digital employee from a team card. Employee creation validates that the department belongs to the same workspace.
- **Role and starter catalogs:** The API and Supabase migrations use versioned workforce role templates. Sector starter provisioning writes the starter team and employees through a quota-checked database transaction. Complete replays return the existing result; a partial legacy team now returns a conflict requiring reconciliation instead of appearing successful.
- **Release gates:** PR #52 is merged to `main` (squash commit `d0349e7`) but is not a production release. Apply and verify both database migration tracks in real PostgreSQL/Supabase, then exercise tenant isolation, quota rejection, and concurrent provisioning. Three API integration tests still require an external database.

## Implementation update — 2026-10-18 (RBAC foundation; PR pending)

- **Permission resolver:** API workspace routes use named permissions through `services/api/src/permissions.js`; members/viewers are read-only, manager-level write policy is preserved, and unknown roles/permissions fail closed. Identity bootstrap and internal queue-worker processing are explicitly credential-gated exceptions, not workspace-role bypasses.
- **Regression coverage:** Task comments now require `tasks.manage` and bounded non-empty text; operations paths and permission responses are aligned with OpenAPI.
- **Invitation blocker:** No invitation endpoint is claimed as delivered. Bootstrap/profile schema artifacts are missing from both migration tracks, and the auth-bridge source remains outside the repository; repair those before accepting new accounts.

## Next enterprise gates

1. Repair and synchronize the bootstrap/profile schema: define `users.platform_role` and `public.assign_first_platform_admin` in the correct migration tracks, with the platform-admin selection policy reviewed.
2. Bring the authentication bridge source/contract under version control and verify bootstrap in clean and upgraded PostgreSQL/Supabase environments.
3. Decide whether to preserve the current one-organization-per-user model or migrate to multi-organization identities.
4. Implement email-confirmed, same-organization invitation acceptance, member management, token hashing, revocation, and copy-only delivery until an email provider is selected; then verify real tenant boundaries before enabling it.
5. Select an enterprise identity provider before implementing SSO/SCIM, and select billing markets/providers before financial collection.

## Phase 1 — Foundation
- Monorepo structure
- Web application shell
- API service
- Authentication and tenant model
- Database schema
- AI Employee domain
- Task and execution model
- Audit events

## Phase 2 — First Working AI Employee
- Employee creation wizard
- Role, goal, skills, tools, memory, permissions
- Task submission
- Planning and execution loop
- Human approval gate
- Usage and budget controls

## Phase 3 — AI Teams
- Multi-agent delegation
- Manager agent
- Shared task context
- Inter-agent handoffs
- Consolidated results

## Phase 4 — Integrations
- Generic REST connector
- Webhooks
- Email
- Google Workspace
- Microsoft 365
- CRM/ERP/POS connectors
- MCP gateway

## Phase 5 — Enterprise
- SSO/SAML
- Advanced RBAC
- SCIM
- Organization policies
- Compliance exports
- Advanced observability
- Billing and usage metering
