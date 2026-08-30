begin;

alter table public.job_queue enable row level security;
alter table public.workflow_triggers enable row level security;
alter table public.webhook_deliveries enable row level security;
alter table public.workflow_schedules enable row level security;
alter table public.worker_heartbeats enable row level security;
alter table public.job_attempts enable row level security;

create policy job_queue_workspace_member on public.job_queue for all to authenticated using (private.is_workspace_member(workspace_id)) with check (private.is_workspace_member(workspace_id));
create policy workflow_triggers_workspace_member on public.workflow_triggers for all to authenticated using (private.is_workspace_member(workspace_id)) with check (private.is_workspace_member(workspace_id));
create policy webhook_deliveries_workspace_member on public.webhook_deliveries for all to authenticated using (private.is_workspace_member(workspace_id)) with check (private.is_workspace_member(workspace_id));
create policy workflow_schedules_workspace_member on public.workflow_schedules for all to authenticated using (private.is_workspace_member(workspace_id)) with check (private.is_workspace_member(workspace_id));
create policy worker_heartbeats_authenticated_read on public.worker_heartbeats for select to authenticated using (true);
create policy job_attempts_workspace_member on public.job_attempts for select to authenticated using (exists (select 1 from public.job_queue q where q.id=job_id and private.is_workspace_member(q.workspace_id)));

commit;
