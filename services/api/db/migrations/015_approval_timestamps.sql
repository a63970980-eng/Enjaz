-- ENJAZ migration 015: approval update timestamp
begin;

alter table approvals add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_approvals_workspace_updated
  on approvals(workspace_id, updated_at desc);

commit;
