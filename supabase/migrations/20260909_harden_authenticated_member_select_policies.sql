-- Keep workspace-scoped member reads behind the authenticated role.
-- The existing predicates continue to enforce workspace membership; this removes
-- unnecessary PUBLIC policy exposure for sensitive tenant data.
alter policy "billing_customers_member_select" on public.billing_customers to authenticated;
alter policy "billing_usage_member_select" on public.billing_usage to authenticated;
alter policy "billing_subscriptions_member_select" on public.billing_subscriptions to authenticated;
alter policy "employee_goals_member_select" on public.employee_goals to authenticated;
alter policy "employee_knowledge_member_select" on public.employee_knowledge to authenticated;
