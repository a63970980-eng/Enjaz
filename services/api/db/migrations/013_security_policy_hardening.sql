begin;

-- Public helper functions must not be callable through the Data API.
do $$ begin
  if to_regprocedure('public.current_enjaz_user_id()') is not null then
    revoke all on function public.current_enjaz_user_id() from public, anon, authenticated;
  end if;
  if to_regprocedure('public.is_workspace_member(uuid)') is not null then
    revoke all on function public.is_workspace_member(uuid) from public, anon, authenticated;
  end if;
  if to_regprocedure('public.workspace_role(uuid)') is not null then
    revoke all on function public.workspace_role(uuid) from public, anon, authenticated;
  end if;
  if to_regprocedure('public.employee_remaining_budget(uuid)') is not null then
    revoke all on function public.employee_remaining_budget(uuid) from public, anon, authenticated;
  end if;
  if to_regprocedure('public.touch_integration_connection()') is not null then
    alter function public.touch_integration_connection() set search_path = public;
  end if;
end $$;

-- Never expose worker operational state to browser clients.
drop policy if exists worker_heartbeats_workspace_scoped_read on public.worker_heartbeats;
drop policy if exists worker_heartbeats_authenticated_read on public.worker_heartbeats;
revoke select, insert, update, delete on public.worker_heartbeats from anon, authenticated;

-- Integration credentials are server-only secrets.
revoke select (encrypted_credentials) on public.integration_connections from anon, authenticated;

-- Authorization must compare auth.uid() with users.auth_user_id, not internal users.id.
drop policy if exists organizations_member_select on public.organizations;
create policy organizations_member_select on public.organizations for select to authenticated using (exists (select 1 from public.workspaces w join public.workspace_members wm on wm.workspace_id=w.id join public.users u on u.id=wm.user_id where w.organization_id=organizations.id and u.auth_user_id=(select auth.uid())));
drop policy if exists organizations_owner_manage on public.organizations;
create policy organizations_owner_manage on public.organizations for all to authenticated using (exists (select 1 from public.users u where u.organization_id=organizations.id and u.auth_user_id=(select auth.uid()) and u.role in ('owner','admin'))) with check (exists (select 1 from public.users u where u.organization_id=organizations.id and u.auth_user_id=(select auth.uid()) and u.role in ('owner','admin')));

drop policy if exists users_org_member_select on public.users;
create policy users_org_member_select on public.users for select to authenticated using (auth_user_id=(select auth.uid()) or exists (select 1 from public.workspaces w join public.workspace_members wm on wm.workspace_id=w.id join public.users me on me.id=wm.user_id where w.organization_id=users.organization_id and me.auth_user_id=(select auth.uid())));
drop policy if exists users_self_select on public.users;
drop policy if exists users_self_update on public.users;
create policy users_self_update on public.users for update to authenticated using (auth_user_id=(select auth.uid())) with check (auth_user_id=(select auth.uid()));

drop policy if exists workspaces_member_select on public.workspaces;
create policy workspaces_member_select on public.workspaces for select to authenticated using (private.is_workspace_member(id));
drop policy if exists memberships_self_select on public.workspace_members;

-- Remove redundant manager SELECT coverage by replacing broad ALL policies with writes.
drop policy if exists integration_connections_manager_write on public.integration_connections;
create policy integration_connections_manager_insert on public.integration_connections for insert to authenticated with check (private.has_workspace_role(workspace_id, ARRAY['manager'::text]));
create policy integration_connections_manager_update on public.integration_connections for update to authenticated using (private.has_workspace_role(workspace_id, ARRAY['manager'::text])) with check (private.has_workspace_role(workspace_id, ARRAY['manager'::text]));
create policy integration_connections_manager_delete on public.integration_connections for delete to authenticated using (private.has_workspace_role(workspace_id, ARRAY['manager'::text]));

drop policy if exists job_queue_manager_write on public.job_queue;
create policy job_queue_manager_insert on public.job_queue for insert to authenticated with check (private.has_workspace_role(workspace_id, ARRAY['manager'::text]));
create policy job_queue_manager_update on public.job_queue for update to authenticated using (private.has_workspace_role(workspace_id, ARRAY['manager'::text])) with check (private.has_workspace_role(workspace_id, ARRAY['manager'::text]));
create policy job_queue_manager_delete on public.job_queue for delete to authenticated using (private.has_workspace_role(workspace_id, ARRAY['manager'::text]));

-- Foreign-key indexes. Use the actual schema column names from earlier migrations.
create index if not exists idx_ai_employee_memory_source_task_id on public.ai_employee_memory(source_task_id);
create index if not exists idx_ai_employee_memory_workspace_id on public.ai_employee_memory(workspace_id);
create index if not exists idx_ai_employee_usage_task_id on public.ai_employee_usage(task_id);
create index if not exists idx_approvals_decided_by on public.approvals(decided_by);
create index if not exists idx_approvals_task_id on public.approvals(task_id);
create index if not exists idx_audit_events_task_id on public.audit_events(task_id);
create index if not exists idx_workflow_schedules_workspace_id on public.workflow_schedules(workspace_id);
create index if not exists idx_workflow_triggers_workflow_id on public.workflow_triggers(workflow_id);

commit;
