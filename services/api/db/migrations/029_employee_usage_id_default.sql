begin;

-- The metering ledger is also used by the runtime's budget function.
-- Keep the schema safe for any internal writer that does not explicitly provide an id.
alter table public.ai_employee_usage
  alter column id set default gen_random_uuid();

commit;
