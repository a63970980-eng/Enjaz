begin;

-- Make metered tool execution charges idempotent so retries/replays cannot double-charge a task.
create unique index if not exists idx_ai_employee_usage_execution_key
  on public.ai_employee_usage(employee_id,(metadata->>'executionKey'))
  where metadata ? 'executionKey';

create or replace function public.charge_employee_budget(
  target_workspace uuid,
  target_employee uuid,
  target_task uuid,
  target_usage_type text,
  target_cost_cents bigint,
  target_metadata jsonb default '{}'
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  budget bigint;
  spent bigint;
  existing_cost bigint;
  execution_key text;
begin
  if target_cost_cents < 0 then
    raise exception 'Budget charge cannot be negative';
  end if;

  execution_key := nullif(target_metadata->>'executionKey','');
  if execution_key is not null then
    select u.cost_cents into existing_cost
    from public.ai_employee_usage u
    where u.employee_id = target_employee
      and u.metadata->>'executionKey' = execution_key
    limit 1;
    if found then
      return existing_cost;
    end if;
  end if;

  select e.budget_cents into budget
  from public.ai_employees e
  where e.id = target_employee
    and e.workspace_id = target_workspace
    and e.status = 'active'
  for update;
  if not found then
    raise exception 'Active AI employee not found in workspace';
  end if;

  select coalesce(sum(u.cost_cents), 0) into spent
  from public.ai_employee_usage u
  where u.employee_id = target_employee
    and u.workspace_id = target_workspace;

  if spent + target_cost_cents > budget then
    raise exception 'Insufficient AI employee budget: % cents remaining, % cents required', greatest(budget - spent, 0), target_cost_cents;
  end if;

  insert into public.ai_employee_usage
    (id, workspace_id, employee_id, task_id, usage_type, units, cost_cents, metadata)
  values
    (gen_random_uuid(), target_workspace, target_employee, target_task, target_usage_type, 1, target_cost_cents, coalesce(target_metadata, '{}'));

  return target_cost_cents;
exception
  when unique_violation then
    if execution_key is not null then
      select u.cost_cents into existing_cost
      from public.ai_employee_usage u
      where u.employee_id = target_employee
        and u.metadata->>'executionKey' = execution_key
      limit 1;
      if found then return existing_cost; end if;
    end if;
    raise;
end;
$$;

revoke all on function public.charge_employee_budget(uuid, uuid, uuid, text, bigint, jsonb) from public, anon, authenticated;

commit;
