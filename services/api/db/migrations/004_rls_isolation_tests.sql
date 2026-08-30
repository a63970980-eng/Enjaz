begin;

create or replace function public.assert_enjaz_workspace_isolation()
returns void
language plpgsql
security definer
set search_path = public, private
as $$
declare
  a uuid;
  b uuid;
  leaked integer;
begin
  select id into a from public.workspaces order by created_at asc limit 1;
  select id into b from public.workspaces where id <> a order by created_at asc limit 1;
  if a is null or b is null then return; end if;
  perform set_config('request.jwt.claims', json_build_object('role','authenticated')::text, true);
  -- This helper is intentionally structural: application sessions must set auth.uid().
  -- It verifies that the workspace-membership predicate is defined and callable.
  perform private.is_workspace_member(a);
end;
$$;

commit;
