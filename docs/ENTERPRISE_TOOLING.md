# ENJAZ Enterprise Tooling Strategy

Enjaz adopts mature infrastructure selectively. The rule is **capability first, dependency second**: no library is added merely because it is popular.

## Capability map

| Capability | Preferred tool | Status / adoption rule |
|---|---|---|
| Application telemetry | OpenTelemetry | Planned after an OTLP destination is configured; keep vendor-neutral. |
| Metrics | Prometheus | Planned when production metrics need a durable time-series backend. |
| Dashboards | Grafana | Planned for operations; never replace the product UI. |
| Distributed tracing | Grafana Tempo / OTEL-compatible backend | Planned with meaningful service boundaries. |
| Authorization | OpenFGA | Staged; current Supabase RLS remains the primary tenant boundary until resource relationships require ReBAC/FGA. |
| Durable workflows | Temporal | Staged; introduce only for long-running workflows that cannot safely live inside HTTP/queue execution. |
| Event transport | NATS | Staged; introduce when asynchronous service/event traffic becomes material. |
| AI observability | Langfuse | Staged; introduce when customer-facing agent execution requires trace/evaluation controls. |
| Model gateway | LiteLLM | Staged; use when provider routing, fallback, budgets, and model policy need a single control plane. |
| Semantic retrieval | Qdrant | Staged; add only for customer knowledge/memory workloads that justify vector search. |
| Product analytics | PostHog | Staged; define Enjaz event taxonomy before deployment. |
| Feature control | Unleash | Staged; use for progressive delivery and safe kill switches. |
| Visualization | Apache ECharts | Staged; use for operational/business analytics inside Enjaz. |
| Browser QA | Playwright | **Implemented** for critical public experience checks. |
| Accessibility | axe-core | **Implemented** in Playwright quality gates. |
| Static security | CodeQL / Semgrep | **Implemented** in GitHub security CI. |
| Secrets | Gitleaks | **Implemented** in GitHub security CI. |
| Dependency/container scan | Dependency Review / Trivy | **Implemented** in GitHub security CI. |

## Current hardening baseline

- Tenant isolation is enforced through Supabase RLS and server-side workspace access checks.
- Client-side authenticated requests cannot change protected identity, workspace, or privileged membership fields.
- Request authentication never falls back to a Supabase service-role key.
- API requests have rate limiting, request IDs, bounded request bodies, security response headers, and explicit CORS allowlisting.
- Critical browser journeys have automated E2E and accessibility coverage.
- Security gates run Semgrep, CodeQL, Gitleaks, and Trivy.
- Vite and esbuild are kept above the currently affected security releases rather than using forced audit fixes.

## Non-negotiable architecture rules

1. Do not migrate the current Vanilla JS/Vite product to React only to adopt a UI library.
2. Do not introduce distributed infrastructure before the corresponding reliability/scaling problem exists.
3. Every new integration must have an owner, timeout, retry policy, failure state, and audit trail.
4. AI providers must remain replaceable; model choice must not become a business-domain dependency.
5. Sensitive tool execution must be policy-controlled independently of model output.
6. Observability must correlate user/workspace, request, task, workflow, execution, and provider identifiers without logging secrets.
7. New infrastructure must be removable without rewriting the core product domain.
