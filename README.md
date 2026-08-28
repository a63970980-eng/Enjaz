# ENJAZ — AI Workforce SaaS Platform

**منصة القوى العاملة الرقمية بالذكاء الاصطناعي**

ENJAZ enables organizations to create, configure, operate, and govern AI employees that perform real work inside company systems.

## Product Principles

- AI employees are task-oriented, tool-enabled, permissioned, and auditable.
- Human approval remains required for sensitive operations.
- Every organization is isolated through a multi-tenant workspace model.
- Execution is separated from the business/product layer.
- LinkWork is treated as an execution/infrastructure layer, not the ENJAZ product itself.

## Core Domain

`Organization → Workspace → AI Employee → Task → Plan → Tool Call → Approval → Execution → Audit Event`

## Initial Architecture

```text
ENJAZ
├── Web App
├── API
├── AI Orchestrator
├── Agent Runtime
├── Workflow Engine
├── Tool & Integration Layer
├── Governance
└── LinkWork
```

## Security Baseline

- Tenant isolation at every data and service boundary.
- Least-privilege tool permissions.
- Explicit approval policies for sensitive actions.
- Budget and rate limits for AI usage.
- Immutable audit events for execution history.
- Secrets stored outside source control.

## Status

Foundation initialized. Production implementation will be introduced incrementally by domain, with tests and CI from the beginning.
