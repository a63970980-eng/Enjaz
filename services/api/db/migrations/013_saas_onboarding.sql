begin;

-- Production onboarding identity: one Enjaz user record maps to one Supabase Auth user.
-- Existing installs may already have this column from migration 006; this is idempotent.
alter table public.users add column if not exists auth_user_id uuid;
create unique index if not exists idx_users_auth_user_id on public.users(auth_user_id) where auth_user_id is not null;

-- Fast lookup for the first-workspace experience.
create index if not exists idx_workspace_members_user_created on public.workspace_members(user_id, created_at desc);

commit;
