# ENJAZ Architecture

## Layers

### Product Layer
The web application exposes organizations, workspaces, AI employees, tasks, workflows, integrations, approvals, usage, and audit views.

### Business/API Layer
The API owns tenant-aware business rules, authentication, authorization, billing boundaries, policies, and domain operations.

### Workforce Layer
The orchestrator converts a high-level objective into an executable plan and coordinates one or more AI employees.

### Execution Layer
Agents use explicitly granted tools. Tool execution is isolated from model reasoning and must pass policy checks before sensitive actions.

### Integration Layer
Connectors expose CRM, ERP, POS, email, messaging, spreadsheets, databases, webhooks, and MCP-compatible systems through normalized tool contracts.

### Governance Layer
Every execution is constrained by permissions, approval policies, budgets, schedules, rate limits, and audit logging.

## Multi-Tenancy
Every tenant-owned record must carry an organization/workspace scope. Authorization is enforced server-side; UI filtering is never a security boundary.

## AI Employee Lifecycle
`Draft → Configured → Active → Paused → Archived`

Runtime executions are separate from employee definitions so configuration changes do not corrupt historical execution records.

## Task Lifecycle
`Queued → Planning → Awaiting Approval → Executing → Completed | Failed | Cancelled`

## Sensitive Actions
Payments, deletion, bulk messaging, financial changes, credential changes, and high-value purchases should default to approval-required policies until an administrator explicitly changes the policy.
