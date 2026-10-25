# PostHog product analytics — ENJAZ workspace activation

This note records one product question, the event contract that answers it, and the
verification evidence for the PostHog integration in the Workspace portal. Analytics is
consent-gated and sends nothing until a member of the workspace explicitly allows it.

## Repository facts

| Item | Value |
| --- | --- |
| packageManager | `pnpm@10.34.5` (declared in root `package.json`) |
| Lockfile | `pnpm-lock.yaml` at the repository root (lockfileVersion 9.0) — the only lock in the repo |
| Workspace layout | `pnpm-workspace.yaml` → `apps/*`, `packages/*`, `services/*` |
| SDK-importing package | `apps/web` (`enjaz-platform`, Vite + React 19) |
| API service | `services/api` (`@enjaz/api`) — no analytics SDK added |
| Node | v22.23.3 (root `engines`: `>=22 <25`) |
| TypeScript | `^5.9.3` (in `apps/web`) |
| Browser SDK | `posthog-js` `1.438.13`, pinned exactly in `apps/web/package.json` |

Conflicting-manager check: root `package.json` has a `workspaces` field, which npm would
honour, but every package is declared in `pnpm-workspace.yaml` and the single committed lock
is `pnpm-lock.yaml`; there is no `yarn.lock`, `package-lock.json` or `bun.lockb`. Commands
below are run with pnpm, never with npm/yarn/bun installs.

### Commands (the project's real quality gates)

| Gate | Command | Baseline before this change |
| --- | --- | --- |
| lint | `npm run lint` → `node scripts/verify-source.mjs lint` | pass (162 files) |
| typecheck (alias) | `npm run typecheck` → `node scripts/verify-source.mjs typecheck` | pass (162 files) |
| tests | `npm test` → `npm test --prefix apps/web` + `npm test --prefix services/api` | pass: 192 tests, 186 pass, 0 fail, 6 skipped |
| web build (not required here) | `npm run build:web` → `pnpm --filter enjaz-platform build` | not run as a baseline |
| offline analytics proof | `node posthog-analytics.verify.mjs` | new runner added by this change |

Pre-existing failures: none observed at baseline. Any failure introduced by this change is
fixed; unrelated code is untouched.

## Product question

> When a workspace manager builds a digital employee, does the workspace reach a started
> task run — and how often does the human approval gate block that journey?

This is the activation question for ENJAZ: an employee record with no task run produces no
value, and an approval gate that is never resolved stalls execution.

## Events

Four events, all emitted only from real Workspace portal actions:

| Event | Meaning | Properties |
| --- | --- | --- |
| `employee_created` | A manager saved a digital employee through the builder | `workspace_id`, `role_code`, `tool_count`, `surface` |
| `task_created` | A task was created and assigned to an active employee | `workspace_id`, `role_code`, `objective_length_bucket` |
| `task_run_started` | Planning/execution was launched for a task (`POST /api/v1/tasks/:id/plan`) | `workspace_id`, `role_code`, `task_status` |
| `approval_decided` | A manager resolved a human-approval request | `workspace_id`, `decision` |

Event names are object-action, lowercase snake case, and each is emitted exactly once per
successful handler invocation. Failures emit nothing.

## Triggers (real files and functions)

| Event | File | Function |
| --- | --- | --- |
| `employee_created` | `apps/web/src/WorkspaceApp.tsx` | `createEmployee()` after `apiClient.createEmployee` resolves |
| `task_created` | `apps/web/src/WorkspaceApp.tsx` | `createTask()` after `apiClient.createTask` resolves |
| `task_run_started` | `apps/web/src/WorkspaceApp.tsx` | `startTask()` after the plan request resolves |
| `approval_decided` | `apps/web/src/WorkspaceApp.tsx` | `decideApproval()` after `apiClient.decideApproval` resolves |

The capture layer is `apps/web/src/analytics.ts`. It wraps the single PostHog browser client
singleton; no second client is created anywhere.

## Allowed properties

Only these keys can leave the browser: `workspace_id`, `role_code`, `tool_count`,
`objective_length_bucket` (`short` | `medium` | `long`), `task_status`, `decision`
(`approve` | `reject`), `surface`. Values are validated (short, no `@`, no whitespace, no
`phc_`/`phx_`/`sk_`/`pk_`/`sb_`/`bearer`/`password`/`secret` substrings) and everything else
is dropped.

Never captured: employee names, role titles, goals, mission text, task titles, objectives,
email addresses, passwords, access tokens, card data, approval reasons, integration
credentials, or any URL/referrer/person metadata. A `before_send` hook rebuilds every event
from the allowlist, removes `$current_url`, `$referrer`, `$set`, `$set_once` and every other
automatic property, and keeps only the public `token` needed for delivery.

## Identity

After a session is accepted the portal calls `identify` with the opaque Supabase user UUID
(`profileUserId(profile)`) — never an email, name or workspace name. Nothing is identified
until analytics consent is granted; otherwise events stay anonymous with the SDK's anonymous
distinct id. `reset()` runs on sign-out, workspace data reset and consent withdrawal.

## Consent

- The client is initialised with `opt_out_capturing_by_default: true`; the effective state is
  always "off" until a decision exists.
- The only decisions are the existing Workspace control in
  `apps/web/src/AnalyticsConsentNotice.tsx`, persisted in `localStorage` under
  `ENJAZ_ANALYTICS_CONSENT` (`granted` / `denied`). No decision means off.
- Granting calls `opt_in_capturing()`, denying or withdrawing calls `opt_out_capturing()` and
  resets the identity. There is no cookieless fallback and no other CMP to preserve — the
  repository had none.
- Configuration is read from `VITE_POSTHOG_PROJECT_TOKEN` and `VITE_POSTHOG_HOST`
  (see `apps/web/.env.example`, empty token placeholder). A missing token or host, a denied
  decision, or any SDK error is a silent no-op; the product never fails because of analytics.

### Client settings (new client)

`autocapture`, `capture_pageview`, `capture_pageleave`, `capture_dead_clicks` and
`capture_exceptions` are off, `disable_session_recording`, `disable_surveys`,
`enable_heatmaps` and `advanced_disable_flags` disable replay, surveys, heatmaps and feature
flags, and `person_profiles: 'never'` prevents person profiles. No replay, surveys, error
collection or flags.

## Live analysis (to be built in PostHog)

- **Question:** employee builder → started task run.
- **Funnel (steps in order, 14-day window):** `employee_created` → `task_created` →
  `task_run_started`.
- **Denominator:** unique workspaces (`workspace_id`) that recorded `employee_created` in the
  window.
- **Success measure:** share of those workspaces that reach `task_run_started` within 14 days
  of their first `employee_created`.
- **Diagnostic:** `approval_decided` split by `decision` inside the same window — a high
  `reject` share or few decisions with stalled runs points at the human gate.
- **Reading it:** a drop between `employee_created` and `task_created` means the builder does
  not lead to assigned work; a drop between `task_created` and `task_run_started` means
  managers do not start runs, which is the activation leak to fix first.

## Integration evidence

| Item | Evidence |
| --- | --- |
| Importer | `apps/web` (`enjaz-platform`), Vite client bundle for `workspace.html` |
| Manifest | `apps/web/package.json` → `"posthog-js": "1.438.13"` (exact, no range) |
| Lock | root `pnpm-lock.yaml` importer `apps/web` → `specifier: 1.438.13`, `version: 1.438.13(...)`, plus `posthog-js@1.438.13` snapshot |
| Install | `pnpm add --dir apps/web posthog-js@1.438.13` with pnpm 10.34.5; build scripts for the new dependency were skipped by pnpm's allow-build guard (`onlyBuiltDependencies` unchanged) |
| Resolved version | `apps/web/node_modules/posthog-js/package.json` → `1.438.13` |
| Server SDK | none — `services/api` gained no dependency and no analytics code |

No real PostHog token is stored in the repository. The project token belongs in
`apps/web/.env.local` (git-ignored, per `.gitignore` `.env` / `.env.*` rules) or the hosting
provider's environment.

## Offline verification

`node posthog-analytics.verify.mjs` checks the manifest pin and lock resolution with read-only
readers, then runs `apps/web/test/posthog-analytics.test.mjs` with `node --test` in a fresh
environment (`{}` base env, synthetic `VITE_POSTHOG_*` values, no dotenv, network calls
replaced by throwing stubs). The tests call the real exported handlers in
`apps/web/src/analytics.ts` with an in-memory client and assert: no token/host or no consent
sends nothing, each real action emits once with only allowlisted properties, email/password/
token/card sentinels and URL/referrer metadata never appear, transport failures keep the
product result, and identity/reset behaviour holds. No data is transmitted and nothing is
deployed.

## Verification results (offline, nothing transmitted)

| Check | Command | Result |
| --- | --- | --- |
| Offline integration proof | `node posthog-analytics.verify.mjs` | pass — pin + lock resolution, no server SDK, 14 real-handler tests, 110+ assertions, no network |
| Lint | `npm run lint` | pass (164 files, up from 162 baseline) |
| Typecheck alias | `npm run typecheck` | pass (164 files) |
| Real TypeScript check | `pnpm --filter enjaz-platform exec tsc --noEmit` | pass |
| Web tests | `npm test --prefix apps/web` | 19 pass, 0 fail (5 existing landing contracts + 14 analytics tests) |
| API tests | `npm test --prefix services/api` | 192 tests, 186 pass, 0 fail, 6 skipped — unchanged from baseline |
| Production bundle | `npm run build:web` | pass; the Workspace bundle now contains the PostHog browser client |

Negative control: running the verifier against a tree without the pin, without the lock
resolution and without the test file fails with explicit messages, so the runner cannot pass
silently.

## Consent surface

`apps/web/src/AnalyticsConsentNotice.tsx` is rendered at the bottom of every Workspace page:
while no decision exists it offers allow/deny; after a decision it shows the current state and
lets the member withdraw or grant again. The decision is the only input — nothing else in the
product turns analytics on.

## Remaining (needs the project owner)

Set the project's public token and ingestion host privately (`apps/web/.env.local`, git-ignored,
or the host's environment variables), grant consent in the Workspace UI, run the journey once
(build an employee → create a task → start the run → resolve the approval), then build the
14-day funnel above in PostHog. Until that happens this integration is implemented and proven
offline but has not delivered a single real event.
