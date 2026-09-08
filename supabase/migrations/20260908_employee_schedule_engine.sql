create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

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
begin
  for r in
    select s.*, e.name employee_name, e.goal employee_goal
    from employee_schedules s
    join ai_employees e on e.id=s.employee_id and e.workspace_id=s.workspace_id
    where s.enabled=true
      and s.next_run_at is not null
      and s.next_run_at<=now()
      and e.status='active'
    for update of s skip locked
  loop
    mins := greatest(1, coalesce((r.schedule->>'intervalMinutes')::integer, 1440));
    insert into tasks(workspace_id,employee_id,title,objective,priority,input,status)
    values(
      r.workspace_id,
      r.employee_id,
      coalesce(r.schedule->>'title','Scheduled task — '||r.employee_name),
      coalesce(r.schedule->>'objective',r.employee_goal,'تنفيذ المهمة المجدولة'),
      coalesce((r.schedule->>'priority')::integer,5),
      jsonb_build_object('scheduled',true,'scheduleId',r.id,'scheduledAt',r.next_run_at),
      'queued'
    );
    update employee_schedules
      set last_run_at=r.next_run_at,
          next_run_at=greatest(r.next_run_at+make_interval(mins=>mins),now()+make_interval(mins=>mins)),
          updated_at=now()
      where id=r.id;
    created_count := created_count+1;
  end loop;
  return created_count;
end;
$$;

revoke all on function public.enjaz_process_due_schedules() from public;
grant execute on function public.enjaz_process_due_schedules() to service_role;

do $$
begin
  if not exists (select 1 from cron.job where jobname='enjaz-due-schedules') then
    perform cron.schedule('enjaz-due-schedules','* * * * *',$cmd$select public.enjaz_process_due_schedules();$cmd$);
  end if;
end $$;
