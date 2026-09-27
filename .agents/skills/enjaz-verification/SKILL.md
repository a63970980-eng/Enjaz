---
name: enjaz-verification
description: Final verification loop for Enjaz changes. Build, test, inspect security-sensitive paths, verify runtime behavior, and only then declare completion.
metadata:
  origin: ECC-adapted
---

# Enjaz Verification Loop

Never declare an Enjaz change complete from source inspection alone.

## Verification order

### 1. Static integrity
- Check changed files for syntax/import errors.
- Check referenced functions, routes, tools, and database objects exist.
- Check no accidental Auth/Supabase/Workspace regression was introduced.

### 2. Tests
Run the narrowest relevant tests first, then broader tests when practical.

Minimum categories:
- Unit tests for changed logic.
- Integration tests for API/database behavior.
- E2E for critical user-facing flows.

### 3. Security
For changes involving credentials, APIs, integrations, permissions, or database access:
- Run the Enjaz security review.
- Confirm workspace isolation.
- Confirm approval enforcement for high-risk actions.
- Confirm secrets are not logged or returned.

### 4. Runtime
Verify:
- API health.
- Authentication guard behavior.
- Relevant route response.
- Queue/worker behavior when execution code changed.
- No new runtime errors.

### 5. Production/deployment
If deployment was changed:
- Confirm deployment reaches READY.
- Verify the deployed endpoint, not only the source.
- Confirm migrations actually exist in the target environment.
- Check recent runtime logs for regressions.

## Completion gate

Only report COMPLETE when all applicable checks pass.

If a blocker remains, state the exact blocker and what was verified around it. Do not convert a deployment/configuration blocker into a false success.
