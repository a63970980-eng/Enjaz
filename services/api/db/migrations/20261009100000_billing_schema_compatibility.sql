-- Align the billing API contract with the deployed Supabase billing schema.
-- Some deployed projects use saas_plans (UUID ids) while the API's clean-install
-- schema uses billing_plans (text ids). Keep the API contract stable without
-- rewriting existing subscriptions or plan identifiers.

DO $$
DECLARE
  billing_kind "char";
BEGIN
  SELECT c.relkind INTO billing_kind
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'billing_plans';

  IF billing_kind IS NULL AND to_regclass('public.saas_plans') IS NOT NULL THEN
    ALTER TABLE public.saas_plans
      ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS max_tasks_month integer NOT NULL DEFAULT 100,
      ADD COLUMN IF NOT EXISTS max_integrations integer NOT NULL DEFAULT 2,
      ADD COLUMN IF NOT EXISTS included_ai_cost_cents integer NOT NULL DEFAULT 0;

    UPDATE public.saas_plans
    SET max_tasks_month = GREATEST(included_runs, 1),
        max_integrations = CASE code
          WHEN 'starter' THEN 2
          WHEN 'growth' THEN 10
          WHEN 'enterprise' THEN 50
          ELSE GREATEST(max_integrations, 2)
        END;

    EXECUTE $view$
      CREATE VIEW public.billing_plans WITH (security_invoker = true) AS
      SELECT id, code, name, description,
             monthly_cents AS monthly_price_cents,
             max_employees, max_tasks_month, max_integrations,
             included_ai_cost_cents, features, active, created_at
      FROM public.saas_plans
    $view$;
  ELSIF billing_kind IN ('r', 'p') THEN
    ALTER TABLE public.billing_plans
      ADD COLUMN IF NOT EXISTS code text;

    UPDATE public.billing_plans
    SET code = id
    WHERE code IS NULL OR btrim(code) = '';

    ALTER TABLE public.billing_plans
      ALTER COLUMN code SET NOT NULL;

    CREATE UNIQUE INDEX IF NOT EXISTS billing_plans_code_unique
      ON public.billing_plans(code);
  ELSIF billing_kind = 'v' THEN
    -- An existing compatibility view is already in place.
    NULL;
  ELSE
    RAISE EXCEPTION 'Neither public.billing_plans nor public.saas_plans exists';
  END IF;
END $$;
