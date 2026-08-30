begin;

create table if not exists public.job_queue (
 id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
 job_type text not null, payload jsonb not null default '{}', status text not null default 'queued' check(status in ('queued','running','succeeded','failed','dead')),
 attempts integer not null default 0 check(attempts>=0), max_attempts integer not null default 3 check(max_attempts>0), available_at timestamptz not null default now(),
 locked_at timestamptz, locked_by text, result jsonb, last_error text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists idx_job_queue_claim on public.job_queue(status,available_at,created_at);
create index if not exists idx_job_queue_workspace on public.job_queue(workspace_id,status);

create table if not exists public.workflow_triggers (
 id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
 workflow_id uuid not null, trigger_type text not null, enabled boolean not null default true, created_at timestamptz not null default now()
);
create index if not exists idx_workflow_triggers_workspace on public.workflow_triggers(workspace_id,trigger_type,enabled);

create table if not exists public.webhook_deliveries (
 id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
 trigger_id uuid not null references public.workflow_triggers(id) on delete cascade, event_id text not null, payload jsonb not null default '{}', received_at timestamptz not null default now(),
 unique(trigger_id,event_id)
);

create table if not exists public.workflow_schedules (
 id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
 workflow_id uuid not null, cron_expression text not null, timezone text not null default 'UTC', enabled boolean not null default true,
 last_run_at timestamptz, next_run_at timestamptz, updated_at timestamptz not null default now()
);
create index if not exists idx_workflow_schedules_due on public.workflow_schedules(enabled,next_run_at);

create table if not exists public.worker_heartbeats (
 worker_id text primary key, status text not null default 'online' check(status in ('online','draining','offline')),
 started_at timestamptz not null default now(), last_seen_at timestamptz not null default now(), metadata jsonb not null default '{}'
);
create index if not exists idx_worker_heartbeats_seen on public.worker_heartbeats(last_seen_at);

create table if not exists public.job_attempts (
 id uuid primary key default gen_random_uuid(), job_id uuid not null references public.job_queue(id) on delete cascade,
 worker_id text not null, attempt integer not null, status text not null check(status in ('started','succeeded','failed')),
 error text, started_at timestamptz not null default now(), finished_at timestamptz
);
create index if not exists idx_job_attempts_job on public.job_attempts(job_id,attempt desc);

commit;
