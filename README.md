# ENJAZ — AI Workforce SaaS Platform

**منصة القوى العاملة الرقمية بالذكاء الاصطناعي**

ENJAZ enables organizations to create, configure, operate, and govern AI employees that perform real work inside company systems.

## Product Principles

- AI employees are task-oriented, tool-enabled, permissioned, budgeted, and auditable.
- Human approval remains required for sensitive operations.
- Every organization is isolated through a multi-tenant workspace model.
- Execution is separated from the business/product layer.
- LinkWork is treated as an execution/infrastructure layer, not the ENJAZ product itself.

## Core Domain

`Organization → Workspace → AI Employee → Task → Plan → Tool Call → Approval → Execution → Audit Event`

## Runtime Architecture

```text
ENJAZ
├── Web App
├── API + Auth boundary
├── PostgreSQL + RLS
├── AI Employee Runtime
│   ├── Policy enforcement
│   ├── Tool registry
│   ├── Memory
│   └── Budget controls
├── Execution Graph
├── Durable Job Queue
│   ├── Leasing
│   ├── Retries
│   ├── Recovery
│   └── Idempotency
├── Workflow / Integration Layer
├── Governance + Approvals
├── Audit + Operations
└── LinkWork execution/infrastructure layer
```

## Security Baseline

- Tenant isolation at every data and service boundary.
- PostgreSQL RLS policies scoped by authenticated workspace membership.
- Database-level workspace integrity for execution graphs.
- Least-privilege tool permissions.
- Explicit approval policies for sensitive actions.
- AI budget enforcement and API rate limits.
- Encrypted credentials using AES-256-GCM with a 32-byte master key supplied through `ENJAZ_CREDENTIALS_KEY`.
- Public health endpoint intentionally exposes only minimal liveness information.
- Operational telemetry requires authenticated manager access and workspace-scoped queue data.
- Outbound webhook execution is HTTPS-only, blocks non-public targets, rejects redirects, limits methods, and has a 10-second timeout.
- Secrets are never committed to source control.

## Reliability

- Row-level tenant isolation is covered by real PostgreSQL RLS integration tests.
- Queue workers use leases and renewal to prevent premature stale recovery.
- Failed jobs use bounded exponential backoff and dead-letter state.
- Execution steps use idempotency constraints to reduce duplicate execution.
- Worker shutdown is graceful and records offline state.

## Development

### API

```bash
cd services/api
npm install
npm run migrate
npm test
npm start
```

The API test suite includes security contracts, credential encryption, rate limiting, RLS isolation, execution policy, approval lifecycle, and workforce E2E coverage.

### CI

GitHub Actions runs the API test environment against PostgreSQL 16, prepares Supabase-compatible Auth roles for the isolated test database, applies migrations from an empty database, and then executes the API tests.

> Note: commits created through the connected GitHub integration may not create a new Actions run automatically because GitHub suppresses workflow recursion for token-generated events. A developer push or manual workflow run can be used to execute the pipeline against the latest commit.

## Release Readiness

The project is being hardened toward Release Candidate status. Before production launch, the remaining gates are a successful clean-database CI run, real Auth/RLS E2E validation, worker/graph failure-recovery validation, frontend-to-API integration verification, and staging deployment with security/performance checks.
