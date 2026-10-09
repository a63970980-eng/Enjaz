# ENJAZ Infrastructure Reliability Baseline

**Status:** working hardening branch; not yet merged or production-certified.  
**Scope:** API runtime, database connections, security headers, automated analysis, and CI boundaries. The visual interface is intentionally out of scope.

## Current architecture observed

- Node.js API with PostgreSQL persistence and Supabase Auth identity verification.
- Workspace-scoped access checks and PostgreSQL row-level security policies.
- PostgreSQL-backed jobs, retries, lease recovery, execution graphs, approval gates, and audit events.
- Encrypted integration credentials and a governed tool registry.
- Vercel serverless entry points and GitHub Actions for API/web verification.

These are architectural components, not proof that every production path has been load-tested or security-certified.

## Changes in this branch

1. **Database transport and resource bounds**
   - Verify database TLS certificates by default; private CA material can be supplied through `DATABASE_CA`.
   - Use a conservative default pool size and configurable, validated pool/time limits.
   - Set statement, query, connection, and idle-transaction timeouts to prevent runaway database work.
   - Fail fast for invalid pool configuration instead of silently accepting malformed values.

2. **Failure-data redaction**
   - Reject production database configurations that disable TLS or certificate verification.
   - Fail closed on malformed TLS boolean flags instead of treating typos as permission to skip certificate verification.
   - Persist stable queue error identifiers rather than raw exception messages in job failure records, attempt history, or worker responses; this reduces the risk of credentials, internal URLs, and provider response details leaking into operational tables.

3. **API response hardening**
   - Add a restrictive Content Security Policy appropriate for JSON API responses.
   - Mark API responses `Cache-Control: no-store` to reduce accidental caching of sensitive workspace data.
   - Add contract assertions for the required security headers.

4. **CI responsibility boundaries**
   - Keep API security tests independent from the web entry-point files so backend CI can validate backend contracts without coupling to a UI file.
   - Validate deployment security headers against the Vercel configuration in the web package.

5. **Supply-chain security baseline**
   - Add scheduled CodeQL analysis for JavaScript/TypeScript.
   - Add weekly Dependabot updates for the pnpm workspace and GitHub Actions.

## Known gaps requiring follow-up

- **Clean-install/upgrade migration parity:** run all migrations against a fresh PostgreSQL instance and against a representative upgrade snapshot; verify the live schema matches repository queries. Recent CI history included a missing `ai_employees.role_code` column error, so this remains a release blocker until reproduced and resolved in CI.
- **Build gate:** the inspected `main` branch had a missing Vite `index.html` entry point. This branch does not restore or redesign the visual layer; the web build must be repaired in a separate, explicit workstream before a production release.
- **Distributed rate limiting:** current rate limiting is process-local. It does not provide a shared quota across multiple serverless instances; production-grade enforcement needs a shared store or edge/WAF policy.
- **Worker separation:** verify the worker token rotation, scope, revocation, and cron-only invocation model; ensure the public API cannot be used to create unbounded worker execution.
- **Tenant-isolation proof:** expand negative tests across every tenant-owned resource, including approvals, tasks, integrations, usage, audit records, memory, and job execution.
- **Operational readiness:** add production alerts, queue-depth/dead-letter monitoring, database saturation signals, SLOs, backup/restore drills, and incident runbooks.
- **Release controls:** require successful CI, review, and a deploy smoke test before merging. This branch has not been merged or deployed.

## Release gate

Do not describe ENJAZ as production-ready until clean database migration, API tests, web build, tenant-isolation tests, and a deployed smoke test all pass on the same commit.
