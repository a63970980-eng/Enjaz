begin;
create index if not exists employee_goals_workspace_idx on public.employee_goals(workspace_id);
create index if not exists employee_knowledge_workspace_idx on public.employee_knowledge(workspace_id);
create index if not exists task_comments_workspace_idx on public.task_comments(workspace_id);
commit;
