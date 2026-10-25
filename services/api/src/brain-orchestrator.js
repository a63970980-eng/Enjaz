import { buildBrainContext, createDeterministicPlan, validatePlan } from './ai-brain.js';
import { recall, remember } from './employee-memory.js';
import { generatePlan } from './model-provider.js';
import './openai-model-provider.js';
import { materializePlan } from './execution-graph.js';
import { listEmployeeGoals, listEmployeeKnowledge } from './workforce-repository.js';
import { assertModelTokenBudget, estimateModelCostCents, readTokenUsage } from './model-usage.js';
import { randomUUID } from 'node:crypto';
import { query } from './db.js';

/** Records planning usage beside latency and cost so spend is observable per task. */
async function recordPlanningUsage({ workspaceId, employeeId, taskId, provider, model, tokens, costCents }) {
  await query(
    'insert into runtime_metrics (id,workspace_id,employee_id,task_id,provider,status,latency_ms,cost_cents,input_tokens,output_tokens) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
    [randomUUID(), workspaceId, employeeId, taskId, provider || 'deterministic', 'planned', null, costCents, tokens.inputTokens, tokens.outputTokens],
  );
  return { model: model || null, ...tokens, costCents };
}

export function toPlanMemoryInput({ workspaceId, employeeId, taskId, plan }) {
  return {
    workspaceId,
    employeeId,
    type: 'summary',
    key: `task-plan:${taskId}`,
    content: JSON.stringify(plan),
    importance: 3,
    sourceTaskId: taskId,
  };
}

function normalizeExecutionPlan(plan) {
  return {
    ...plan,
    steps: plan.steps.map((step, index) => ({
      ...step,
      id: step.id || `step-${index + 1}`,
      dependsOn: Array.isArray(step.dependsOn) ? step.dependsOn : (Array.isArray(step.depends_on) ? step.depends_on : []),
    })),
  };
}

export async function planEmployeeTask({ employee, workspaceId, employeeId, taskId, goal, provider = process.env.ENJAZ_MODEL_PROVIDER || process.env.AI_PROVIDER || 'auto' }) {
  const [memory, goals, knowledge, integrations] = await Promise.all([
    recall({ workspaceId, employeeId, limit: 20 }),
    listEmployeeGoals(workspaceId, employeeId),
    listEmployeeKnowledge(workspaceId, employeeId),
    query("select provider,status,name as display_name from integration_connections where workspace_id=$1 and status='active' order by provider", [workspaceId]).then((r) => r.rows),
  ]);
  const context = buildBrainContext({ employee, goal, memory, workspaceId, taskId, employeeId, integrations });
  context.employee.objectives = goals.slice(0, 20).map(({ title, target, current_value, unit, period, status }) => ({ title, target, currentValue: current_value, unit, period, status }));
  context.employee.knowledge = knowledge.slice(0, 20).map(({ title, content, source, metadata }) => ({ title, content, source, metadata }));

  let effectiveProvider = provider;
  let plan;
  try {
    plan = await generatePlan({ provider, context });
  } catch (error) {
    if (provider !== 'auto') throw error;
    plan = createDeterministicPlan({ employee, goal });
    effectiveProvider = 'deterministic';
  }

  if (!plan?.steps?.length) {
    if (provider !== 'deterministic' && provider !== 'auto') throw new Error(`AI provider ${provider} returned an empty plan`);
    plan = createDeterministicPlan({ employee, goal });
    effectiveProvider = 'deterministic';
  }

  // Model spend is bounded per task before any execution is materialised.
  const usage = readTokenUsage(plan?.usage);
  assertModelTokenBudget({ usage, employee });
  plan = normalizeExecutionPlan(validatePlan(plan, employee));
  const { costCents } = estimateModelCostCents(usage);
  const recordedUsage = await recordPlanningUsage({ workspaceId, employeeId, taskId, provider: plan?.provider || effectiveProvider, model: plan?.model, tokens: usage, costCents });
  const execution = await materializePlan({ workspaceId, employeeId, taskId, plan });
  await remember(toPlanMemoryInput({ workspaceId, employeeId, taskId, plan }));
  return { plan, memoryUsed: memory.length, knowledgeUsed: knowledge.length, objectivesUsed: goals.length, provider: effectiveProvider, usage: recordedUsage, execution };
}
