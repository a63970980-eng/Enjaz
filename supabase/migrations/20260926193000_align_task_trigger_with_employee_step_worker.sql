create or replace function public.enqueue_task_for_worker()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if new.status='queued' and new.employee_id is not null then
    insert into public.job_queue (id,workspace_id,job_type,payload,status,max_attempts)
    values (
      gen_random_uuid(),
      new.workspace_id,
      'employee.step',
      jsonb_build_object(
        'taskId',new.id,
        'employeeId',new.employee_id,
        'step',jsonb_build_object(
          'id','direct',
          'intent','analyze',
          'action',coalesce(nullif(new.input->>'action',''),'data.analyze'),
          'input',coalesce(new.input->'input','{}'::jsonb),
          'dependsOn',jsonb_build_array()
        ),
        'idempotencyKey','task:'||new.id::text
      ),
      'queued',
      3
    );
  end if;
  return new;
end;
$$;
