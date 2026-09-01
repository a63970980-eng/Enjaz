begin;

-- CI/test databases run the same RLS policies as production-facing sessions.
-- Keep the roles minimally privileged: policies decide which tenant rows are visible.
do $$
begin
  if exists (select 1 from pg_roles where rolname='authenticated') then
    grant usage on schema public to authenticated;
    grant select, insert, update, delete on all tables in schema public to authenticated;
    alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
  end if;
  if exists (select 1 from pg_roles where rolname='anon') then
    grant usage on schema public to anon;
  end if;
end $$;

commit;
