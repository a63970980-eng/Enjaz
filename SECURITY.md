# Enjaz Security

## Security baseline

Enjaz treats tenant isolation, authorization, credentials, AI tool execution, and auditability as production security boundaries.

### Required controls

- Server-side authorization is mandatory; UI visibility is never an authorization boundary.
- Every tenant-owned query must be scoped to the authenticated workspace/organization.
- Credentials must never be committed to Git or exposed to browser code.
- Sensitive AI actions require explicit tool permissions and approval policies.
- Production database connections use verified TLS by default.
- Rate limits, request IDs, audit events, and security headers remain enabled in production.
- Pull requests are subject to automated CodeQL, dependency, secret, and filesystem vulnerability checks.

## Reporting

Do not publish credentials, tokens, personal data, or exploitable details in public issues. Report suspected vulnerabilities privately to the repository maintainers.
