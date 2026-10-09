# ENJAZ Engineering Baseline — 2026-10-09

## Purpose

This document records what has been verified from repository source and GitHub Actions, separates implemented code from production claims, and defines the next engineering gates. It is not a certification or a full penetration-test report.

## Verified repository state

- Default branch: `main`.
- The inspected `main` head removed the old web entry and React source files while `apps/web/vite.config.js` still referenced `index.html` and `landing.html`. CI consequently failed to resolve the Vite entry.
- The API workforce repository inserts and updates fields on `ai_employees` including `role_code`, `mission`, `responsibilities`, `authority_matrix`, `kpis`, `collaboration`, `escalation_rules`, `industry_context`, and `workforce_version`. The migration chain on the inspected baseline did not create all of those columns.
- The web workflow previously filtered for `@enjaz/web`, but the actual package name in `apps/web/package.json` is `enjaz-platform`.
- The existing backend contains real implementation for Supabase-based identity, workspace membership checks, PostgreSQL persistence, employee/task/approval APIs, execution graphs and queues, integration credential encryption, integration action logs, and tenant-oriented RLS migrations. Presence of these modules alone does not prove that every production path is safe or reliable.

## Repair branch

The current repair is isolated in [PR #40](https://github.com/a63970980-eng/Enjaz/pull/40), targeting `main`.

It contains:
- A new Arabic RTL React public landing page and Vite entry; the removed legacy visual layer is not restored.
- A shared `/landing.html` entry for route compatibility.
- Correct package filters in the web CI workflow.
- Browser smoke tests for the rebuilt page, responsive layout, preview disclosure, sector tabs, and basic keyboard access.
- A web contract test for the document security policy and public sector coverage.
- A TypeScript check before the production build.
- An additive schema migration for `role_code` and the workforce metadata columns.
- A Vercel Content-Security-Policy response header.

At commit `cd38bf0`, GitHub Actions passed both web CI (install, web contract tests, TypeScript validation, Vite build, preview and browser smoke tests) and API CI (database migration and API test suite). The later deployment-configuration change switches Vercel and Netlify to the workspace package manager. This was prompted by Vercel logs showing `vite: command not found` because the custom npm install omitted development tools. The newest checks and fresh deployment must be verified before this PR is considered ready to merge.

No production database has been modified directly. No live deployment has been confirmed by this audit.

## Important limitations

- The rebuilt public landing page is not the authenticated workspace application. The next phase must implement the signed-in product experience against the existing API without replacing auth or backend contracts.
- The preview card is explicitly illustrative and must not be presented as live customer data.
- CI passing on a PR branch is not proof that the production deployment is healthy.
- This review did not perform a full penetration test, load test, restore drill, or provider-by-provider integration test.

## Next engineering gates

### P0 — Before merging the repair
1. Latest PR checks must pass, including TypeScript validation and browser smoke tests.
2. Review the exact PR diff and ensure only intended paths changed.
3. Confirm that migrations apply on a fresh database and on an existing schema; no production migration without a backup and rollback plan.

### P1 — Product and tenant safety
1. Add negative integration tests proving a user from workspace A cannot read, mutate, approve, or execute workspace B resources.
2. Verify every high-risk integration action requires an approval tied to the same workspace, task, employee, and tool.
3. Review public error and audit payloads for secret or personal-data leakage.
4. Add explicit schema-contract tests for all fields written by workforce repositories.

### P2 — Runtime reliability
1. Test duplicate queue delivery, lease expiry, cancellation, worker crash recovery, and retry exhaustion against PostgreSQL.
2. Add per-workspace budgets and concurrency limits that are enforced in the database/runtime, not only in the UI.
3. Establish latency, error-rate, queue-age, and model-cost alerts.
4. Exercise a real backup restore and document recovery objectives.

### P3 — Enterprise readiness
1. Build the authenticated workspace interface on existing Supabase Auth and API contracts.
2. Test organization/workspace onboarding, roles, invitations, approval flows, integration setup, and audit review end-to-end.
3. Run dependency scanning, secret scanning, static analysis, accessibility checks, and representative load tests in CI.
4. Verify deployment health and rollback behavior on the actual hosting environment.

## Acceptance standard

A capability is complete only when its contract is documented, authorization boundaries are tested, failures are observable, recovery behavior is tested where relevant, and the production path has been verified. A green build is necessary, not sufficient.
