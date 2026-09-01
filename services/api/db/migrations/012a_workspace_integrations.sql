begin;

-- Integration connections are workspace-scoped server-side credentials.
create table if not exists public.integration_connections (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  provider text not null,
  name text not null,
  encrypted_credentials text not null,
  config jsonb not null default '{}',
  enabled boolean not null default true,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id,name)
);
create index if not exists idx_integration_connections_workspace on public.integration_connections(workspace_id,enabled);

alter table public.integration_connections enable row level security;

drop policy if exists integration_connections_workspace_member on public.integration_connections;
create policy integration_connections_workspace_member on public.integration_connections
  for select to authenticated
  using (private.is_workspace_member(workspace_id));

create or replace function public.touch_integration_connection()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists trg_touch_integration_connection on public.integration_connections;
create trigger trg_touch_integration_connection
before update on public.integration_connections
for each row execute function public.touch_integration_connection();

-- Manager authorization helper used by later hardening policies.
create or replace function private.has_workspace_role(target_workspace uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public, private, auth
as $$
  select exists (
    select 1
    from public.workspace_members wm
    join public.users u on u.id=wm.user_id
    where wm.workspace_id=target_workspace
      and u.auth_user_id=(select auth.uid())
      and wm.role = any(allowed_roles)
  );
$$;
revoke all on function private.has_workspace_role(uuid,text[]) from public, anon, authenticated;
grant execute on function private.has_workspace_role(uuid,text[]) to authenticated;

commit;
