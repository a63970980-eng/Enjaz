create or replace function public.guard_identity_and_membership_changes()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  actor_role text;
  actor_auth_id uuid := auth.uid();
begin
  if actor_auth_id is null then
    return new;
  end if;

  if tg_table_name = 'users' then
    if new.auth_user_id is distinct from old.auth_user_id
       or new.organization_id is distinct from old.organization_id
       or new.role is distinct from old.role
       or new.platform_role is distinct from old.platform_role then
      raise exception 'Protected identity fields cannot be changed by the authenticated client';
    end if;
    return new;
  end if;

  if tg_table_name = 'workspace_members' then
    if new.workspace_id is distinct from old.workspace_id
       or new.user_id is distinct from old.user_id then
      raise exception 'Workspace membership identity cannot be reassigned by the authenticated client';
    end if;

    select wm.role
      into actor_role
      from public.workspace_members wm
      join public.users u on u.id = wm.user_id
     where wm.workspace_id = old.workspace_id
       and u.auth_user_id = actor_auth_id
     limit 1;

    if actor_role is null then
      raise exception 'Workspace membership actor not found';
    end if;

    if new.role is distinct from old.role then
      if new.role = 'owner' and actor_role <> 'owner' then
        raise exception 'Only an owner can grant owner membership';
      end if;
      if new.role = 'admin' and actor_role not in ('owner','admin') then
        raise exception 'Only an owner or admin can grant admin membership';
      end if;
    end if;

    return new;
  end if;

  return new;
end;
$$;

revoke all on function public.guard_identity_and_membership_changes() from public;
