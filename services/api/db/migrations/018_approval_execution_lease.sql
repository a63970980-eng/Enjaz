begin;

-- Prevent duplicate execution of an approved action while allowing recovery after a crashed worker.
alter table approvals
  add column if not exists execution_claimed_at timestamptz;

create index if not exists idx_approvals_execution_lease
  on approvals(status, execution_claimed_at)
  where status = 'approved';

commit;
