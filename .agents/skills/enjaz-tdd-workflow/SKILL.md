---
name: enjaz-tdd-workflow
description: Safe test-driven workflow for Enjaz features, fixes, refactors, API routes, workers, integrations, and critical UI changes.
---

# Enjaz TDD Workflow

Use for new behavior, bug fixes, refactors, API routes, integrations, workers, and critical UI changes.

## Runner detection
- Enjaz uses pnpm and Node's built-in test runner in the API package.
- API tests: pnpm --filter @enjaz/api test
- Repository-wide tests: pnpm test
- E2E: pnpm test:e2e when Playwright coverage applies.
- Inspect package scripts before inventing a test command.

## Workflow
1. Define user-visible behavior and failure conditions.
2. Locate the existing implementation and tests.
3. Add a focused regression test when practical.
4. Run the relevant test to establish the baseline.
5. Implement the smallest safe change.
6. Run targeted tests.
7. Refactor only while tests remain green.
8. Run broader tests, lint, typecheck, and build when warranted.
9. Review security and workspace isolation before completion.

## Coverage policy
Do not impose a blanket threshold on the legacy codebase. For changed logic, require coverage proportional to risk:
- auth, authorization, financial, and integration paths: success, denial/failure, and boundary cases;
- worker and queue paths: retry, idempotency, and recovery;
- API routes: authentication, validation, success, and relevant errors;
- critical UI flows: interaction plus loading/error states where E2E exists.

## Test quality
- Prefer behavior over implementation details.
- Keep tests isolated and deterministic.
- Mock external services at their boundary.
- Never use production credentials or mutate production data in tests.
- Do not leave skipped tests or fake assertions.

## Completion gate
A change is not complete merely because it builds. Relevant tests must pass, and any unverified production dependency must be explicitly identified.
