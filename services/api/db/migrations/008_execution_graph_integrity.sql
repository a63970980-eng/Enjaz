begin;

-- Prevent a graph from mixing tenants: every referenced employee and task must
-- belong to the same workspace as the graph. Composite uniqueness enables the
-- database to enforce this invariant instead of relying only on application code.
create unique index if not exists uq_tasks_workspace_id_id on public.tasks(workspace_id,id);
create unique index if not exists uq_ai_employees_workspace_id_id on public.ai_employees(workspace_id,id);
alter table public.execution_graphs drop constraint if exists execution_graphs_task_workspace_fkey;
alter table public.execution_graphs drop constraint if exists execution_graphs_employee_workspace_fkey;
alter table public.execution_graphs add constraint execution_graphs_task_workspace_fkey foreign key(workspace_id,task_id) references public.tasks(workspace_id,id) on delete cascade;
alter table public.execution_graphs add constraint execution_graphs_employee_workspace_fkey foreign key(workspace_id,employee_id) references public.ai_employees(workspace_id,id) on delete cascade;

-- Keep step state monotonic at the database boundary for terminal states.
alter table public.execution_steps drop constraint if exists execution_steps_attempts_nonnegative;
alter table public.execution_steps add constraint execution_steps_attempts_nonnegative check(attempts >= 0);

commit;
