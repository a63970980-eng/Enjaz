# ENJAZ — Global-Scale Execution Plan

**Status:** Working plan; implementation and release claims must be backed by tests and production evidence.
**Product direction:** A governed AI workforce platform plus an AI implementation/services business.
**Rule:** Preserve existing Supabase Auth, workspace membership, PostgreSQL/RLS, API contracts, execution runtime, credential vault, approvals, and audit controls unless a reviewed migration proves a change is necessary.

## 1. Product thesis

ENJAZ should help organizations deploy AI employees that complete measurable work across business systems, while giving leaders control over identity, permissions, cost, approvals, reliability, and evidence of completion. The services business should use the same platform internally to deliver customer implementations, integrations, and managed AI operations.

The product must not claim a task ran, a workflow was saved, an integration is connected, or a business outcome was achieved unless the backend has authoritative state and an auditable event for it.

## 2. Current foundation (from the repository architecture)

Already represented in the codebase:
- Organization/workspace model and tenant-scoped API access.
- Supabase Auth and PostgreSQL row-level security.
- AI employee definitions, planning, execution graph, and tool revalidation.
- Durable job queue primitives, retries/leases, idempotency, and worker recovery.
- Human approval lifecycle, budget/policy controls, encrypted integration credentials, and audit events.
- Arabic RTL-first public entry and an authenticated workspace console.
- Web/API test scripts and CI workflows.

These are architectural claims documented by the repository; each release still needs evidence from CI and a real staging environment.

## 3. Execution sequence

### Phase A — Establish a trustworthy baseline
1. Run the existing web and API test suites, lint/type checks, and production builds from a clean checkout.
2. Verify CI applies migrations to a clean PostgreSQL database and runs RLS integration tests.
3. Trace one complete staging journey: sign-in → workspace membership → create AI employee → create task → plan → approval → execute → inspect result and audit trail.
4. Record failures with reproduction steps; do not mask broken paths with preview/local data.
5. Confirm branch protections and keep all work off the main branch until human approval.

**Exit gate:** reproducible green checks plus an evidence-backed list of remaining release blockers.

### Phase B — Make the AI workforce dependable
1. Define explicit lifecycle states and failure semantics for employees, tasks, plans, tool calls, approvals, and executions.
2. Add end-to-end tests for retries, duplicate delivery, cancellation, timeouts, provider failure, and worker restart.
3. Make every external action least-privilege, tenant-scoped, budget-limited, and approval-gated according to risk.
4. Add per-task cost/latency tracking, quotas, provider routing, and visible budget exhaustion behavior.
5. Ensure every completed task has a validated output, status, timestamps, and audit events.

**Exit gate:** failure-injection tests pass and an operator can explain every execution outcome.

### Phase C — Enterprise readiness
1. Review tenant isolation and RLS with negative cross-tenant tests.
2. Add documented backup/restore drills, migration rollback strategy, retention controls, and incident response procedures.
3. Verify secret rotation, credential encryption-key recovery procedures, outbound request protections, and dependency scanning.
4. Add operational dashboards and alerts for queue age, failed jobs, provider errors, latency, spend, and approval backlog.
5. Define support boundaries, data-processing disclosures, and customer-facing security documentation.

**Exit gate:** tested recovery procedures, security review, monitoring, and a staging sign-off.

### Phase D — Product differentiation
1. Build reusable, versioned employee templates for research, engineering, sales operations, customer support, finance operations, and implementation delivery.
2. Add evaluation datasets and repeatable quality scoring for each employee template and supported model.
3. Add auditable team orchestration: task dependencies, independent review, escalation, and human checkpoints.
4. Implement saved workflow authoring only when durable workflow definitions, triggers, versioning, and execution history exist in the backend.
5. Build customer-facing reporting around verified business outcomes, not vanity AI activity metrics.

**Exit gate:** templates are tested against realistic tasks and workflow UI maps to persisted backend capabilities.

### Phase E — Global go-to-market
1. Support Arabic and English end-to-end, including authentication, onboarding, validation, errors, emails, and help content.
2. Define a narrow initial customer segment and 2–3 measurable use cases before broadening the product.
3. Operate ENJAZ internally as the first customer: delivery checklists, reusable integrations, support playbooks, and weekly outcome reviews.
4. Package paid implementation and managed-operation services around repeatable, versioned solutions.
5. Establish pricing based on value, execution volume, support level, and model/tool costs; expose usage transparently.
6. Publish clear terms, privacy and security policies, service commitments, and a reliable support channel before enterprise selling.

**Exit gate:** at least one repeatable customer workflow with measured baseline, verified improvement, and supportable unit economics.

## 4. Architecture and repository guardrails

- Do not replace the existing stack with a new framework merely for novelty.
- Do not copy a complete external application into ENJAZ without a compatibility, security, maintenance, and license review.
- Reuse external projects first as isolated prototypes or adapters; merge only the specific capabilities that fit ENJAZ's domain model.
- Preserve API compatibility and provide migrations for schema changes.
- Keep secrets out of source control and browser bundles.
- Do not merge to the main branch, deploy production, change billing, or perform irreversible data operations without explicit human approval.
- Every implementation change must state the files changed, tests run, results, and known limitations.

## 5. First implementation priorities

1. Verify the existing repository baseline and real staging journey.
2. Fix the highest-severity reproducible failures before adding more surface area.
3. Add an end-to-end test for the employee-to-audited-result path.
4. Close release-blocking security and operational gaps.
5. Only then expand templates, workflows, integrations, and commercial packaging.

## 6. Definition of done

A feature is not done because the UI renders or an AI says it finished. It is done when the relevant automated tests pass, permissions are enforced server-side, failure states are visible, outputs are persisted, audit evidence exists, documentation matches behavior, and staging verification succeeds.
