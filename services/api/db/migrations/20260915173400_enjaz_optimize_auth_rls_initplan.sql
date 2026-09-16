do $$
declare
  p record;
  using_expr text;
  check_expr text;
begin
  for p in
    select schemaname, tablename, policyname, qual, with_check
      from pg_policies
     where schemaname = 'public'
       and (coalesce(qual,'') like '%auth.uid()%' or coalesce(with_check,'') like '%auth.uid()%')
  loop
    using_expr := case when p.qual is null then null else replace(p.qual, 'auth.uid()', '(select auth.uid())') end;
    check_expr := case when p.with_check is null then null else replace(p.with_check, 'auth.uid()', '(select auth.uid())') end;
    if using_expr is not null then
      execute format('alter policy %I on %I using (%s)', p.policyname, p.tablename, using_expr);
    end if;
    if check_expr is not null then
      execute format('alter policy %I on %I with check (%s)', p.policyname, p.tablename, check_expr);
    end if;
  end loop;
end;
$$;
