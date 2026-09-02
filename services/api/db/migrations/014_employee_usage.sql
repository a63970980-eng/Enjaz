begin;

-- Metered execution ledger used by the runtime to enforce employee budgets.
create table if not exists public.ai_employee_usage (
  id uuid primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  employee_id uuid not null references public.ai_employees(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  usage_type text not null,
  units integer not null default 1 check (units > 0),
  cost_cents bigint not null default 0 check (cost_cents >= 0),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_employee_usage_employee_created
  on public.ai_employee_usage(employee_id, created_at desc);
create index if not exists idx_ai_employee_usage_workspace_created
  on public.ai_employee_usage(workspace_id, created_at desc);

alter table public.ai_employee_usage enable row level security;
create policy ai_employee_usage_workspace_member on public.ai_employee_usage
  for select to authenticated
  using (private.is_workspace_member(workspace_id));

create or replace function public.employee_remaining_budget(target_employee uuid)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select greatest(
    e.budget_cents - coalesce((
      select sum(u.cost_cents)
      from public.ai_employee_usage u
      where u.employee_id = e.id
        and u.workspace_id = e.workspace_id
    ), 0),
    0
  )
  from public.ai_employees e
  where e.id = target_employee;
$$;

revoke all on function public.employee_remaining_budget(uuid) from public, anon, authenticated;

commit;
