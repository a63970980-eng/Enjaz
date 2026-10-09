-- Keep the API workforce contract aligned with the employee schema.
-- The repository's workforce API reads and writes ai_employees.role_code, but
-- older databases created before the workforce catalog rollout do not have it.
-- This additive migration is safe to run against both fresh and existing databases.

ALTER TABLE public.ai_employees
  ADD COLUMN IF NOT EXISTS role_code text;

CREATE INDEX IF NOT EXISTS idx_ai_employees_workspace_role_code_active
  ON public.ai_employees (workspace_id, role_code)
  WHERE status = 'active' AND role_code IS NOT NULL;
