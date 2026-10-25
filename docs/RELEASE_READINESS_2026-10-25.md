# ENJAZ release readiness — 2026-10-25

> **Second engineering pass (same day).** The first pass fixed clean-install onboarding and added membership.
> The second pass closed three production defects found by running the code against a real schema, and removed the
> external signup dependency. See [Second pass](#second-pass--authentication-execution-and-tenant-isolation) below;
> the earlier tables are kept for the record and their results are superseded where noted.

This document records what was **actually executed** in this engineering pass, on which environment, and what
remains before a real customer can be onboarded. Nothing in this file claims a check that was not run.

## What changed

| Area | Change | Verification |
| --- | --- | --- |
| Clean-install identity | `034_workspace_identity_and_invitations.sql` + Supabase mirror define `users.platform_role` and `public.assign_first_platform_admin(uuid)`. New-customer workspace bootstrap previously failed with `column "platform_role" does not exist` on every clean database. | Full migration chain applied to an empty PostgreSQL 18 database; real `bootstrapWorkspace()` executed; replay is idempotent. `onboarding.integration.test.js`. |
| Repository intelligence | Removed pre-declaration `requireManager(user)` (TDZ → HTTP 500) and made both endpoints authenticated and tenant-scoped, as `docs/REPOSITORY_INTELLIGENCE.md` already promised. | `permissions.test.js` contract assertions; full suite. |
| Membership + invitations | New repository, API routes, permissions (`members.read`, `members.invite`, `members.manage`), SHA-256 token storage, seven-day expiry, email binding, account-claim handling, last-manager protection, audit events. | `membership.integration.test.js`, `membership-http.e2e.test.js`, `permissions.test.js`, `migration-contract.test.js`. |
| Workspace console | Members and Permissions surface (list, role change, remove, invite, revoke) and `?invite=<token>` acceptance; Integrations surface (list, connect, revoke, scope disclosure). | `tsc --noEmit`, `vite build`, source contracts; Playwright specs added (see limits). |
| Response hardening | All API JSON responses send `Cache-Control: no-store`. | `http-contract.test.js`. |
| Supabase track | Earlier `REVOKE` on `assign_first_platform_admin` is guarded so a clean install no longer fails before the function exists. | `migration-contract.test.js`. |

## Executed checks and results

Environment: Linux, Node 24.21, PostgreSQL 18.6 (portable build) with pgvector 0.8.1, dependencies installed with
`pnpm install --frozen-lockfile`. Supabase Auth was replaced by a local mock of `/auth/v1/user` for HTTP tests.

| Check | Result |
| --- | --- |
| `node db/migrate.js` on a **fresh** database | 47 migrations applied, no errors; second run applied nothing |
| `node --test` in `services/api` with database | **192 tests, 192 pass, 0 fail, 0 skipped** |
| `node --test` in `services/api` without database | 192 tests, 186 pass, 6 skipped (DB-only suites), 0 fail |
| `node --test` in `apps/web` | 5 pass, 0 fail |
| `node scripts/verify-source.mjs lint` | pass (162 source files) |
| `node scripts/verify-source.mjs typecheck` | pass (syntax check only — this script does not run `tsc`) |
| `tsc --noEmit` in `apps/web` | pass |
| `pnpm build` (web + API bundle) | pass; `api/server.cjs` 1.9 MB produced |
| Playwright E2E (public + workspace) | **not executed** — Chromium could not be downloaded in this environment; specs were extended but are unproven here |
| Supabase migration track on a clean Supabase-like database | **blocked** — needs `pg_cron` (and Supabase auth schema); not reproducible locally |
| Real Supabase signup / login / email confirmation | **not executed** — requires a provisioned Supabase project and the external `enjaz-auth-bridge` function |
| Real AI provider execution | **not executed** — requires `OPENAI_API_KEY` or another configured provider |

## Known blockers before the first real customer

1. **~~`enjaz-auth-bridge` blocks signup~~ — resolved on 2026-10-25 (second pass).** Signup, password recovery and
   session resolution no longer require the bridge: the browser calls Supabase Auth directly and reads the session
   from `/api/v1/auth/me`. The bridge remains an optional legacy fallback. What is still unverified is the real
   Supabase round trip (email confirmation and recovery email delivery), which needs a provisioned project.
2. **Email delivery of invitations.** Tokens are copy-only today; connecting a transactional email provider is
   required for self-service invitations.
3. **Billing provider.** Plans, limits and usage metering exist; invoicing and collection do not. No payment provider
   is integrated and no subscription is charged.
4. **Multi-organization identities.** Acceptance refuses an identity that already belongs to another organization
   (`INVITATION_ORGANIZATION_CONFLICT`). This is an explicit product/data-model decision, not a bug.
5. **`ENJAZ_CREDENTIALS_KEY`** (32 bytes, base64) must be provisioned before any integration connection can be saved;
   without it the API correctly refuses to store credentials.
6. **Supabase `pg_cron` / `pgvector`** must be enabled in the Supabase project for the Supabase migration track and
   semantic memory.
7. **Monitoring, backups and alerting** are not configured in this environment; they remain operational prerequisites.

## Second pass — authentication, execution and tenant isolation

### Defects found and fixed

| Defect | Evidence | Fix |
| --- | --- | --- |
| **Tenant data was readable across organizations.** `users`, `organizations`, `workspaces` and `workspace_members` carried policies but RLS was never enabled, while migration 016 grants table privileges to `authenticated`. | Live schema query showed `relrowsecurity = false` on all four tables, and `authenticated` could select every row. | `037_enable_tenant_rls.sql` (+ Supabase mirror) enables RLS, adds missing roster policies and moves predicates into SECURITY DEFINER helpers so policies cannot recurse. New test runs as the real `authenticated` role with JWT claims. |
| **Every AI-planned task failed.** `brain-orchestrator.js` selected `integration_connections.display_name`, a column that does not exist; the failure surfaced inside `Promise.all` before planning. | End-to-end test: `column "display_name" does not exist`. | Queries use the real `name` column and keep `display_name` as the API alias. |
| **Saving and revoking integrations failed.** `credentials-vault.js` inserted `display_name`, and revocation wrote `status='revoked'` against a check constraint allowing only `active/disabled/expired/error`. | `credentials-vault.integration.test.js` now exercises the real columns and constraint. | Vault uses `name`; `035_integration_connection_revoked_status.sql` (+ mirror) allows `revoked`, and duplicate names return `409 CONNECTION_NAME_TAKEN` instead of a 500. |
| **Signup depended on a function that is not in the repository.** The browser posted to `functions/v1/enjaz-auth-bridge` for signup and `/me`. | `apps/web/test/auth-client.test.mjs` asserts the request target. | Signup and password recovery now go directly to Supabase Auth; `/api/v1/auth/me` is the authoritative session source and the bridge is a legacy fallback only. |
| **No password recovery existed at all.** | UI inspection. | Recovery request, recovery callback handling and a set-new-password screen, with offline tests. |

### Added capability

- **Model usage accounting and a per-task ceiling.** `services/api/src/model-usage.js` normalizes OpenAI/Gemini token
  payloads, records tokens per planning call in `runtime_metrics` (`036_runtime_metric_tokens.sql`), derives integer
  cents only from configured rates (never invented), and refuses a plan above
  `policy.maxModelTokensPerTask` / `ENJAZ_MAX_TASK_MODEL_TOKENS` with `429 MODEL_TOKEN_BUDGET_EXCEEDED`.
- **End-to-end execution proof.** `services/api/test/ai-execution.e2e.test.js` drives the real path on PostgreSQL:
  plan (registered provider) → execution graph → queued steps → worker → tool → stored task output → graph success →
  audit events, plus the human-approval gate for a high-risk tool (`awaiting_approval` → approve → executed).
- **Schema invariant test.** `tenant-rls-sweep.e2e.test.js` fails if any workspace-scoped table lacks RLS or a policy,
  and checks the identity core explicitly.

### Checks executed in the second pass

Environment: same as above (Node 24.21, portable PostgreSQL 18.6, pgvector 0.8.1).

| Check | Result |
| --- | --- |
| `node db/migrate.js` on a **brand-new** database (with CI roles) | 51 migrations applied, exit 0; second run applied nothing |
| `node --test` in `services/api` against that fresh database | **203 tests, 203 pass, 0 fail, 0 skipped** |
| `node --test` in `apps/web` | **31 pass, 0 fail** (12 new auth-client tests) |
| `node scripts/verify-source.mjs lint` / `typecheck` | pass (169 source files) |
| `tsc --noEmit` in `apps/web` | pass |
| `pnpm build` (web + API bundle) | pass |
| Tenant isolation as `authenticated` with JWT claims (two organizations) | pass — no cross-tenant rows, cross-tenant writes rejected by RLS |
| AI execution end-to-end + approval gate on PostgreSQL | pass |
| Integration vault: encrypt → list → decrypt → revoke, cross-tenant denial | pass |
| Playwright E2E | **not executed** — no Chromium in this environment |
| Supabase migration track from scratch | **not reproducible** — see below |
| Real Supabase signup / email confirmation / recovery email | **not executed** — no Supabase project or inbox access here |
| Real model provider call | **not executed** — no provider key; the pipeline is proven with a registered stub provider |

### Supabase migration track — precise status

The 20 files in `supabase/migrations/` are **incremental deltas against an existing Supabase project**, not a
from-scratch schema: applying them to an empty database fails immediately on `pg_cron` and then on missing base
objects (`users`, `workspaces`, `ai_employees`, `billing_customers`). The reproducible, authoritative track is
`services/api/db/migrations/`, which builds a complete database and is what CI runs. The Supabase deltas added in
this pass are guarded (`to_regclass`, existence checks) so they apply cleanly once the base objects exist.

## Minimum go-live checklist

1. Provision Supabase (auth settings, email templates, redirect URLs) and PostgreSQL.
2. Apply the API migration chain with `pnpm --filter @enjaz/api migrate` against the production database.
3. Set API env: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `ENJAZ_CREDENTIALS_KEY`, `CORS_ORIGINS`, and at
   least one model provider key.
4. Verify signup → confirmation email → login → bootstrap → workspace, and password recovery end to end, on a real
   Supabase project (redirect URLs and email templates configured).
5. Run `tests/e2e` against the deployed preview with a real browser and a real workspace.
6. Verify two-account isolation on the deployed origin (members, tasks, approvals, audit).
7. Configure backups, uptime checks and error monitoring before announcing availability.
