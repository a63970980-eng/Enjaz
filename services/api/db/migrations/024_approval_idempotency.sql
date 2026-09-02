begin;

-- Only one pending approval may exist for a task in a workspace.
-- This closes the race where two concurrent execution requests could both
-- observe no pending approval and create duplicate approval gates.
create unique index if not exists uq_pending_approval_workspace_task
  on public.approvals(workspace_id,task_id)
  where status='pending';

commit;
