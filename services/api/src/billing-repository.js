import { query } from './db.js';

export async function listBillingPlans() {
  return (await query('select * from billing_plans where active=true order by monthly_price_cents asc')).rows;
}

export async function getBillingSubscription(workspaceId) {
  const r = await query(`select s.*,p.name as plan_name,p.description as plan_description,p.monthly_price_cents,p.max_employees,p.max_tasks_month,p.max_integrations,p.included_ai_cost_cents,p.features from workspace_subscriptions s join billing_plans p on p.id=s.plan_id where s.workspace_id=$1`, [workspaceId]);
  return r.rows[0] || null;
}

export async function getBillingUsage(workspaceId) {
  const subscription = await getBillingSubscription(workspaceId);
  if (!subscription) return null;
  const employees = (await query("select count(*)::int as count from ai_employees where workspace_id=$1 and status not in ('deleted')", [workspaceId])).rows[0]?.count || 0;
  const tasks = (await query("select count(*)::int as count from tasks where workspace_id=$1 and created_at >= date_trunc('month', now())", [workspaceId])).rows[0]?.count || 0;
  const integrations = (await query("select count(*)::int as count from integration_connections where workspace_id=$1 and status='active'", [workspaceId])).rows[0]?.count || 0;
  const aiCost = (await query("select coalesce(sum(cost_cents),0)::bigint as cents from runtime_metrics where workspace_id=$1 and created_at >= date_trunc('month', now())", [workspaceId])).rows[0]?.cents || 0;
  return { plan: subscription.plan_id, status: subscription.status, periodStart: subscription.current_period_start, periodEnd: subscription.current_period_end, employees: Number(employees), tasksThisMonth: Number(tasks), integrations: Number(integrations), aiCostCents: Number(aiCost), limits: { employees: subscription.max_employees, tasksMonth: subscription.max_tasks_month, integrations: subscription.max_integrations, includedAiCostCents: subscription.included_ai_cost_cents } };
}

export async function assertWorkspaceLimit(workspaceId, resource) {
  const usage = await getBillingUsage(workspaceId);
  if (!usage) throw new Error('Workspace subscription is not configured');
  const checks = { employees: [usage.employees, usage.limits.employees], tasks: [usage.tasksThisMonth, usage.limits.tasksMonth], integrations: [usage.integrations, usage.limits.integrations] };
  const check = checks[resource];
  if (check && check[0] >= check[1]) throw Object.assign(new Error(`${resource} limit reached for ${usage.plan} plan`), { status: 402, code: 'PLAN_LIMIT_REACHED', usage });
  return usage;
}
