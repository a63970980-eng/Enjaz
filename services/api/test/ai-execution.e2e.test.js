import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { createEmployee, createTask, getTask, decideApproval, listApprovals, listAudit } from '../src/workforce-repository.js';
import { planEmployeeTask } from '../src/brain-orchestrator.js';
import { registerModelProvider } from '../src/model-provider.js';
import { processOneJob, recoverQueue } from '../src/queue-worker.js';
import { runEmployeeTask } from '../src/agent-runtime.js';
import { query } from '../src/db.js';

/**
 * End-to-end proof of the AI employee execution path on a real database:
 * plan (model provider) -> execution graph -> queued steps -> worker -> tool -> task result,
 * plus the human approval gate for a high-risk tool.
 *
 * The planner is a deterministic stub registered through the production provider
 * registry, so no external model account is required. Everything else is the
 * shipping code path.
 */

const url = process.env.DATABASE_URL;
const ASYNC_TESTS = { skip: !url };

async function seedTenant(admin) {
  const ids = { org: crypto.randomUUID(), workspace: crypto.randomUUID(), user: crypto.randomUUID() };
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await admin.query('insert into organizations(id,name,slug) values($1,$2,$3)', [ids.org, 'Execution Org', `exec-${suffix}`]);
  await admin.query('insert into workspaces(id,organization_id,name,slug) values($1,$2,$3,$4)', [ids.workspace, ids.org, 'Execution WS', `exec-${suffix}`]);
  await admin.query('insert into users(id,organization_id,email,name,auth_user_id) values($1,$2,$3,$4,$1)', [ids.user, ids.org, `exec-${suffix}@e2e.test`, 'Execution Manager']);
  await admin.query('insert into workspace_members(workspace_id,user_id,role) values($1,$2,$3)', [ids.workspace, ids.user, 'manager']);
  return ids;
}

registerModelProvider('test-planner', {
  generate: async (context) => ({
    goal: context.goal,
    version: 1,
    steps: [
      { id: 'step-1', intent: 'analyze', action: 'data.analyze', input: { focus: 'revenue' }, approval_required: false, depends_on: [] },
      { id: 'step-2', intent: 'create_report', action: 'report.create', input: { title: 'Revenue summary' }, approval_required: false, depends_on: ['step-1'] },
    ],
    usage: { prompt_tokens: 450, completion_tokens: 120, total_tokens: 570 },
  }),
});

async function drain(workspaceId, limit = 12) {
  const processed = [];
  for (let i = 0; i < limit; i += 1) {
    const result = await processOneJob({ workspaceId, workerId: `e2e-${i}` });
    if (!result) break;
    processed.push(result);
  }
  return processed;
}

test('a planned employee task runs through the graph, queue and tools to a stored result', ASYNC_TESTS, async () => {
  const admin = new pg.Client({ connectionString: url, ssl: false });
  await admin.connect();
  let ids;
  try {
    ids = await seedTenant(admin);
    const employee = await createEmployee({
      workspaceId: ids.workspace, name: 'Execution Analyst', role: 'analyst',
      goal: 'Produce revenue analysis', tools: ['data.analyze', 'report.create'], budgetCents: 5000,
      policy: { approvalMode: 'none' },
    });
    const task = await createTask({
      workspaceId: ids.workspace, employeeId: employee.id,
      title: 'Revenue review', objective: 'Analyse revenue and write a summary', priority: 4,
    });

    const planned = await planEmployeeTask({
      employee, workspaceId: ids.workspace, employeeId: employee.id, taskId: task.id,
      goal: 'Analyse revenue and write a summary', provider: 'test-planner',
    });

    assert.equal(planned.provider, 'test-planner');
    assert.deepEqual(planned.plan.steps.map((step) => step.id), ['step-1', 'step-2']);
    assert.equal(planned.execution.readyStepKeys.length, 1, 'only the dependency-free step is queued first');
    assert.deepEqual(planned.usage, { model: null, inputTokens: 450, outputTokens: 120, totalTokens: 570, costCents: 0 });

    const processed = await drain(ids.workspace);
    assert.ok(processed.length >= 2, `expected at least two processed steps, got ${processed.length}`);
    assert.ok(processed.every((item) => item.status === 'succeeded'), JSON.stringify(processed));

    const stored = await getTask(task.id, ids.workspace);
    assert.equal(stored.status, 'completed');
    assert.equal(stored.output?.type, 'report', 'the report step result is persisted on the task');

    const graph = (await query('select status from execution_graphs where task_id=$1 and workspace_id=$2', [task.id, ids.workspace])).rows[0];
    assert.equal(graph.status, 'succeeded');
    const steps = (await query('select step_key,status,output from execution_steps where graph_id=(select id from execution_graphs where task_id=$1 and workspace_id=$2) order by step_key', [task.id, ids.workspace])).rows;
    assert.deepEqual(steps.map((step) => [step.step_key, step.status]), [['step-1', 'succeeded'], ['step-2', 'succeeded']]);
    assert.equal(steps[1].output?.title, 'Revenue summary');

    const auditEvents = (await listAudit(ids.workspace)).map((event) => event.event_type);
    assert.ok(auditEvents.includes('task.execution_started'));
    assert.ok(auditEvents.includes('task.completed'));

    const plannedMetric = (await query("select input_tokens,output_tokens from runtime_metrics where workspace_id=$1 and task_id=$2 and status='planned'", [ids.workspace, task.id])).rows[0];
    assert.equal(Number(plannedMetric.input_tokens), 450, 'planning tokens are measured and stored');
    assert.equal(Number(plannedMetric.output_tokens), 120);

    const metrics = (await query('select status,provider,cost_cents from runtime_metrics where workspace_id=$1 and task_id=$2', [ids.workspace, task.id])).rows;
    assert.ok(metrics.some((metric) => metric.status === 'succeeded'));
    assert.ok(metrics.some((metric) => Number(metric.cost_cents) > 0), 'tool execution cost is recorded');

    const usage = (await query('select count(*)::int as count,cost_cents from ai_employee_usage where workspace_id=$1 and task_id=$2 group by cost_cents', [ids.workspace, task.id])).rows;
    assert.ok(usage.length >= 1, 'budget usage is recorded for chargeable actions');
  } finally {
    if (ids) await admin.query('delete from organizations where id=$1', [ids.org]).catch(() => {});
    await admin.end();
  }
});

test('a high-risk tool stops at a human approval gate and only runs once approved', ASYNC_TESTS, async () => {
  const admin = new pg.Client({ connectionString: url, ssl: false });
  await admin.connect();
  let ids;
  try {
    ids = await seedTenant(admin);
    const employee = await createEmployee({
      workspaceId: ids.workspace, name: 'Approval Analyst', role: 'analyst',
      goal: 'Escalate sensitive work', tools: ['approval.request'], budgetCents: 5000,
      policy: { approvalMode: 'required' },
    });
    const task = await createTask({
      workspaceId: ids.workspace, employeeId: employee.id,
      title: 'Sensitive follow-up', objective: 'Prepare a sensitive action for review', priority: 5,
    });

    const gated = await runEmployeeTask({
      workspaceId: ids.workspace, taskId: task.id, employeeId: employee.id,
      action: 'approval.request', input: { action: 'refund', reason: 'Refund above threshold' },
    });
    assert.equal(gated.status, 'awaiting_approval');
    assert.equal((await getTask(task.id, ids.workspace)).status, 'awaiting_approval');

    const pending = await listApprovals(ids.workspace);
    assert.equal(pending.length, 1);
    assert.equal(pending[0].action, 'approval.request');

    await decideApproval(pending[0].id, ids.workspace, 'approved', ids.user);
    const processed = await drain(ids.workspace);
    assert.ok(processed.some((item) => item.status === 'succeeded'), JSON.stringify(processed));

    const stored = await getTask(task.id, ids.workspace);
    assert.equal(stored.status, 'completed');
    const approval = (await query('select status from approvals where id=$1', [pending[0].id])).rows[0];
    assert.equal(approval.status, 'executed');
    const auditEvents = (await listAudit(ids.workspace)).map((event) => event.event_type);
    assert.ok(auditEvents.includes('approval.executed'));
    await recoverQueue(ids.workspace);
  } finally {
    if (ids) await admin.query('delete from organizations where id=$1', [ids.org]).catch(() => {});
    await admin.end();
  }
});
