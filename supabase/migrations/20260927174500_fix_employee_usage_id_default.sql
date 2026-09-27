-- Ensure usage rows created by budget accounting always receive their required primary key.
-- The budget function intentionally inserts the usage row without an explicit id.
-- A database default keeps that function safe and preserves its existing API/semantics.
alter table if exists public.ai_employee_usage
  alter column id set default gen_random_uuid();
