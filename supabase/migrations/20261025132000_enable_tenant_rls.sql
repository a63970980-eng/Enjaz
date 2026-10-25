-- Tenant isolation for the identity core.
--
-- `users`, `organizations`, `workspaces` and `workspace_members` already carried
-- carefully written policies, but row level security was never enabled on them.
-- Any signed-in identity could therefore read (and, where privileges were
-- granted, write) every tenant's users, organizations and memberships directly
-- through PostgREST. This migration turns the existing policies on, adds the
-- missing roster policies, and keeps every predicate in a SECURITY DEFINER
-- helper so a policy never recursively reads a table that has RLS enabled.
begin;

create or replace function private.can_view_user(target_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public, private, auth
as $$
  select exists (
    select 1 from public.users u
     where u.id = target_user and u.auth_user_id = (select auth.uid())
  ) or exists (
    select 1
      from public.users target
      join public.workspaces w on w.organization_id = target.organization_id
      join public.workspace_members wm on wm.workspace_id = w.id
      join public.users me on me.id = wm.user_id
     where target.id = target_user
       and me.auth_user_id = (select auth.uid())
  );
$$;

create or replace function private.is_workspace_manager(target_workspace uuid)
returns boolean
language sql
stable
security definer
set search_path = public, private, auth
as $$
  select exists (
    select 1
      from public.workspace_members wm
      join public.users u on u.id = wm.user_id
     where wm.workspace_id = target_workspace
       and u.auth_user_id = (select auth.uid())
       and wm.role = 'manager'
  );
$$;

revoke all on function private.can_view_user(uuid) from public;
revoke all on function private.is_workspace_manager(uuid) from public;
grant execute on function private.can_view_user(uuid) to authenticated;
grant execute on function private.is_workspace_manager(uuid) to authenticated;

drop policy if exists users_org_member_select on public.users;
create policy users_visible_to_self_and_org on public.users
  for select to authenticated
  using (private.can_view_user(id));

alter table public.users enable row level security;
alter table public.organizations enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;

drop policy if exists workspace_members_member_select on public.workspace_members;
create policy workspace_members_member_select on public.workspace_members
  for select to authenticated
  using (private.is_workspace_member(workspace_id));

drop policy if exists workspace_members_manager_insert on public.workspace_members;
create policy workspace_members_manager_insert on public.workspace_members
  for insert to authenticated
  with check (private.is_workspace_manager(workspace_id));

drop policy if exists workspace_members_manager_update on public.workspace_members;
create policy workspace_members_manager_update on public.workspace_members
  for update to authenticated
  using (private.is_workspace_manager(workspace_id))
  with check (private.is_workspace_manager(workspace_id));

drop policy if exists workspace_members_manager_delete on public.workspace_members;
create policy workspace_members_manager_delete on public.workspace_members
  for delete to authenticated
  using (private.is_workspace_manager(workspace_id));

do $$
begin
  if to_regclass('public.ai_employee_memory_embeddings') is not null then
    drop policy if exists ai_memory_embeddings_member_select on public.ai_employee_memory_embeddings;
    create policy ai_memory_embeddings_member_select on public.ai_employee_memory_embeddings
      for select to authenticated
      using (private.is_workspace_member(workspace_id));
  end if;
end $$;

commit;
