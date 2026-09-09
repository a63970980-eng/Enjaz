create table if not exists public.auth_signup_rate_limits (
  key_hash text primary key,
  window_started_at timestamptz not null default now(),
  attempts integer not null default 0 check (attempts >= 0),
  updated_at timestamptz not null default now()
);

alter table public.auth_signup_rate_limits enable row level security;

revoke all on public.auth_signup_rate_limits from anon, authenticated;
grant select, insert, update, delete on public.auth_signup_rate_limits to service_role;

create index if not exists auth_signup_rate_limits_updated_idx on public.auth_signup_rate_limits(updated_at);
