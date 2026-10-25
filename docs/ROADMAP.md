# ENJAZ Roadmap

## Implementation update — 2026-10-25 (second pass: isolation, execution, real signup)

- **Tenant isolation enforced in the database:** RLS was enabled on `users`, `organizations`, `workspaces` and `workspace_members` (their policies existed but were inert), with definer-backed membership predicates and a schema sweep test that fails if any workspace-scoped table loses enforcement.
- **AI execution repaired and proven end to end:** the planner no longer queries a non-existent column, planning tokens are measured and bounded per task, and `test/ai-execution.e2e.test.js` runs plan → execution graph → queue → tools → stored result plus the human-approval gate on PostgreSQL.
- **Integrations work again:** the credential vault uses the real `name` column and revocation uses a status the constraint accepts; duplicate connection names return a clear 409.
- **Authentication is self-contained:** signup and password recovery call Supabase Auth directly, `/api/v1/auth/me` is the authoritative session source, and the external `enjaz-auth-bridge` is now optional. A real Supabase round trip is still unverified.
- **Verification record:** see the second-pass section of [Release readiness 2026-10-25](./RELEASE_READINESS_2026-10-25.md).

## Implementation update — 2026-10-25 (membership + clean-install bootstrap repair)

- **Clean-install blocker fixed:** migration `034_workspace_identity_and_invitations.sql` (mirrored to Supabase as `20261025120000_workspace_identity_and_invitations.sql`) defines `users.platform_role` and `public.assign_first_platform_admin(uuid)`, which `onboarding-repository.bootstrapWorkspace()` already required. Before this change, the first workspace of a new customer could not be created on any clean database. Verified by applying the full migration chain to an empty PostgreSQL database and running real workspace bootstrap (first user becomes platform admin, replay is idempotent).
- **Member management and invitations:** the API now exposes `/api/v1/members`, `/api/v1/members/{userId}` (PATCH/DELETE), `/api/v1/members/invitations` (GET/POST), `/api/v1/members/invitations/{id}/revoke` and `/api/v1/members/invitations/accept`, gated by the centralized `MEMBERS_READ`, `MEMBERS_INVITE` and `MEMBERS_MANAGE` permissions. Invitation tokens are stored only as SHA-256 hashes, are bound to the invited email address, expire after seven days, and are shown once to the inviter (copy-only delivery). A workspace can never lose its last manager.
- **Workspace console:** a Members and Permissions surface lists members, changes roles, removes members, issues and revokes invitations, and accepts an invitation through `?invite=<token>` on the workspace document. An Integrations surface lists, connects and revokes encrypted service credentials with an explicit scope disclosure; the server-side tool layer remains the execution boundary.
- **Verification record:** see [Release readiness 2026-10-25](./RELEASE_READINESS_2026-10-25.md) for the exact checks executed, their results, and the blockers that still require external accounts or secrets.
- **Known limitation:** an identity that already belongs to another organization is refused with `INVITATION_ORGANIZATION_CONFLICT`; joining a second organization needs the multi-organization identity decision below. Invitations are not emailed yet because no transactional email provider is configured.

## Implementation snapshot — 2026-10-18

- **Workspace employee builder:** Implemented on `main` in PR #52 (not yet production-deployed). It uses the workforce/tool catalog endpoints when available, falls back to a custom role if the role catalog is unavailable, and preserves explicit tool assignment and the existing human-approval policy.
- **Recurring automations:** Workspace UI is connected to the existing routine API and scheduler; managers can create, pause, and resume routines.
- **Analytics and billing:** Initial usage dashboard is implemented. It reads current runtime, subscription, and limit data; it does **not** issue invoices or collect payments. See [Analytics and Billing Design](./ANALYTICS_AND_BILLING_DESIGN.md).
- **Access-control baseline:** Implemented in the current RBAC feature branch; review/merge is pending. It uses a centralized, deny-by-default API permission resolver and domain-specific route gates. `member` and `viewer` remain read-only; custom role storage is not implemented.
- **Invitations, SSO, and SCIM:** Invitations and member management are implemented as of 2026-10-25 (see the update above); SSO and SCIM remain unimplemented. The profile schema gap (`users.platform_role`, `public.assign_first_platform_admin`) is repaired in both migration tracks, and the earlier Supabase-only `REVOKE` now tolerates being applied before the function exists. The `enjaz-auth-bridge` Supabase function that the browser uses for signup and `/me` is still **not in this repository**; it remains a release blocker for a self-contained deployment. See [Enterprise Identity Design](./ENTERPRISE_IDENTITY_RBAC_SSO_SCIM_DESIGN.md).

## Implementation update — 2026-10-18 (merged to main; not yet a production release)

- **Teams and departments:** Workspace managers can create and list tenant-scoped teams, optionally assign an active employee as team manager, and add a new digital employee from a team card. Employee creation validates that the department belongs to the same workspace.
- **Role and starter catalogs:** The API and Supabase migrations use versioned workforce role templates. Sector starter provisioning writes the starter team and employees through a quota-checked database transaction. Complete replays return the existing result; a partial legacy team now returns a conflict requiring reconciliation instead of appearing successful.
- **Release gates:** PR #52 is merged to `main` (squash commit `d0349e7`) but is not a production release. Apply and verify both database migration tracks in real PostgreSQL/Supabase, then exercise tenant isolation, quota rejection, and concurrent provisioning. Three API integration tests still require an external database.

## Implementation update — 2026-10-18 (RBAC foundation; PR pending)

- **Permission resolver:** API workspace routes use named permissions through `services/api/src/permissions.js`; members/viewers are read-only, manager-level write policy is preserved, and unknown roles/permissions fail closed. Identity bootstrap and internal queue-worker processing are explicitly credential-gated exceptions, not workspace-role bypasses.
- **Regression coverage:** Task comments now require `tasks.manage` and bounded non-empty text; operations paths and permission responses are aligned with OpenAPI.
- **Invitation blocker:** No invitation endpoint is claimed as delivered. Bootstrap/profile schema artifacts are missing from both migration tracks, and the auth-bridge source remains outside the repository; repair those before accepting new accounts.

## Next enterprise gates

1. ~~Repair and synchronize the bootstrap/profile schema~~ — done 2026-10-25 in both migration tracks.
2. ~~Remove the signup dependency on the external authentication bridge~~ — done 2026-10-25; verify the real Supabase confirmation and recovery emails on a provisioned project.
3. Decide whether to preserve the current one-organization-per-user model or migrate to multi-organization identities (invitation acceptance currently refuses cross-organization identities).
4. Connect a transactional email provider so invitations are delivered directly instead of copy-only; the token flow and membership enforcement are already implemented and verified.
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
