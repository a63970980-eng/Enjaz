begin;

-- This migration sorts before the timestamped completion migration, so create
-- the small operational relations/columns needed by its indexes first.
create table if not exists public.runtime_metrics (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  employee_id uuid references public.ai_employees(id) on delete set null,
  task_id uuid references public.tasks(id) on delete set null,
  provider text not null default 'deterministic',
  status text not null default 'succeeded',
  latency_ms integer,
  cost_cents integer not null default 0,
  error_code text,
  created_at timestamptz not null default now()
);
alter table public.tasks add column if not exists assigned_by_employee_id uuid references public.ai_employees(id) on delete set null;
alter table public.tasks add column if not exists parent_task_id uuid references public.tasks(id) on delete set null;

create index if not exists tasks_assigned_by_employee_id_idx on public.tasks(assigned_by_employee_id);
create index if not exists tasks_parent_task_id_idx on public.tasks(parent_task_id);
create index if not exists tasks_parent_idx on public.tasks(workspace_id,parent_task_id);
create index if not exists employee_goals_employee_idx on public.employee_goals(employee_id);
create index if not exists employee_goals_workspace_idx on public.employee_goals(workspace_id);
create index if not exists employee_knowledge_employee_idx on public.employee_knowledge(employee_id);
create index if not exists employee_knowledge_workspace_idx on public.employee_knowledge(workspace_id);
create index if not exists approvals_task_id_idx on public.approvals(task_id);
create index if not exists approvals_decided_by_idx on public.approvals(decided_by);
create index if not exists audit_events_task_id_idx on public.audit_events(task_id);
create index if not exists audit_events_employee_created_idx on public.audit_events(employee_id,created_at desc);
create index if not exists runtime_metrics_task_id_idx on public.runtime_metrics(task_id);
create index if not exists runtime_metrics_employee_created_idx on public.runtime_metrics(employee_id,created_at desc);

commit;
