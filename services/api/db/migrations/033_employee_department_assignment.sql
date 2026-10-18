BEGIN;

ALTER TABLE public.ai_employees
  ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS ai_employees_department_id_idx
  ON public.ai_employees(department_id);

COMMIT;
