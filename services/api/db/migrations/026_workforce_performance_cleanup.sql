begin;

-- Remove exact duplicate indexes while keeping established enterprise names.
drop index if exists public.idx_runtime_metrics_workspace_created;
drop index if exists public.idx_usage_events_workspace_created;
drop index if exists public.idx_departments_workspace;
drop index if exists public.idx_employee_goals_employee;
drop index if exists public.idx_employee_knowledge_employee;
drop index if exists public.idx_task_comments_task;
drop index if exists public.idx_employee_handoffs_task;

-- Cover foreign keys used in joins, deletes and tenant-scoped lookups.
create index if not exists idx_billing_customers_organization_id on public.billing_customers(organization_id);
create index if not exists idx_billing_subscriptions_customer_id on public.billing_subscriptions(customer_id);
create index if not exists idx_departments_manager_employee_id on public.departments(manager_employee_id);
create index if not exists idx_employee_handoffs_from_employee_id on public.employee_handoffs(from_employee_id);
create index if not exists idx_employee_handoffs_to_employee_id on public.employee_handoffs(to_employee_id);
create index if not exists idx_employee_handoffs_task_id on public.employee_handoffs(task_id);
create index if not exists idx_runtime_metrics_task_id on public.runtime_metrics(task_id);
create index if not exists idx_security_events_actor_user_id on public.security_events(actor_user_id);
create index if not exists idx_security_events_organization_id on public.security_events(organization_id);
create index if not exists idx_task_comments_employee_id on public.task_comments(employee_id);
create index if not exists idx_usage_events_employee_id on public.usage_events(employee_id);
create index if not exists idx_usage_events_task_id on public.usage_events(task_id);
create index if not exists idx_workspace_subscriptions_plan_id on public.workspace_subscriptions(plan_id);

commit;
