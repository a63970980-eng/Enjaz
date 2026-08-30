begin;

-- Supabase Auth identity bridge used by the API authentication layer.
alter table public.users add column if not exists auth_user_id uuid;
create unique index if not exists idx_users_auth_user_id on public.users(auth_user_id) where auth_user_id is not null;

-- Remove the structural helper from the public surface; isolation must be proven by real Auth sessions.
drop function if exists public.assert_enjaz_workspace_isolation();

-- Core tenant tables must never be directly exposed without workspace membership.
alter table public.ai_employees enable row level security;
alter table public.tasks enable row level security;
alter table public.approvals enable row level security;
alter table public.audit_events enable row level security;
alter table public.ai_employee_memory enable row level security;

drop policy if exists ai_employees_workspace_member on public.ai_employees;
create policy ai_employees_workspace_member on public.ai_employees for all to authenticated using (private.is_workspace_member(workspace_id)) with check (private.is_workspace_member(workspace_id));

drop policy if exists tasks_workspace_member on public.tasks;
create policy tasks_workspace_member on public.tasks for all to authenticated using (private.is_workspace_member(workspace_id)) with check (private.is_workspace_member(workspace_id));

drop policy if exists approvals_workspace_member on public.approvals;
create policy approvals_workspace_member on public.approvals for all to authenticated using (private.is_workspace_member(workspace_id)) with check (private.is_workspace_member(workspace_id));

drop policy if exists audit_workspace_member on public.audit_events;
create policy audit_workspace_member on public.audit_events for select to authenticated using (private.is_workspace_member(workspace_id));

-- Worker heartbeats are operational server data; do not expose them to browser sessions.
drop policy if exists worker_heartbeats_authenticated_read on public.worker_heartbeats;
drop policy if exists worker_heartbeats_workspace_scoped_read on public.worker_heartbeats;

commit;
