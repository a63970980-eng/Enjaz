begin;
create index if not exists idx_execution_steps_graph_status on public.execution_steps(graph_id,status);
create index if not exists idx_execution_steps_job on public.execution_steps(job_id) where job_id is not null;
create index if not exists idx_execution_graph_task on public.execution_graphs(task_id);
commit;
