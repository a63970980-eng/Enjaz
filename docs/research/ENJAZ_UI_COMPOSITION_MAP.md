# ENJAZ UI Composition Map

This map is the implementation contract for the next UI assembly pass.

| ENJAZ surface | Primary source | Secondary source | What to retain |
|---|---|---|---|
| Global shell | Provision | Paperclip / BoardUI | sidebar hierarchy, company/workspace context, responsive shell |
| Command/search | Paperclip | Provision | command palette, global search, keyboard invocation |
| Overview | Paperclip | Provision / AgentOS | active workforce, live runs, approvals, goals, operational activity |
| Digital Workforce | Provision | OpenBot | agent directory, filters, employee cards, status |
| Employee detail | OpenBot | Provision | identity, role, capabilities, activity, tools, knowledge |
| Tasks | Provision | Paperclip / BoardUI | task cards, detail panel, kanban/table density |
| Workflows | Paperclip | Provision | goals, task relationships, execution state |
| Approvals | Provision | Paperclip | approval queue, decision context, auditability |
| Knowledge | Provision | OpenBot | memory/knowledge browsing |
| Integrations | Paperclip | Provision | tool/integration visibility |
| Governance | AgentOS | Provision | policy, compliance, drift, audit |
| Analytics | AgentOS | Provision | workforce report, activity/usage presentation |
| Agent reasoning | BoardUI | AgentOS | thinking/log/trace presentation |

## Composition principles

### 1. One ENJAZ shell
Do not expose multiple source-project navigation systems. Provision's shell is the structural baseline; Paperclip's company rail and command palette are interaction references; BoardUI contributes accessibility/density patterns.

### 2. One Digital Employee model
The employee is an ENJAZ domain object. OpenBot's visual treatment is reusable; OpenBot's runtime model is not.

### 3. One operational vocabulary
Use ENJAZ terms:
- موظفون رقميون
- المهام
- سير العمل
- الموافقات
- المعرفة
- التكاملات
- الحوكمة
- التحليلات

Do not leak source-project terms such as Issues, Credits, Meta Engine, Projects, or source-specific billing models.

### 4. One data boundary
Every visible value must ultimately come from ENJAZ APIs or be explicitly marked as preview/demo data. No copied source mock data may reach production UI.

### 5. RTL first
The final shell and all selected components must support RTL structurally, not through a late global flip. Direction-sensitive spacing, icon placement, drawers, tables and keyboard navigation must be checked.

### 6. Public vs authenticated experience
The public ENJAZ landing page is separate from the authenticated operating console. The console may use dense enterprise UI; the public page must remain premium, concise and conversion-oriented.

### 7. Motion
Use motion where it communicates state:
- active digital employee
- live execution
- workflow progression
- command palette
- transitions between workforce views

Avoid decorative motion that competes with operational information.

## Forbidden carry-over

Do not carry over:
- fake customer logos
- fake revenue/growth metrics
- source-specific pricing/credits
- source-specific URLs
- source auth/session state
- source backend/API calls
- source branding
- source company names in user-facing copy

## Assembly order

1. Shell
2. Overview
3. Workforce directory
4. Employee detail
5. Tasks/workflows
6. Approvals/governance
7. Knowledge/integrations
8. Analytics
9. RTL/accessibility/mobile
10. ENJAZ visual identity and motion
