# ENJAZ product architecture audit

_Date: 2026-10-02_

## Runtime map

`Supabase Auth → workspace membership → authenticated web shell → workspace-scoped API → PostgreSQL/RLS → queue/worker → governed tools → audit`

- **Web:** Vite and framework-free ES modules under `apps/web`. `main.js` separates the public/auth route from the authenticated application. `auth-gate-v2.js` restores Supabase sessions and membership; `app-entry-v2.js` waits for an authenticated workspace; `workspace-app-v4.js` is the canonical workspace UI.
- **API:** Node HTTP service under `services/api/src/index.js`, with server-side authentication, role checks and workspace scoping. The root `api/` files adapt this service to serverless deployment.
- **Persistence:** PostgreSQL migrations in `services/api/db/migrations` plus Supabase deployment migrations. Tenant records use workspace scope and RLS. Runtime, billing, workforce, approvals, integrations and audit are persisted rather than inferred in the browser.
- **Execution:** tasks move through planning, policy, approval, queue, execution graph and audit modules. Tools are registered separately from model reasoning and pass through policy/security gateways.
- **AI workforce:** employee definitions, goals, knowledge, model strategy, policy, routines, schedules, usage and memory are separate from task/execution history. Industry provisioning creates departments, governed employee templates and knowledge.
- **Integrations:** the vault stores encrypted credentials server-side. API list responses omit credentials. UI connection status comes from returned integration records.

## Product relationships

`Organization → Workspace → Departments/Teams → Human members + AI employees → Tasks → Plans/Workflows → Tool calls → Approval gates → Executions → Audit events`

Industry configuration sits above this chain and provisions vocabulary, departments, roles, employee policies and knowledge. Governance spans the full chain through membership roles, employee policy, budgets, approval requirements, credential boundaries and audit events.

## Preserved core

This phase does not modify authentication, Supabase configuration, database schemas/migrations, API contracts, execution runtime, environment handling, RLS, industry provisioning or backend business logic. Public calls to action still enter the existing auth/onboarding path, which provisions one of the five existing sector packs.

## Legacy visual-layer findings

The previous public experience was assembled by `enjaz-public-v1` and then mutated by v2/v3/v4 scripts plus a remote Three.js/GSAP/Lenis/postprocessing runtime. It contained illustrative values presented as live results and loaded several remote runtime dependencies. Those modules remain in the repository for traceability, but are no longer loaded by `index.html`.

The authenticated workspace still depends on the existing workspace, workforce, employee 360, auth and compatibility styles/modules. They were intentionally retained. A later cleanup should remove a file only after an import/reference graph and authenticated E2E coverage prove it is unused.

## Current experience contract

- Public preview is explicitly labelled **PREVIEW / معاينة المنتج** and contains no customer, revenue, growth, testimonial or outcome claims.
- Ecosystem items are described as available capability classes, not connected accounts.
- The public experience is RTL-first, responsive at tablet/mobile breakpoints, keyboard reachable and reduced-motion aware.
- Auth and workspace remain real paths; no public UI action simulates backend success.

## Verification

- Production Vite build passes.
- Web contract tests pass.
- API suite passes: 137 tests, 134 passed and 3 environment-dependent integration tests skipped.
- No database or API contract was changed in this phase.
