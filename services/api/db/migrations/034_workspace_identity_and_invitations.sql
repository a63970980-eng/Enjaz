begin;

-- 1. Profile identity used by onboarding-repository.bootstrapWorkspace().
-- A clean install previously failed here because neither migration track defined
-- users.platform_role or public.assign_first_platform_admin(), so the first
-- workspace of every new customer could not be created.
alter table public.users add column if not exists platform_role text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'users_platform_role_check') then
    alter table public.users
      add constraint users_platform_role_check
      check (platform_role is null or platform_role in ('admin', 'support', 'member'));
  end if;
end $$;

create or replace function public.assign_first_platform_admin(p_user_id uuid)
returns text
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
begin
  if p_user_id is null then
    return null;
  end if;
  -- Serialize first-admin election so concurrent first signups cannot both win.
  perform pg_advisory_xact_lock(hashtext('enjaz.platform_admin_election'));
  if exists (select 1 from public.users where platform_role = 'admin') then
    return null;
  end if;
  return 'admin';
end;
$$;

revoke all on function public.assign_first_platform_admin(uuid) from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.assign_first_platform_admin(uuid) to service_role;
  end if;
end $$;

-- 2. Workspace invitations. The token is only ever stored as a SHA-256 hash so a
-- database or backup leak cannot be replayed to join a customer workspace.
create table if not exists public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  role text not null default 'member' check (role in ('viewer', 'member', 'manager')),
  token_hash text not null unique,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
  invited_by uuid references public.users(id) on delete set null,
  accepted_by uuid references public.users(id) on delete set null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists uq_workspace_invitation_pending_email
  on public.workspace_invitations(workspace_id, lower(email))
  where status = 'pending';
create index if not exists idx_workspace_invitations_workspace
  on public.workspace_invitations(workspace_id, status, created_at desc);
create index if not exists idx_workspace_invitations_token
  on public.workspace_invitations(token_hash);

alter table public.workspace_invitations enable row level security;

-- Workspace managers may read invitations for their own workspace. Writes are
-- performed by the API only, so no browser insert/update/delete policy exists.
drop policy if exists workspace_invitations_manager_select on public.workspace_invitations;
create policy workspace_invitations_manager_select on public.workspace_invitations
  for select to authenticated
  using (private.has_workspace_role(workspace_id, array['manager']));

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant select on public.workspace_invitations to authenticated;
  end if;
end $$;

commit;
