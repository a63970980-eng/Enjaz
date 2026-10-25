# ENJAZ release readiness — 2026-10-25

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

1. **`enjaz-auth-bridge` is not in this repository.** The browser (`apps/web/auth-client.js`) uses it for signup and
   `/me`; only `enjaz-industry`, `enjaz-worker` and `enjaz-ai` edge functions are versioned. A self-contained deploy
   is impossible until this function is committed, or signup/`me` is moved onto the API with real Supabase testing.
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

## Minimum go-live checklist

1. Provision Supabase (auth settings, email templates, redirect URLs) and PostgreSQL.
2. Apply the API migration chain with `pnpm --filter @enjaz/api migrate` against the production database.
3. Set API env: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `ENJAZ_CREDENTIALS_KEY`, `CORS_ORIGINS`, and at
   least one model provider key.
4. Commit or replace `enjaz-auth-bridge`; verify signup → email confirmation → login → bootstrap → workspace on a
   real project.
5. Run `tests/e2e` against the deployed preview with a real browser and a real workspace.
6. Verify two-account isolation on the deployed origin (members, tasks, approvals, audit).
7. Configure backups, uptime checks and error monitoring before announcing availability.
