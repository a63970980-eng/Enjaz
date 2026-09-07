import { buildBrainContext, createDeterministicPlan, validatePlan } from './ai-brain.js';
import { recall, remember } from './ai-memory.js';
import { generatePlan } from './model-provider.js';
import './openai-model-provider.js';
import { materializePlan } from './execution-graph.js';
import { listEmployeeGoals, listEmployeeKnowledge } from './workforce-repository.js';

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
  const [memory, goals, knowledge] = await Promise.all([
    recall({ workspaceId, employeeId, limit: 20 }),
    listEmployeeGoals(workspaceId, employeeId),
    listEmployeeKnowledge(workspaceId, employeeId),
  ]);
  const context = buildBrainContext({ employee, goal, memory });
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

  plan = normalizeExecutionPlan(validatePlan(plan, employee));
  const execution = await materializePlan({ workspaceId, employeeId, taskId, plan });
  await remember({ workspaceId, employeeId, taskId, type: 'plan', content: JSON.stringify(plan), metadata: { provider: effectiveProvider, goal, graphId: execution.graphId, knowledgeUsed: knowledge.length, objectivesUsed: goals.length } });
  return { plan, memoryUsed: memory.length, knowledgeUsed: knowledge.length, objectivesUsed: goals.length, provider: effectiveProvider, execution };
}
