# ENJAZ — Platform architecture and release map

_Last reviewed: 2026-10-16_

## Product boundary

ENJAZ is an Intelligent Enterprise Operating Platform. The public experience is only the entry point; the product boundary is the authenticated workspace and its governed runtime.

```text
Organization → Workspace → AI Employee → Task → Plan → Tool Call
→ Approval → Execution → Result → Audit Event
```

The UI must never imply that a public preview is a connected customer account or a completed execution. Preview surfaces are labelled `معاينة المنتج / PREVIEW`; workspace values are read from the authenticated API.

## Runtime map

| Layer | Implemented source of truth | Notes |
| --- | --- | --- |
| Public / auth | `apps/web/src/App.tsx`, `apps/web/workspace.html`, `apps/web/src/WorkspaceApp.tsx`, `apps/web/auth-client.js` | RTL-first public entry; sign-in, email confirmation, workspace bootstrap, sector provisioning and Workspace UI use the existing Supabase/API clients. |
| Web shell | `apps/web/vite.config.js`, `apps/web/src/workspace-main.tsx`, `apps/web/src/WorkspaceApp.tsx` | Multi-page Vite build emits the public pages and the authenticated Workspace document. |
| API edge | `services/api/src/index.js`, `api/*.js` | HTTP API with request IDs, CORS allow-list, rate limits, auth and workspace checks. |
| Identity | Supabase Auth + `auth-client.js` + `enjaz-auth-bridge` | Browser stores session tokens only; service credentials are not exposed. |
| Tenant boundary | `workspace_members`, workspace-scoped repository queries, PostgreSQL RLS | UI filtering is not the security boundary. |
| Workforce | `workforce-repository.js`, `industry-provisioning.js` | Employee definitions, goals, knowledge, schedules, policies and usage are persisted. |
| Planning | `brain-orchestrator.js`, `employee-planner.js`, `model-provider.js` | Plans are bounded and validated against the assigned tool catalog. |
| Execution | `agent-runtime.js`, `execution-graph.js`, `plan-executor.js` | Tool calls are separated from model planning and revalidated at execution time. |
| Governance | `ai-employee-policy.js`, approval lifecycle, budgets, permissions | High-risk actions require approval; approvals are tenant scoped and auditable. |
| Durability | `job-queue.js`, `queue-worker.js`, worker recovery and leases | Queue claims, retries, cancellation, idempotency and dead-letter behavior are covered by tests. |
| Integrations | `credentials-vault.js`, `secure-tool-gateway.js`, `integrations/` | Encrypted credentials stay server-side; list responses return connection metadata, not secrets. |
| Audit / observability | `audit_events`, runtime metrics, OpenTelemetry/Sentry adapters | Workspace and employee views expose activity without bypassing API authorization. |
| Data | API migrations under `services/api/db/migrations` and Supabase migrations | PostgreSQL is canonical for production data; no frontend mock store is used in the authenticated path. |

## Workspace surfaces

The current authenticated portal is intentionally narrower than the platform API and maps only implemented UI surfaces to real API resources:

- **Command Center:** runtime summary, employee/task counts, pending approvals and recent audit events.
- **Digital Workforce:** read-only employee list from the selected workspace; sector provisioning uses the canonical industry-pack service.
- **Operations:** managers can create workspace-scoped tasks, then explicitly start planning/execution. The UI discloses that permitted steps may run and that sensitive actions remain approval-gated.
- **Governance:** managers can approve or reject pending actions through the API; the server records the decision and audit event.
- **Read-only access:** non-manager memberships see data but do not receive manager-only task or approval controls; API authorization remains the actual security boundary.

Membership administration is represented: the Members and Permissions surface lists workspace members, changes roles, removes members, issues/revokes copy-only invitations and accepts an invitation through `?invite=<token>`; the API enforces `members.read`, `members.invite` and `members.manage` and guards the last manager. Saved workflow design, integrations management, global search, email delivery of invitations and enterprise identity administration (SSO/SCIM) are not represented as completed UI capabilities in this portal yet, even where backend primitives exist.

## Industry provisioning

The onboarding and catalog UI use the backend's canonical five public sector pack IDs:

| ID | Arabic label |
| --- | --- |
| `restaurant` | المطاعم |
| `hospital` | المستشفيات |
| `hotel` | الفنادق |
| `enterprise` | الشركات |
| `government` | الجهات الحكومية |

Provisioning is idempotent at the workspace + pack boundary and writes departments, AI employees, goals, knowledge and an audit event in a transaction. The web catalog filters its display to these five user-facing packs; it does not invent a sixth marketing sector.

## Security and reliability preserved

This product completion phase does not alter Supabase Auth, database migrations, RLS policies, tenant checks, API contracts, execution graph semantics, worker recovery, credential encryption, rate limiting, idempotency or environment variable names. The new portal uses the existing auth client, workspace-scoped API methods and industry provisioning contract; UI role checks improve clarity but do not replace server authorization.

Sensitive actions remain approval-gated. Outbound webhook validation, tool allow-lists, model plan validation, workspace ownership checks and queue lease protections remain backend concerns.

## Deployment map

- `apps/web/vite.config.js` binds preview development to `0.0.0.0`, permits the Arena/Vercel host and emits the public and authenticated HTML entry points.
- Root `vercel.json` builds the web output and bundles `services/api/src/index.js` into `api/server.cjs`; rewrites preserve `/api/v1/*` contracts.
- `.github/workflows/web-ci.yml` runs web contract tests, Vite build, Playwright public E2E and axe checks.
- `.github/workflows/api-ci.yml` provisions PostgreSQL roles/extensions, applies migrations and runs the API suite.
- Environment variables are documented in `apps/web/.env.example` and `services/api/.env.example`; secrets are never placed in browser code.

## Known release boundaries

A clean frontend build and mocked browser E2E do not prove that a production Supabase project, AI provider, worker, database backup policy or Vercel environment is configured. Release still requires real-environment auth/workspace E2E, migrations, worker health, monitoring, provider credentials and Vercel Preview/Production checks. The current portal is the first connected workspace slice, not full Salesforce parity.

The workflow composer is deliberately a governed task-entry surface until a persisted trigger/workflow authoring API exists. It must not be presented as a saved workflow when only an execution graph has been created.
