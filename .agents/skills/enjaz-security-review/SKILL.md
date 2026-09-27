---
name: enjaz-security-review
description: Security review for Enjaz code handling authentication, authorization, API endpoints, external integrations, credentials, webhooks, database queries, or user-controlled input.
metadata:
  origin: ECC-adapted
---

# Enjaz Security Review

Run after changes involving auth, APIs, database queries, integrations, credentials, webhooks, external URLs, permissions, or sensitive data.

## Review priorities

### Critical
- Hardcoded secrets or service-role credentials
- Authentication or authorization bypass
- Workspace/tenant isolation failure
- SQL injection
- SSRF through user-controlled URLs
- Unapproved high-risk operations
- Credential leakage
- External writes without the required approval gate

### High
- Missing input validation
- Unsafe redirect/callback handling
- Weak webhook authentication
- Missing rate limits on sensitive endpoints
- Sensitive data in logs
- Over-broad employee tool permissions
- Insecure OAuth state/PKCE handling

### Medium
- Missing audit events
- Excessive scopes
- Weak timeout/error handling
- Dependency/security hygiene issues

## Enjaz-specific authorization checks

Every employee tool must pass:
1. Tool exists.
2. Employee is explicitly allowed to use it.
3. High-risk tools require approval.
4. Workspace context is present for workspace-scoped operations.
5. External credentials are loaded only server-side.
6. External operations are audited.

## External URL checks

For generic API bridges:
- HTTPS only.
- Host must be allowlisted by the application catalog.
- Never fetch arbitrary user-supplied URLs.
- Apply bounded timeouts.
- Do not expose credentials in error messages.

## Findings standard

Only report findings with a concrete trigger and failure mode. For HIGH/CRITICAL findings include the exact file/function and why existing guards do not prevent the issue.

A clean review is valid.
