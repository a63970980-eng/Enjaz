import { generateAI } from './ai-provider.js';
import { validatePlan } from './employee-planner.js';
import { AgentTaskSchema, parseContract } from './contracts.js';

const providers = new Map();
const INTENT_BY_ACTION = new Map([
  ['data.analyze', 'analyze'],
  ['report.create', 'create_report'],
  ['task.comment', 'notify'],
  ['task.handoff', 'notify'],
]);

export function registerModelProvider(name, provider) {
  if (!name || typeof provider?.generate !== 'function') throw new Error('Invalid model provider');
  providers.set(name, provider);
}

export function getModelProvider(name = 'deterministic') { return providers.get(name) || null; }

function parsePlan(text) {
  const raw = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  try {
    const plan = JSON.parse(raw);
    if (!plan || typeof plan !== 'object') throw new Error('plan must be an object');
    return plan;
  } catch { throw new Error('AI provider returned an invalid JSON plan'); }
}

function normalizePlan(plan, context) {
  const steps = Array.isArray(plan.steps) ? plan.steps.map((step, index) => {
    const action = typeof step?.action === 'string' ? step.action.trim() : '';
    const intent = typeof step?.intent === 'string' && step.intent.trim()
      ? step.intent.trim()
      : INTENT_BY_ACTION.get(action) || 'analyze';
    return {
      id: String(step?.id || `step_${index + 1}`).trim(),
      intent,
      action,
      input: step?.input && typeof step.input === 'object' && !Array.isArray(step.input) ? step.input : {},
      dependsOn: Array.isArray(step?.dependsOn) ? step.dependsOn : (Array.isArray(step?.depends_on) ? step.depends_on : []),
      requiresApproval: Boolean(step?.requiresApproval ?? step?.approval_required),
    };
  }) : [];
  const normalized = { goal: String(plan.goal || context.goal || '').trim(), version: 1, steps };
  validatePlan(normalized, { availableTools: context.availableTools });
  return normalized;
}

async function generateAIPlan(context, provider = process.env.AI_PROVIDER || 'auto') {
  const response = await generateAI({
    provider,
    model: provider === 'gemini' ? process.env.GEMINI_MODEL : provider === 'openrouter' ? process.env.OPENROUTER_MODEL : provider === 'openai' ? process.env.OPENAI_MODEL : undefined,
    messages: [
      { role: 'system', content: context.system },
      { role: 'user', content: JSON.stringify({ employee: context.employee, goal: context.goal, memory: context.memory, availableTools: context.availableTools, instructions: 'Return JSON only: {goal:string,steps:[{id,intent,action,input,approval_required,depends_on}]}. Use only tools assigned to the employee. Use intents analyze, create_report, notify, lookup, or request_approval. Keep 1-12 steps. Dependencies must reference earlier step ids exactly.' }) },
    ],
  });
  const plan = normalizePlan(parsePlan(response.text), context);
  return { ...plan, provider: response.provider, model: response.model };
}

registerModelProvider('deterministic', { generate: async (context) => ({ goal: context.goal, version: 1, steps: [] }) });
registerModelProvider('auto', { generate: (context) => generateAIPlan(context, 'auto') });
registerModelProvider('gemini', { generate: (context) => generateAIPlan(context, 'gemini') });
registerModelProvider('openrouter', { generate: (context) => generateAIPlan(context, 'openrouter') });
registerModelProvider('openai', { generate: (context) => generateAIPlan(context, 'openai') });

export async function generatePlan({ provider = process.env.AI_PROVIDER || 'auto', context }) {
  const p = getModelProvider(provider);
  if (!p) throw new Error(`AI provider not configured: ${provider}`);
  if (provider !== 'deterministic') parseContract(AgentTaskSchema, {
    workspaceId: context.workspaceId || 'planning-workspace', taskId: context.taskId || 'planning-task', employeeId: context.employeeId || 'planning-employee', goal: context.goal,
  }, 'agent task');
  return p.generate(context);
}
