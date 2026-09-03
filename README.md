# ENJAZ — AI Workforce SaaS Platform

**منصة القوى العاملة الرقمية بالذكاء الاصطناعي**

ENJAZ enables organizations to create, configure, operate, and govern AI employees that perform real work inside company systems.

## Launch architecture

`Organization → Workspace → AI Employee → Task → Plan → Tool Call → Approval → Execution → Audit Event`

The production foundation includes PostgreSQL persistence, Supabase Auth, tenant-scoped access, RLS, an execution runtime, durable queue primitives, approvals, encrypted integration credentials, audit events, and a responsive Arabic RTL web console.

## Product surface

- Executive operations dashboard
- AI employee builder with role, goal, model strategy, autonomy, skills, tools, budget, policy and schedule
- Task planning and execution
- Smart teams
- Workflow execution visibility
- Human approval controls
- Integration vault
- Audit trail
- Preview mode for evaluating the product before connecting a production workspace

## Security baseline

- Tenant isolation at every data and service boundary.
- PostgreSQL RLS policies scoped by authenticated workspace membership.
- Supabase Auth identity bridge for API sessions.
- Least-privilege tool permissions and explicit approval policies.
- AI budget enforcement and API rate limits.
- Encrypted credentials using AES-256-GCM with `ENJAZ_CREDENTIALS_KEY`.
- Public health endpoint exposes only minimal liveness information.
- Operational telemetry requires authenticated manager access.
- HTTPS-only outbound webhooks with public-target validation, redirect rejection and bounded timeout.
- No secrets committed to source control.

## Reliability

- Clean-database migration chain under `services/api/db/migrations`.
- Real PostgreSQL RLS integration coverage.
- Queue leases, retries, recovery and dead-letter state.
- Idempotency constraints for execution steps.
- Graceful worker shutdown.

## Production configuration

API requires `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `DATABASE_URL`, and the encryption key for credential storage. Configure `CORS_ORIGINS` to the production web origin. Never expose database credentials or service-role/secret keys to the browser.

The web console accepts `VITE_ENJAZ_API_BASE` at build time. Without a configured API it intentionally remains in preview mode and stores preview employees locally; production data must flow through the authenticated API and PostgreSQL.

## Release gates

Before public commercial launch, verify:

1. Clean-database migration and CI pass.
2. Real Supabase Auth login and workspace membership E2E.
3. Frontend-to-API integration using a production workspace.
4. Worker/graph failure recovery and idempotency checks.
5. Staging security and performance checks.
6. Production monitoring, backups, alerting and incident procedures.

The codebase is designed to reach Release Candidate status through these gates rather than treating a successful frontend deployment alone as a production launch.