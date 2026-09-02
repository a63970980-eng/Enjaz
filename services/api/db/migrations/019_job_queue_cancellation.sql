begin;

-- cancelJob() uses a first-class cancelled terminal state; keep the database
-- constraint aligned with the queue state machine.
alter table public.job_queue
  drop constraint if exists job_queue_status_check;

alter table public.job_queue
  add constraint job_queue_status_check
  check (status in ('queued','running','succeeded','failed','dead','cancelled'));

commit;
