begin;

-- Complete the server-side credential contract used by the vault/guard.
alter table public.integration_connections
  add column if not exists auth_type text not null default 'api_key',
  add column if not exists scopes jsonb not null default '[]',
  add column if not exists status text not null default 'active',
  add column if not exists metadata jsonb not null default '{}',
  add column if not exists expires_at timestamptz;

alter table public.integration_connections
  drop constraint if exists integration_connections_status_check;
alter table public.integration_connections
  add constraint integration_connections_status_check
  check (status in ('active','disabled','expired','error'));

create index if not exists idx_integration_connections_status
  on public.integration_connections(workspace_id,status,enabled);
create index if not exists idx_integration_connections_expiry
  on public.integration_connections(expires_at)
  where expires_at is not null;

commit;
