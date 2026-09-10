alter table public.ai_employees
  add column if not exists department_id uuid references public.departments(id) on delete set null;

create index if not exists ai_employees_department_id_idx
  on public.ai_employees(department_id);
