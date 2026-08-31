begin;

-- A graph may only reference resources from the same tenant/workspace.
create or replace function private.validate_execution_graph_workspace()
returns trigger language plpgsql security definer set search_path = public, private as $$
declare task_workspace uuid; employee_workspace uuid;
begin
 select workspace_id into task_workspace from public.tasks where id=new.task_id;
 select workspace_id into employee_workspace from public.ai_employees where id=new.employee_id;
 if task_workspace is null or employee_workspace is null or task_workspace<>new.workspace_id or employee_workspace<>new.workspace_id then
  raise exception 'Execution graph resources must belong to the same workspace';
 end if;
 return new;
end $$;
drop trigger if exists trg_execution_graph_workspace on public.execution_graphs;
create trigger trg_execution_graph_workspace before insert or update on public.execution_graphs for each row execute function private.validate_execution_graph_workspace();

-- Step dependencies are keys within the same graph and must not self-reference.
create or replace function private.validate_execution_step_dependencies()
returns trigger language plpgsql security definer set search_path = public, private as $$
begin
 if new.step_key = any(new.depends_on) then raise exception 'Execution step cannot depend on itself'; end if;
 if exists(select 1 from unnest(new.depends_on) d where d is null or d='') then raise exception 'Execution step contains an invalid dependency'; end if;
 if exists(select 1 from unnest(new.depends_on) d where not exists(select 1 from public.execution_steps s where s.graph_id=new.graph_id and s.step_key=d)) then raise exception 'Execution step dependency must exist in the same graph'; end if;
 return new;
end $$;
drop trigger if exists trg_execution_step_dependencies on public.execution_steps;
create constraint trigger trg_execution_step_dependencies after insert or update on public.execution_steps deferrable initially deferred for each row execute function private.validate_execution_step_dependencies();

commit;
