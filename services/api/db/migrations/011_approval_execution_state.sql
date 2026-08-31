begin;

-- Approval lifecycle must distinguish a decision from actual execution.
alter table public.approvals drop constraint if exists approvals_status_check;
alter table public.approvals add constraint approvals_status_check check (status in ('pending','approved','rejected','expired','executed'));

create index if not exists idx_approvals_pending_workspace on public.approvals(workspace_id,status) where status='pending';
create index if not exists idx_tasks_workspace_status on public.tasks(workspace_id,status);

commit;
