begin;

create table if not exists public.execution_graphs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  employee_id uuid not null references public.ai_employees(id) on delete cascade,
  goal text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.execution_steps (
  id uuid primary key default gen_random_uuid(),
  graph_id uuid not null references public.execution_graphs(id) on delete cascade,
  step_key text not null,
  intent text not null default '',
  action text not null,
  input jsonb not null default '{}'::jsonb,
  depends_on text[] not null default '{}',
  status text not null default 'pending',
  job_id uuid references public.job_queue(id) on delete set null,
  output jsonb,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(graph_id, step_key)
);

create index if not exists execution_graphs_workspace_idx on public.execution_graphs(workspace_id, created_at desc);
create index if not exists execution_graphs_task_idx on public.execution_graphs(task_id);
create index if not exists execution_steps_graph_status_idx on public.execution_steps(graph_id, status);
create index if not exists execution_steps_job_idx on public.execution_steps(job_id);

alter table public.execution_graphs enable row level security;
alter table public.execution_steps enable row level security;

drop policy if exists execution_graphs_member_select on public.execution_graphs;
create policy execution_graphs_member_select on public.execution_graphs for select using (private.is_workspace_member(workspace_id));

drop policy if exists execution_steps_member_select on public.execution_steps;
create policy execution_steps_member_select on public.execution_steps for select using (exists (select 1 from public.execution_graphs g where g.id = graph_id and private.is_workspace_member(g.workspace_id)));

commit;
