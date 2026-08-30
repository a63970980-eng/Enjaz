begin;

create table if not exists public.execution_graphs (
 id uuid primary key,
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 task_id uuid not null references public.tasks(id) on delete cascade,
 employee_id uuid not null references public.ai_employees(id) on delete cascade,
 goal text not null,
 status text not null default 'pending' check(status in ('pending','running','waiting_approval','succeeded','failed','cancelled')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(task_id)
);
create table if not exists public.execution_steps (
 id uuid primary key,
 graph_id uuid not null references public.execution_graphs(id) on delete cascade,
 step_key text not null,
 intent text not null,
 action text,
 input jsonb not null default '{}',
 depends_on text[] not null default '{}',
 status text not null default 'pending' check(status in ('pending','ready','running','waiting_approval','succeeded','failed','cancelled')),
 job_id uuid references public.job_queue(id) on delete set null,
 output jsonb,
 error text,
 attempts integer not null default 0,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(graph_id,step_key)
);
create index if not exists idx_execution_graph_workspace on public.execution_graphs(workspace_id,status);
create index if not exists idx_execution_steps_ready on public.execution_steps(graph_id,status);
alter table public.execution_graphs enable row level security;
alter table public.execution_steps enable row level security;
create policy execution_graph_workspace_member on public.execution_graphs for all to authenticated using (private.is_workspace_member(workspace_id)) with check (private.is_workspace_member(workspace_id));
create policy execution_steps_workspace_member on public.execution_steps for all to authenticated using (exists(select 1 from public.execution_graphs g where g.id=graph_id and private.is_workspace_member(g.workspace_id))) with check (exists(select 1 from public.execution_graphs g where g.id=graph_id and private.is_workspace_member(g.workspace_id)));

commit;
