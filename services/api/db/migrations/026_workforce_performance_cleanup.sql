begin;

drop index if exists public.idx_runtime_metrics_workspace_created;
drop index if exists public.idx_usage_events_workspace_created;
drop index if exists public.idx_departments_workspace;
drop index if exists public.idx_employee_goals_employee;
drop index if exists public.idx_employee_knowledge_employee;
drop index if exists public.idx_task_comments_task;
drop index if exists public.idx_employee_handoffs_task;

-- Billing is optional until billing migrations are installed. Guard every
-- optional table so a clean database can apply the full migration chain.
do $$
begin
  if to_regclass('public.billing_customers') is not null then
    execute 'create index if not exists idx_billing_customers_organization_id on public.billing_customers(organization_id)';
  end if;
  if to_regclass('public.billing_subscriptions') is not null then
    execute 'create index if not exists idx_billing_subscriptions_customer_id on public.billing_subscriptions(customer_id)';
  end if;
  if to_regclass('public.departments') is not null then
    execute 'create index if not exists idx_departments_manager_employee_id on public.departments(manager_employee_id)';
  end if;
  if to_regclass('public.employee_handoffs') is not null then
    execute 'create index if not exists idx_employee_handoffs_from_employee_id on public.employee_handoffs(from_employee_id)';
    execute 'create index if not exists idx_employee_handoffs_to_employee_id on public.employee_handoffs(to_employee_id)';
    execute 'create index if not exists idx_employee_handoffs_task_id on public.employee_handoffs(task_id)';
  end if;
  if to_regclass('public.runtime_metrics') is not null then
    execute 'create index if not exists idx_runtime_metrics_task_id on public.runtime_metrics(task_id)';
  end if;
  if to_regclass('public.security_events') is not null then
    execute 'create index if not exists idx_security_events_actor_user_id on public.security_events(actor_user_id)';
    execute 'create index if not exists idx_security_events_organization_id on public.security_events(organization_id)';
  end if;
  if to_regclass('public.task_comments') is not null then
    execute 'create index if not exists idx_task_comments_employee_id on public.task_comments(employee_id)';
  end if;
  if to_regclass('public.usage_events') is not null then
    execute 'create index if not exists idx_usage_events_employee_id on public.usage_events(employee_id)';
    execute 'create index if not exists idx_usage_events_task_id on public.usage_events(task_id)';
  end if;
  if to_regclass('public.workspace_subscriptions') is not null then
    execute 'create index if not exists idx_workspace_subscriptions_plan_id on public.workspace_subscriptions(plan_id)';
  end if;
end $$;

commit;
