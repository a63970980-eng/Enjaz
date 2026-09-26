-- Production performance/security follow-up for commerce RLS.
-- Keep auth.uid() init-plan stable by evaluating it once per statement.
alter policy "ai_employee_memory_embeddings_member_select" on public.ai_employee_memory_embeddings
  using ((exists (select 1 from workspace_members wm where wm.workspace_id = ai_employee_memory_embeddings.workspace_id and wm.user_id = (select auth.uid()))));

alter policy "commerce_stores_member" on public.commerce_stores
  using ((exists (select 1 from workspace_members wm where wm.workspace_id = commerce_stores.workspace_id and wm.user_id = (select auth.uid()))))
  with check ((exists (select 1 from workspace_members wm where wm.workspace_id = commerce_stores.workspace_id and wm.user_id = (select auth.uid()))));

alter policy "commerce_products_member" on public.commerce_products
  using ((exists (select 1 from workspace_members wm where wm.workspace_id = commerce_products.workspace_id and wm.user_id = (select auth.uid()))))
  with check ((exists (select 1 from workspace_members wm where wm.workspace_id = commerce_products.workspace_id and wm.user_id = (select auth.uid()))));

alter policy "commerce_orders_member" on public.commerce_orders
  using ((exists (select 1 from workspace_members wm where wm.workspace_id = commerce_orders.workspace_id and wm.user_id = (select auth.uid()))))
  with check ((exists (select 1 from workspace_members wm where wm.workspace_id = commerce_orders.workspace_id and wm.user_id = (select auth.uid()))));

alter policy "commerce_order_items_member" on public.commerce_order_items
  using ((exists (select 1 from workspace_members wm where wm.workspace_id = commerce_order_items.workspace_id and wm.user_id = (select auth.uid()))))
  with check ((exists (select 1 from workspace_members wm where wm.workspace_id = commerce_order_items.workspace_id and wm.user_id = (select auth.uid()))));

alter policy "commerce_customers_member" on public.commerce_customers
  using ((exists (select 1 from workspace_members wm where wm.workspace_id = commerce_customers.workspace_id and wm.user_id = (select auth.uid()))))
  with check ((exists (select 1 from workspace_members wm where wm.workspace_id = commerce_customers.workspace_id and wm.user_id = (select auth.uid()))));

alter policy "commerce_events_member" on public.commerce_events
  using ((exists (select 1 from workspace_members wm where wm.workspace_id = commerce_events.workspace_id and wm.user_id = (select auth.uid()))))
  with check ((exists (select 1 from workspace_members wm where wm.workspace_id = commerce_events.workspace_id and wm.user_id = (select auth.uid()))));

-- This bootstrap RPC is used server-side during onboarding; anonymous callers do not need EXECUTE.
revoke execute on function public.assign_first_platform_admin(uuid) from anon;
