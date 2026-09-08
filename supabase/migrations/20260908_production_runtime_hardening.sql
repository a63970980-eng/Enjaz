-- Enjaz production runtime hardening
-- Applied to Supabase production on 2026-09-08.
REVOKE EXECUTE ON FUNCTION public.ensure_workspace_subscription() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_workspace_subscription() TO service_role;

CREATE OR REPLACE FUNCTION public.enqueue_task_for_worker()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'queued' AND NEW.employee_id IS NOT NULL THEN
    INSERT INTO public.job_queue (workspace_id, job_type, payload, status, max_attempts)
    VALUES (NEW.workspace_id, 'task.execute', jsonb_build_object('taskId', NEW.id, 'employeeId', NEW.employee_id, 'goal', NEW.objective), 'queued', 3);
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_enqueue_task_for_worker ON public.tasks;
CREATE TRIGGER trg_enqueue_task_for_worker AFTER INSERT ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.enqueue_task_for_worker();
REVOKE ALL ON FUNCTION public.enqueue_task_for_worker() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_task_for_worker() TO service_role;

ALTER TABLE public.integration_connections DROP CONSTRAINT IF EXISTS integration_connections_auth_type_check;
ALTER TABLE public.integration_connections ADD CONSTRAINT integration_connections_auth_type_check CHECK (auth_type = ANY (ARRAY['oauth2','api_key','bearer','basic','oauth']));
ALTER TABLE public.integration_connections DROP CONSTRAINT IF EXISTS integration_connections_status_check;
ALTER TABLE public.integration_connections ADD CONSTRAINT integration_connections_status_check CHECK (status = ANY (ARRAY['active','pending','revoked','error']));
