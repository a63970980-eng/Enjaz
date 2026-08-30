begin;

create table if not exists public.ai_employee_memory (
  id uuid primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  employee_id uuid not null references public.ai_employees(id) on delete cascade,
  memory_type text not null check (memory_type in ('fact','preference','decision','summary','instruction')),
  key text not null,
  content text not null,
  importance smallint not null default 3 check (importance between 1 and 5),
  source_task_id uuid references public.tasks(id) on delete set null,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(employee_id,key)
);
create index if not exists idx_ai_employee_memory_employee on public.ai_employee_memory(employee_id,importance desc,updated_at desc);
create index if not exists idx_ai_employee_memory_workspace on public.ai_employee_memory(workspace_id);
alter table public.ai_employee_memory enable row level security;
create policy ai_employee_memory_member on public.ai_employee_memory for all to authenticated using (private.is_workspace_member(workspace_id)) with check (private.is_workspace_member(workspace_id));

commit;
