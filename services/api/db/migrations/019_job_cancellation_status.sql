begin;

-- Keep operator cancellation a first-class queue state. Existing deployments may
-- have been created by 002_runtime.sql with the original status check constraint.
do $$
declare
  c record;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid='public.job_queue'::regclass
      and contype='c'
      and pg_get_constraintdef(oid) like '%status%'
      and pg_get_constraintdef(oid) like '%queued%'
      and pg_get_constraintdef(oid) like '%running%'
  loop
    execute format('alter table public.job_queue drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.job_queue
  add constraint job_queue_status_check
  check(status in ('queued','running','succeeded','failed','dead','cancelled'));

create index if not exists idx_job_queue_cancelled
  on public.job_queue(workspace_id,updated_at desc)
  where status='cancelled';

commit;
