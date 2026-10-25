-- `20260917_ai_memory_vectors.sql` enables RLS on ai_employee_memory_embeddings
-- but never defines a policy, so the table was unreachable for authenticated
-- clients and the tenant sweep had one exception. Dated after the table
-- migration so it also applies on a fresh install.
begin;

do $$
begin
  if to_regclass('public.ai_employee_memory_embeddings') is not null then
    drop policy if exists ai_memory_embeddings_member_select on public.ai_employee_memory_embeddings;
    create policy ai_memory_embeddings_member_select on public.ai_employee_memory_embeddings
      for select to authenticated
      using (private.is_workspace_member(workspace_id));
  end if;
end $$;

commit;
