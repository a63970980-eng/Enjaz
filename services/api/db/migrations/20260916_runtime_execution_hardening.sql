-- Reproducible runtime schema for the Enjaz AI workforce engine.
-- Idempotent so it can safely run against existing installations.

CREATE TABLE IF NOT EXISTS public.ai_employee_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.ai_employees(id) ON DELETE CASCADE,
  task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  memory_type text NOT NULL DEFAULT 'task',
  key text,
  content text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  importance integer NOT NULL DEFAULT 3,
  source_task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  expires_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_employee_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.ai_employees(id) ON DELETE CASCADE,
  task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  usage_type text NOT NULL DEFAULT 'model',
  units bigint NOT NULL DEFAULT 0,
  cost_cents bigint NOT NULL DEFAULT 0 CHECK (cost_cents >= 0),
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.job_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  job_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'queued',
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3,
  available_at timestamptz NOT NULL DEFAULT now(),
  locked_at timestamptz,
  locked_by text,
  last_error text,
  result jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.execution_graphs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.ai_employees(id) ON DELETE CASCADE,
  goal text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.execution_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  graph_id uuid NOT NULL REFERENCES public.execution_graphs(id) ON DELETE CASCADE,
  step_key text NOT NULL,
  intent text NOT NULL DEFAULT '',
  action text NOT NULL,
  input jsonb NOT NULL DEFAULT '{}',
  depends_on text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending',
  job_id uuid REFERENCES public.job_queue(id) ON DELETE SET NULL,
  output jsonb,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (graph_id, step_key)
);

CREATE TABLE IF NOT EXISTS public.task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  author_user_id uuid,
  employee_id uuid REFERENCES public.ai_employees(id) ON DELETE SET NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.task_delegations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  parent_task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  child_task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  from_employee_id uuid REFERENCES public.ai_employees(id) ON DELETE SET NULL,
  to_employee_id uuid REFERENCES public.ai_employees(id) ON DELETE SET NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  context jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.employee_handoffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  from_employee_id uuid NOT NULL REFERENCES public.ai_employees(id) ON DELETE CASCADE,
  to_employee_id uuid NOT NULL REFERENCES public.ai_employees(id) ON DELETE CASCADE,
  task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  reason text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.runtime_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES public.ai_employees(id) ON DELETE SET NULL,
  task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  provider text NOT NULL DEFAULT 'deterministic',
  status text NOT NULL DEFAULT 'succeeded',
  latency_ms integer,
  cost_cents integer NOT NULL DEFAULT 0,
  error_code text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_employee_memory ADD COLUMN IF NOT EXISTS key text;
ALTER TABLE public.ai_employee_memory ADD COLUMN IF NOT EXISTS importance integer NOT NULL DEFAULT 3;
ALTER TABLE public.ai_employee_memory ADD COLUMN IF NOT EXISTS source_task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL;
ALTER TABLE public.ai_employee_memory ADD COLUMN IF NOT EXISTS expires_at timestamptz;
ALTER TABLE public.ai_employee_memory ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
UPDATE public.ai_employee_memory SET key = COALESCE(NULLIF(key, ''), 'memory-' || id::text) WHERE key IS NULL OR key = '';

ALTER TABLE public.ai_employees ADD COLUMN IF NOT EXISTS policy jsonb NOT NULL DEFAULT '{}';
ALTER TABLE public.ai_employees ADD COLUMN IF NOT EXISTS department_id uuid;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS parent_task_id uuid;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS assigned_by_employee_id uuid;
ALTER TABLE public.approvals ADD COLUMN IF NOT EXISTS execution_claimed_at timestamptz;
ALTER TABLE public.approvals ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS uq_ai_employee_memory_employee_key ON public.ai_employee_memory(employee_id, key);
CREATE INDEX IF NOT EXISTS idx_ai_memory_employee ON public.ai_employee_memory(workspace_id, employee_id, importance DESC, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_task ON public.ai_employee_usage(workspace_id, employee_id, task_id, created_at);
CREATE INDEX IF NOT EXISTS idx_job_queue_claim ON public.job_queue(status, available_at, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS uq_job_queue_idempotency ON public.job_queue(workspace_id, job_type, (payload->>'idempotencyKey')) WHERE payload ? 'idempotencyKey';
CREATE INDEX IF NOT EXISTS idx_execution_graph_task ON public.execution_graphs(workspace_id, task_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_execution_steps_graph_status ON public.execution_steps(graph_id, status);
CREATE INDEX IF NOT EXISTS idx_task_comments_task ON public.task_comments(workspace_id, task_id, created_at);
CREATE INDEX IF NOT EXISTS idx_task_delegations_parent ON public.task_delegations(workspace_id, parent_task_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_handoffs_task ON public.employee_handoffs(workspace_id, task_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.charge_employee_budget(
  p_workspace_id uuid,
  p_employee_id uuid,
  p_task_id uuid,
  p_usage_type text,
  p_cost_cents bigint,
  p_metadata jsonb DEFAULT '{}'
) RETURNS bigint
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_budget bigint;
  v_spent bigint;
BEGIN
  IF p_cost_cents IS NULL OR p_cost_cents < 0 THEN
    RAISE EXCEPTION 'Invalid usage cost';
  END IF;
  SELECT budget_cents INTO v_budget
  FROM public.ai_employees
  WHERE id = p_employee_id AND workspace_id = p_workspace_id AND status = 'active'
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Active AI employee not found in workspace';
  END IF;
  SELECT COALESCE(SUM(cost_cents), 0) INTO v_spent
  FROM public.ai_employee_usage
  WHERE workspace_id = p_workspace_id AND employee_id = p_employee_id;
  IF v_budget > 0 AND v_spent + p_cost_cents > v_budget THEN
    RAISE EXCEPTION 'AI employee budget exceeded';
  END IF;
  INSERT INTO public.ai_employee_usage(workspace_id, employee_id, task_id, usage_type, units, cost_cents, metadata)
  VALUES (p_workspace_id, p_employee_id, p_task_id, p_usage_type, 1, p_cost_cents, COALESCE(p_metadata, '{}'));
  RETURN p_cost_cents;
END;
$$;

REVOKE ALL ON FUNCTION public.charge_employee_budget(uuid, uuid, uuid, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.charge_employee_budget(uuid, uuid, uuid, text, bigint, jsonb) TO service_role;
