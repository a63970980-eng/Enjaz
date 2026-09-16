# ENJAZ Enterprise Tooling Strategy

Enjaz should adopt mature open-source infrastructure selectively. The rule is **capability first, dependency second**: no library is added merely because it is popular.

## Capability map

| Capability | Preferred tool | Adoption rule |
|---|---|---|
| Application telemetry | OpenTelemetry | Instrument API/runtime boundaries first; remain vendor-neutral. |
| Metrics | Prometheus | Add when production metrics need a durable time-series backend. |
| Dashboards | Grafana | Operational dashboards; never replace the product UI. |
| Distributed tracing | Grafana Tempo / OTEL-compatible backend | Add with meaningful service boundaries. |
| Authorization | OpenFGA | Introduce when role/resource relationships exceed simple workspace roles. |
| Durable workflows | Temporal | Introduce for long-running/retryable workflows that cannot safely live inside HTTP requests. |
| Event transport | NATS | Introduce when asynchronous service/event traffic becomes material. |
| AI observability | Langfuse | Add when multi-model/agent execution becomes customer-facing and requires trace/evaluation controls. |
| Model gateway | LiteLLM | Use when provider routing, fallback, budgets, and model policy need a single control plane. |
| Semantic retrieval | Qdrant | Add only for customer knowledge/memory workloads that justify vector search. |
| Product analytics | PostHog | Use for activation, retention, funnels, experiments, and product diagnostics. |
| Feature control | Unleash | Use for progressive delivery and safe kill switches. |
| Visualization | Apache ECharts | Use for operational/business analytics inside Enjaz. |
| Browser QA | Playwright | Required for critical user journeys before production promotion. |
| Accessibility | axe-core | Required in browser quality gates. |
| Static security | CodeQL / Semgrep | Run continuously; production code must pass security gates. |
| Secrets | Gitleaks | Block accidental credential commits. |
| Dependency/container scan | Dependency Review / Trivy | Block high-severity known vulnerabilities where practical. |

## Non-negotiable architecture rules

1. Do not migrate the current Vanilla JS/Vite product to React only to adopt a UI library.
2. Do not introduce distributed infrastructure before the corresponding reliability/scaling problem exists.
3. Every new integration must have an owner, timeout, retry policy, failure state, and audit trail.
4. AI providers must remain replaceable; model choice must not become a business-domain dependency.
5. Sensitive tool execution must be policy-controlled independently of model output.
6. Observability must correlate user/workspace, request, task, workflow, execution, and provider identifiers without logging secrets.
7. New infrastructure must be removable without rewriting the core product domain.

## Current implementation status

The repository now has security quality gates and automated dependency update configuration. Runtime observability, fine-grained authorization, durable workflows, AI observability, and event infrastructure will be introduced only after their exact integration boundaries are audited and tested.
