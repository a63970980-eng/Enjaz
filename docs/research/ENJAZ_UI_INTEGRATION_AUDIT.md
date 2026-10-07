# ENJAZ UI Research Integration Audit

Branch: `integration/research-synthesis-20261007`

## Objective

Turn the imported open-source UI research into a coherent ENJAZ application without replacing or modifying the existing Auth, Supabase, Workspace, API, execution, approval, or audit backend.

## Current source inventory

### Provision
Imported UI patterns:
- application shell
- sidebar/header/team switcher
- agent activity, chat, memory and usage views
- agent directory/library/detail
- dashboard
- tasks, task detail
- goals, routines, approvals and audit views

Best use in ENJAZ:
- primary enterprise navigation and operational information architecture
- workforce/task/governance page structure

Integration constraint:
- source components are coupled to Inertia, Provision-specific types, hooks and shadcn primitives. They are reference/source material, not drop-in ENJAZ components.

### Paperclip
Imported:
- company rail/switcher
- sidebar/layout
- command palette
- active-agent panel
- live-run widget
- goal tree
- kanban
- approval card
- metric/activity cards

Best use:
- company/control-plane mental model
- command/search interaction
- live AI workforce/run visibility
- goals and approvals

Integration constraint:
- source components depend on Paperclip router, API, query/context and internal UI primitives. They must not be mounted directly until their dependencies are intentionally mapped to ENJAZ.

### BoardUI
Imported:
- application shell
- agent thinking/log views
- data table

Best use:
- dense B2B tables
- agent reasoning/trace presentation
- accessibility-oriented shell patterns

Integration constraint:
- source is Next.js-oriented and depends on BoardUI's internal component registry plus React Aria/TanStack packages. It is not a direct Vite drop-in.

### OpenBot
Imported:
- agent profile
- agent card
- agent orb / AI core

Best use:
- ENJAZ digital employee identity
- employee detail/profile
- visual AI-core/orb treatment

Integration constraint:
- OpenBot is a multi-package Bun application. Only selected presentation components were imported; runtime/server code is intentionally not imported.

### AgentOS
Imported:
- governance
- compliance dashboard
- drift alerts
- org chart
- reasoning traces
- workforce report

Best use:
- ENJAZ governance/control plane
- AI workforce observability
- compliance/drift/reasoning UX patterns

Integration constraint:
- source pages depend on AgentOS application data/types and are reference implementations, not drop-in pages.

## Critical finding

The imported sources are deliberately **not** being blindly merged into the ENJAZ runtime.

They represent five complementary layers:

1. Provision → enterprise operating shell
2. Paperclip → AI company/control plane
3. BoardUI → accessible B2B interaction primitives
4. OpenBot → digital employee presentation
5. AgentOS → governance/observability

The correct next implementation step is to compose these patterns around ENJAZ's existing data contracts instead of importing any source's router, API client, database model, auth model, or runtime.

## ENJAZ page architecture to assemble

1. Overview / Command Center
2. Digital Workforce
3. Employee detail
4. Tasks
5. Workflows
6. Approvals
7. Knowledge
8. Integrations
9. Governance / Audit
10. Analytics

The five sectors remain a context/provisioning layer, not five duplicated workforce catalogs.

## Dependency rule

Do not add a source project's full dependency stack merely to make an isolated copied component compile.

Prefer:
- existing ENJAZ React/Vite stack
- existing `cn` utility
- existing Lucide icons
- existing backend contracts
- small, justified dependencies only when a selected interaction cannot be reproduced from already-imported source

Do not import:
- source routers
- source API clients
- source auth/session logic
- source database/schema
- source company/workspace state
- source runtime/agent execution engines

## Licensing

Upstream MIT license texts are preserved beside each imported source under:
- `apps/web/src/vendor/provision/LICENSE.txt`
- `apps/web/src/vendor/paperclip/LICENSE.txt`
- `apps/web/src/vendor/boardui/LICENSE.txt`
- `apps/web/src/vendor/openbot/LICENSE.txt`
- `apps/web/src/vendor/agentos/LICENSE.txt`

Third-party dependencies inside those projects retain their own licensing obligations and must be audited before distribution.

## Status

Research transfer: complete for the selected source components.

Source compatibility audit: complete.

Composition/adaptation: next phase.

Backend preservation: required and unchanged by this audit.

No production claim, customer claim, usage metric, revenue claim, or fake workforce statistic should be introduced into the ENJAZ public experience.
