begin;

-- Persist per-employee execution policy used by the runtime.
alter table public.ai_employees
  add column if not exists policy jsonb not null default '{}'::jsonb;

commit;
