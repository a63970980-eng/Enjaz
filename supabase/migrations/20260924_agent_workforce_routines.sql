-- ENJAZ Agent Workforce upgrade
-- Inspired by open-source AI employee patterns: scheduled routines, durable queue execution,
-- delegation, and governed tool calls. This migration extends the existing schedule engine
-- rather than introducing a second scheduler.

create or replace function public.enjaz_process_due_schedules()
returns integer
language plpgsql
security definer
set search_path=public
as $$
declare
  r record;
  created_count integer := 0;
  mins integer;
  task_id uuid;
  action_name text;
  routine_input jsonb;
  routine_key text;
begin
  for r in
    select s.*, e.name employee_name, e.goal employee_goal, e.tools employee_tools
    from employee_schedules s
    join ai_employees e on e.id=s.employee_id and e.workspace_id=s.workspace_id
    where s.enabled=true
      and s.next_run_at is not null
      and s.next_run_at<=now()
      and e.status='active'
    for update of s skip locked
  loop
    mins := greatest(1, coalesce((r.schedule->>'intervalMinutes')::integer, 1440));
    action_name := coalesce(nullif(r.schedule->>'action',''),'data.analyze');
    routine_input := coalesce(r.schedule->'input','{}'::jsonb);
    routine_key := 'routine:'||r.id::text||':'||to_char(r.next_run_at at time zone 'UTC','YYYYMMDDHH24MISSMS');

    insert into tasks(id,workspace_id,employee_id,title,objective,priority,input,status)
    values(
      gen_random_uuid(),
      r.workspace_id,
      r.employee_id,
      coalesce(r.schedule->>'title','Scheduled task — '||r.employee_name),
      coalesce(r.schedule->>'objective',r.employee_goal,'تنفيذ المهمة المجدولة'),
      coalesce((r.schedule->>'priority')::integer,5),
      jsonb_build_object('scheduled',true,'routineId',r.id,'scheduledAt',r.next_run_at,'action',action_name,'routineInput',routine_input),
      'queued'
    )
    returning id into task_id;

    insert into job_queue(id,workspace_id,job_type,payload,status,attempts,max_attempts,available_at)
    values(
      gen_random_uuid(),
      r.workspace_id,
      'employee.step',
      jsonb_build_object(
        'taskId',task_id,
        'employeeId',r.employee_id,
        'step',jsonb_build_object(
          'id','scheduled',
          'intent','analyze',
          'action',action_name,
          'input',routine_input,
          'dependsOn',jsonb_build_array()
        ),
        'idempotencyKey',routine_key
      ),
      'queued',0,3,now()
    )
    on conflict (workspace_id,job_type,(payload->>'idempotencyKey')) where (payload ? 'idempotencyKey') do nothing;

    update employee_schedules
      set last_run_at=r.next_run_at,
          next_run_at=greatest(
            r.next_run_at+make_interval(mins=>mins),
            now()+make_interval(mins=>mins)
          ),
          updated_at=now()
      where id=r.id;

    created_count := created_count+1;
  end loop;
  return created_count;
end;
$$;

revoke all on function public.enjaz_process_due_schedules() from public;
grant execute on function public.enjaz_process_due_schedules() to service_role;

create index if not exists idx_employee_schedules_due
  on public.employee_schedules (enabled,next_run_at)
  where enabled=true and next_run_at is not null;
