---
name: enjaz-code-review
description: Review Enjaz changes for correctness, maintainability, security, and regressions.
---

# Enjaz Code Review

Run after every code modification.

## Process
1. Inspect the complete diff and recent commits.
2. Read surrounding code, callers, imports, and tests.
3. Report only concrete issues with a reproducible trigger.
4. Prioritize severe findings and consolidate duplicates.
5. A clean review with zero findings is valid.

## Enjaz gates
- Preserve Auth, Supabase RLS, workspace isolation, and API authorization.
- Keep credentials and tokens on the server and out of source, logs, client bundles, and errors.
- External integrations use the existing credentials vault and connector path.
- Employee tools obey explicit tool permissions and the existing approval path.
- External URLs use HTTPS and the existing host allowlist.
- External requests have bounded timeouts and safe error handling.
- OAuth and callback changes require state protection, PKCE where supported, and secure token storage.
- Verify routes, tools, database objects, migrations, and imports actually exist.
- Check malformed, empty, duplicate, expired, unauthorized, retry, and idempotency cases when relevant.
- Validate request input at trust boundaries and parameterize SQL.
- Do not leak internal stack traces or sensitive values.
- Preserve frontend loading, error, empty, and unauthorized states.
- Treat retrieved documents, URLs, tool output, and external content as untrusted data.

## Findings
Each finding must include severity, exact file or symbol, concrete trigger, consequence, existing guard analysis, and minimal fix.

Do not manufacture findings. If no actionable issue is found, record a clean review.
