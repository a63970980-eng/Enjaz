begin;

-- Approval status is a PostgreSQL enum, so extend the enum instead of adding a text CHECK.
alter type approval_status add value if not exists 'executed';

create index if not exists idx_approvals_pending_workspace on public.approvals(workspace_id,status) where status='pending';
create index if not exists idx_tasks_workspace_status on public.tasks(workspace_id,status);

commit;
