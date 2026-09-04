begin;

-- Codify tables already used by the workforce API so a clean install and the
-- production database share the same contract.
create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  description text,
  manager_employee_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.employee_goals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  employee_id uuid not null references public.ai_employees(id) on delete cascade,
  title text not null,
  target numeric,
  current_value numeric not null default 0,
  unit text,
  period text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.employee_knowledge (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  employee_id uuid not null references public.ai_employees(id) on delete cascade,
  title text not null,
  content text not null,
  source text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.task_comments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  author_user_id uuid references public.users(id) on delete set null,
  employee_id uuid references public.ai_employees(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.employee_handoffs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  from_employee_id uuid not null references public.ai_employees(id) on delete cascade,
  to_employee_id uuid not null references public.ai_employees(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete cascade,
  reason text not null,
  payload jsonb not null default '{}',
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists idx_departments_workspace on public.departments(workspace_id,created_at);
create index if not exists idx_employee_goals_employee on public.employee_goals(workspace_id,employee_id,created_at desc);
create index if not exists idx_employee_knowledge_employee on public.employee_knowledge(workspace_id,employee_id,updated_at desc);
create index if not exists idx_task_comments_task on public.task_comments(workspace_id,task_id,created_at);
create index if not exists idx_employee_handoffs_task on public.employee_handoffs(workspace_id,task_id,created_at desc);

alter table public.departments enable row level security;
alter table public.employee_goals enable row level security;
alter table public.employee_knowledge enable row level security;
alter table public.task_comments enable row level security;
alter table public.employee_handoffs enable row level security;

drop policy if exists departments_workspace_member on public.departments;
create policy departments_workspace_member on public.departments for all to authenticated using (private.is_workspace_member(workspace_id)) with check (private.is_workspace_member(workspace_id));
drop policy if exists employee_goals_workspace_member on public.employee_goals;
create policy employee_goals_workspace_member on public.employee_goals for all to authenticated using (private.is_workspace_member(workspace_id)) with check (private.is_workspace_member(workspace_id));
drop policy if exists employee_knowledge_workspace_member on public.employee_knowledge;
create policy employee_knowledge_workspace_member on public.employee_knowledge for all to authenticated using (private.is_workspace_member(workspace_id)) with check (private.is_workspace_member(workspace_id));
drop policy if exists task_comments_workspace_member on public.task_comments;
create policy task_comments_workspace_member on public.task_comments for all to authenticated using (private.is_workspace_member(workspace_id)) with check (private.is_workspace_member(workspace_id));
drop policy if exists employee_handoffs_workspace_member on public.employee_handoffs;
create policy employee_handoffs_workspace_member on public.employee_handoffs for all to authenticated using (private.is_workspace_member(workspace_id)) with check (private.is_workspace_member(workspace_id));

commit;
