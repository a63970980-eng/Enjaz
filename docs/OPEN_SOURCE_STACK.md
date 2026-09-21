# ENJAZ Open-Source Product Stack

## Purpose

This document records the open-source components selected for ENJAZ after reviewing the current repository architecture and current GitHub ecosystem. The goal is to improve the product without introducing unnecessary dependencies or breaking the existing production paths.

## Current foundation

ENJAZ already contains:
- Supabase/PostgreSQL persistence and RLS
- AI employee runtime, planner, memory, policy and provider abstractions
- Workflow engine and scheduler
- Queue worker with leases/recovery
- Tool registry and secure tool gateway
- Credential vault and secure integrations
- Human approval lifecycle
- AG-UI integration
- OpenTelemetry and Sentry
- Responsive RTL web console and public live workforce demo

Therefore new libraries must complement these primitives rather than replace them.

## Selected additions

### UI / interaction
- Motion: use for premium interaction and workforce-card transitions where a React surface exists.
- Lucide: use for consistent product icons.
- TanStack Table: use for enterprise-grade tables when current custom tables become limiting.
- Recharts: use for operational analytics where native charts are insufficient.
- React Flow / XYFlow: use for visual execution graphs and workflow maps if/when the relevant UI is migrated to React.

### Agent runtime
- OpenAI Agents SDK (JavaScript/TypeScript): evaluate for agent implementations that need typed tools, handoffs, guardrails, sessions and tracing. Do not replace the existing runtime until an integration proves useful.
- LangGraph: evaluate for durable stateful graph workflows and human-in-the-loop execution. Prefer an adapter boundary rather than coupling the entire platform to it.
- AG-UI: already present in the API; keep it as the frontend/agent interaction boundary.

### Durable execution
- Keep the existing ENJAZ queue/worker first.
- Evaluate Inngest, Trigger.dev, Restate, or Hatchet only if the existing worker cannot satisfy a concrete durability/retry/scheduling requirement. Do not introduce a second orchestration system without a migration plan.

### Observability
- Keep OpenTelemetry + Sentry already present.
- Evaluate Langfuse or OpenLIT for LLM-specific tracing/evaluation/cost visibility if provider-level telemetry becomes insufficient.

### Quality
- Add browser E2E coverage with Playwright before major frontend architecture changes.
- Preserve existing Node test suites and production release gates.

## Important non-goals

- Do not migrate the current Vite web app to React/Next.js solely to install a UI kit.
- Do not install multiple overlapping agent frameworks.
- Do not add multiple queue/workflow engines.
- Do not replace working authentication, onboarding, Supabase, RLS, or the current worker without tests and a rollback path.
- Do not copy proprietary Salesforce assets or branding.

## Implementation order

1. Establish Playwright smoke coverage for public landing, login, signup and authenticated workspace.
2. Extract a small Enjaz design-token/component layer without changing routes or auth.
3. Introduce Motion only where it materially improves the live workforce experience.
4. Improve execution-graph visualization and operational telemetry.
5. Add a formal agent-runtime adapter and evaluate OpenAI Agents SDK / LangGraph behind that boundary.
6. Add LLM tracing/evaluation after the provider abstraction exposes the required events.
7. Reassess the stack after production measurements.

## Decision rule

Every new dependency must remove measurable complexity, improve a user-facing capability, or close a production reliability/security gap. Otherwise it stays out.
