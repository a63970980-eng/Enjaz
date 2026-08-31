begin;

-- CI uses a plain PostgreSQL service while production Supabase supplies these roles.
-- Keep the migration portable: only create roles when this migration is run by a
-- sufficiently privileged local/test database. Supabase already has both roles.
do $$
begin
  if not exists (select 1 from pg_roles where rolname='anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname='authenticated') then
    create role authenticated nologin;
  end if;
end
$$;

commit;
