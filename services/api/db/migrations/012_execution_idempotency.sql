begin;

alter table public.execution_steps add column if not exists attempt_key text;
create unique index if not exists idx_execution_steps_attempt_key on public.execution_steps(graph_id,attempt_key) where attempt_key is not null;
create unique index if not exists idx_job_queue_step_execution on public.job_queue((payload->>'graphId'),(payload->'step'->>'id')) where job_type='employee.step';

commit;
