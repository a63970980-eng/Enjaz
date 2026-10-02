# ENJAZ — Platform architecture and release map

_Last reviewed: 2026-10-02_

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
| Public / auth | `apps/web/landing.js`, `apps/web/landing.css`, `apps/web/auth-gate-v2.js` | RTL-first public experience; CTAs enter the real Supabase auth and onboarding path. |
| Web shell | `apps/web/app-entry-v2.js`, `apps/web/workspace-app-v4.js` | Vite + vanilla ES modules. V4 is the canonical authenticated shell. |
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

The V4 shell intentionally maps product surfaces to real API resources:

- **Command Center:** runtime summary, employees, tasks, approvals and recent audit events.
- **Digital Workforce:** real employee records; sector catalog provisions roles, departments, skills, tools, goals, knowledge and policies.
- **AI Employee Builder:** creates an employee through `POST /api/v1/employees` with role, goal, model strategy metadata, autonomy, skills, tools, budget, policy and schedule. The server remains authoritative for permissions.
- **Operations:** creates tasks, plans them through the AI route, runs them through the execution runtime, and opens Task 360 for inputs, plan, output and governance state.
- **Workflow Control:** visualizes the actual execution contract. The composer creates a real task; planning produces the persisted execution graph. It does not claim to persist an unimplemented workflow designer.
- **Governance:** approvals and audit are backed by the approval lifecycle and `audit_events`.
- **Integrations:** catalog plus real vault connections; credentials are write-only from the UI.
- **Analytics:** derives completion, execution and workforce-load indicators from loaded task/employee data. Empty states are explicit when no data exists.

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

This product completion phase does not alter Supabase Auth, database migrations, RLS policies, tenant checks, API contracts, execution graph semantics, worker recovery, credential encryption, rate limiting, idempotency or environment variable names. The key product fix was aligning frontend sector IDs with the existing provisioning registry so onboarding reaches the actual backend pack.

Sensitive actions remain approval-gated. Outbound webhook validation, tool allow-lists, model plan validation, workspace ownership checks and queue lease protections remain backend concerns.

## Deployment map

- `apps/web/vite.config.js` binds preview development to `0.0.0.0` and permits the Arena/Vercel host.
- Root `vercel.json` builds the web output and bundles `services/api/src/index.js` into `api/server.cjs`; rewrites preserve `/api/v1/*` contracts.
- `.github/workflows/web-ci.yml` runs web contract tests, Vite build, Playwright public E2E and axe checks.
- `.github/workflows/api-ci.yml` provisions PostgreSQL roles/extensions, applies migrations and runs the API suite.
- Environment variables are documented in `apps/web/.env.example` and `services/api/.env.example`; secrets are never placed in browser code.

## Known release boundaries

A clean frontend build and contract suite do not prove that a production Supabase project, AI provider, worker, database backup policy or Vercel environment is configured. Release still requires real-environment auth/workspace E2E, migrations, worker health, monitoring, provider credentials and Vercel Preview/Production checks.

The workflow composer is deliberately a governed task-entry surface until a persisted trigger/workflow authoring API exists. It must not be presented as a saved workflow when only an execution graph has been created.
