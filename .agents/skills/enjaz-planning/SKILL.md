---
name: enjaz-planning
description: Plan complex Enjaz changes before implementation. Inspect existing architecture, identify affected files and dependencies, preserve working Auth/Supabase/Workspace/APIs, define verification criteria, then execute incrementally.
metadata:
  origin: ECC-adapted
---

# Enjaz Planning Workflow

Use this workflow for architectural changes, integrations, new digital-employee capabilities, database changes, and complex fixes.

## Rules

1. Inspect the existing implementation before proposing a replacement.
2. Identify exact files, routes, database objects, tools, and execution paths affected.
3. Preserve working authentication, Supabase security, workspace isolation, APIs, and existing production behavior unless a change is explicitly required.
4. Prefer extending existing abstractions over creating parallel systems.
5. Separate:
   - read-only capability
   - state-changing capability
   - high-risk capability requiring human approval
6. Define success criteria that can be verified mechanically.
7. Plan rollback or containment for risky changes.
8. Never mark a task complete because code was written; completion requires verification.

## Required Plan

- Objective
- Existing architecture
- Files/components affected
- Database impact
- Permissions/security impact
- Integration impact
- Implementation sequence
- Tests
- Production verification
- Rollback/containment

## Enjaz-specific checks

For digital-employee work verify the path:

Digital Employee -> Skill -> Tool Registry -> Permission -> Approval -> Connector -> External System -> Audit

Do not bypass the Tool Registry or approval engine for convenience.
