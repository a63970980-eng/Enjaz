create or replace function public.ensure_workspace_subscription() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.workspace_subscriptions(workspace_id,plan_id,status)
  values(new.id,'starter','active')
  on conflict(workspace_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_workspace_subscription on public.workspaces;
create trigger trg_workspace_subscription after insert on public.workspaces for each row execute function public.ensure_workspace_subscription();
