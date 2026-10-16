# ENJAZ Roadmap

## Implementation snapshot — 2026-10-16

- **Workspace employee builder:** Implemented in the active feature branch. It uses the workforce/tool catalog endpoints when available, falls back to a custom role if the role catalog is unavailable, and preserves explicit tool assignment and the existing human-approval policy.
- **Recurring automations:** Workspace UI is connected to the existing routine API and scheduler; managers can create, pause, and resume routines.
- **Analytics and billing:** Initial usage dashboard is implemented. It reads current runtime, subscription, and limit data; it does **not** issue invoices or collect payments. See [Analytics and Billing Design](./ANALYTICS_AND_BILLING_DESIGN.md).
- **Invitations, advanced RBAC, SSO, and SCIM:** Not implemented. The current identity/profile model and out-of-repository auth bridge must be resolved before a safe invite-acceptance flow. See [Enterprise Identity Design](./ENTERPRISE_IDENTITY_RBAC_SSO_SCIM_DESIGN.md).

## Next enterprise gates

1. Decide whether an Enjaz identity may belong to multiple organizations.
2. Bring the authentication bridge source/contract under version control and verify the deployed schema for `users.platform_role`.
3. Build invitations and a centralized permission resolver with deny-by-default tests.
4. Select an enterprise identity provider before implementing SSO/SCIM.
5. Select the first payment markets, currencies, tax requirements, and provider before financial collection.

## Phase 1 — Foundation
- Monorepo structure
- Web application shell
- API service
- Authentication and tenant model
- Database schema
- AI Employee domain
- Task and execution model
- Audit events

## Phase 2 — First Working AI Employee
- Employee creation wizard
- Role, goal, skills, tools, memory, permissions
- Task submission
- Planning and execution loop
- Human approval gate
- Usage and budget controls

## Phase 3 — AI Teams
- Multi-agent delegation
- Manager agent
- Shared task context
- Inter-agent handoffs
- Consolidated results

## Phase 4 — Integrations
- Generic REST connector
- Webhooks
- Email
- Google Workspace
- Microsoft 365
- CRM/ERP/POS connectors
- MCP gateway

## Phase 5 — Enterprise
- SSO/SAML
- Advanced RBAC
- SCIM
- Organization policies
- Compliance exports
- Advanced observability
- Billing and usage metering
