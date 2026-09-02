begin;

-- Make queue idempotency atomic under concurrent enqueue requests.
create unique index if not exists idx_job_queue_workspace_type_idempotency
  on public.job_queue(workspace_id,job_type,(payload->>'idempotencyKey'))
  where payload ? 'idempotencyKey';

commit;
