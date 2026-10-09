-- Complete the persisted AI employee contract used by the workforce repository.
-- These fields were introduced in application code without a matching migration
-- on every clean-install path. Add them with safe defaults so existing rows remain valid.

ALTER TABLE public.ai_employees
  ADD COLUMN IF NOT EXISTS mission text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS responsibilities jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS authority_matrix jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS kpis jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS collaboration jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS escalation_rules jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS industry_context jsonb NOT NULL
    DEFAULT '{"supported":["restaurant","hospital","hotel","enterprise","government"],"current":null}'::jsonb,
  ADD COLUMN IF NOT EXISTS workforce_version integer NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_ai_employees_workspace_role_code_active
  ON public.ai_employees (workspace_id, role_code)
  WHERE status = 'active' AND role_code IS NOT NULL;
