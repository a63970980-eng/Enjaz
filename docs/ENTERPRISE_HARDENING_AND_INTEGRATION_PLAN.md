# ENJAZ enterprise hardening and open-source integration decisions

Reviewed: 2026-10-11

## Integration rule

ENJAZ remains the product and system of record. Adopt only narrowly scoped patterns that close a verified gap in the existing Node.js, React/Vite, PostgreSQL and Supabase architecture. Do not import a second control plane, auth system, database engine or worker runtime when it duplicates current capabilities.

## Reference review

| Project | License observed | Useful pattern | Decision |
| --- | --- | --- | --- |
| [Bizbox](https://github.com/zesthq/bizbox) | MIT | Company-scoped operations, budgets, governance, agent state, audit trails, templates | Use as a product-design reference for goal lineage and governance. Do not fork its control plane; it is itself a Paperclip fork and duplicates ENJAZ workforce, queue, approvals and dashboard capabilities. |
| [Paperclip](https://github.com/paperclipai/paperclip) | MIT | Agent adapters, atomic task checkout, heartbeats, budgets and cost visibility | Study adapter and run lifecycle contracts. Prefer compatibility adapters over importing the full React/Express/Drizzle stack. |
| [DuraGraph](https://github.com/Duragraph/duragraph) | Apache-2.0 | Event-sourced durable execution, replayability and tracing | Use as an architecture reference for workflow replay. Its Go control plane and NATS introduce a substantial second stack; defer wholesale integration until measured limitations justify it. |
| [oc8](https://github.com/oc8-ai/oc8) | LGPL-3.0 reported by repository metadata | Tenant isolation, approvals and MCP integration | Do not copy source into the commercial core until licensing obligations are reviewed for the intended distribution model. |
| [ForgeFlow](https://github.com/JoelJohnsonThomas/ForgeFlow) | Verify before copying | Graph orchestration and human checkpoints | Compare individual contracts with ENJAZ execution graph and workflow engine; avoid adding a second graph engine. |

License metadata and upstream behavior can change. Re-check each repository's current LICENSE, notices and source before copying code. This is an engineering decision record, not legal advice.

## ENJAZ foundations to preserve

- Authenticated workspaces and PostgreSQL row-level security.
- AI employee provisioning, tool allow-lists and per-employee policy.
- Task planning, execution graphs, human approvals, audit events and runtime metrics.
- Durable queue claims, leases, retries, cancellation, idempotency and dead-letter inspection.
- Encrypted integration credentials and guarded outbound requests.
- Industry provisioning packs and Arabic RTL workspace UI.

## Enterprise workstreams

### P0 — Correctness and spend containment

- Bound retry budgets and ensure crashed workers cannot retry forever after maximum attempts.
- Test idempotency under concurrent enqueue and concurrent approval execution.
- Add failure-injection coverage for worker death, expired leases, duplicate delivery, cancellation and shutdown.
- Verify budget charges are idempotent across retry and replay paths.
- Ensure execution and approval transitions are scoped by workspace and entity identifiers.

### P1 — Tenant and identity boundaries

- Run cross-workspace negative tests for employees, tasks, approvals, integrations, memories, metrics, audit events and exports.
- Verify server-derived workspace membership is authoritative; client-supplied workspace IDs are never sufficient authorization.
- Test isolation at both API and PostgreSQL RLS layers.
- Review service-role access, token lifetime, CORS, rate limits, webhook SSRF defenses and secret redaction.
- Document a threat model and incident-response checklist.

### P2 — Durable workflow operations

- Define a canonical event envelope with event ID, workspace ID, aggregate ID, event type, schema version, timestamp, actor, correlation ID and causation ID.
- Correlate queue jobs, graph steps, tool calls, approval decisions, metrics and audit records.
- Replay workflows without repeating non-idempotent side effects unless fresh authorization succeeds.
- Measure queue age, lease expiry, retry count, dead-letter rate and approval-wait duration; define alert thresholds.
- Provide a human-readable run timeline and downloadable execution evidence.

### P3 — Product and integrations

- Define an external-agent adapter contract for capabilities, health, invocation, timeout, cancellation, usage/cost reports and sanitized output.
- Show provider readiness explicitly; never imply a model is configured when credentials are missing.
- Test integration auth, pagination, rate limits, token rotation, webhook signatures and revocation.
- Version workspace template export/import; make it idempotent and scrub secrets by default.
- Do not claim workflow definitions are saved unless the API persists the definition and version.

### P4 — Commercial readiness

- Meter usage and reconcile billing from durable execution records, not browser state.
- Make subscription event handling idempotent across retries, refunds, cancellations and plan changes.
- Test backup restore, migration strategy, monitoring, alert routing and recovery runbooks.
- Load-test queue throughput, tenant queries, API p95 latency and provider concurrency.
- Complete Arabic RTL accessibility, mobile usability and end-to-end onboarding.

## Acceptance gates

1. Unit and contract tests pass.
2. Migrations and RLS tests pass on a clean PostgreSQL database.
3. Cross-tenant denial tests pass.
4. Failure-injection and idempotency tests pass.
5. Web/API end-to-end tests pass against staging configuration.
6. Security and performance results are recorded.
7. Operational runbooks and rollback steps exist.

## Current branch change

Stale-lease recovery previously requeued every expired running job, even after attempts reached max_attempts. A worker crash could therefore bypass the retry ceiling enforced by normal failure handling and repeat work indefinitely. This branch dead-letters exhausted stale jobs, records a diagnostic reason, bounds retry limits at enqueue time to integers from 1 through 20, and reconciles exhausted employee-step jobs into failed execution-step, graph and task states. Reconciliation is repeatable across worker restarts so a crash during cleanup can be repaired on a later poll. Tests cover retry bounds, idempotency-key behavior, stale recovery invariants and worker reconciliation; the complete repository CI result still must be checked. It preserves ENJAZ's existing architecture rather than replacing it with a competing platform.
