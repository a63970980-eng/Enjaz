import { generateAI } from './ai-provider.js';

const providers = new Map();

export function registerModelProvider(name, provider) {
  if (!name || typeof provider?.generate !== 'function') throw new Error('Invalid model provider');
  providers.set(name, provider);
}

export function getModelProvider(name = 'deterministic') {
  return providers.get(name) || null;
}

function parsePlan(text) {
  const raw = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  try {
    const plan = JSON.parse(raw);
    if (!plan || typeof plan !== 'object') throw new Error('plan must be an object');
    return plan;
  } catch {
    throw new Error('AI provider returned an invalid JSON plan');
  }
}

async function generateAIPlan(context) {
  const response = await generateAI({
    provider: process.env.AI_PROVIDER || 'auto',
    model: process.env.AI_MODEL || undefined,
    messages: [
      { role: 'system', content: context.system },
      {
        role: 'user',
        content: JSON.stringify({
          employee: context.employee,
          goal: context.goal,
          memory: context.memory,
          availableTools: context.availableTools,
          instructions: 'Return JSON only: {goal:string,steps:[{id,intent,action,input,approval_required,depends_on}]}. Use only availableTools. Keep 1-12 steps.',
        }),
      },
    ],
  });
  const plan = parsePlan(response.text);
  return { ...plan, provider: response.provider, model: response.model };
}

registerModelProvider('deterministic', {
  generate: async (context) => ({ goal: context.goal, steps: [] }),
});

registerModelProvider('auto', { generate: generateAIPlan });
registerModelProvider('gemini', { generate: (context) => generateAIPlanWithProvider(context, 'gemini') });
registerModelProvider('openrouter', { generate: (context) => generateAIPlanWithProvider(context, 'openrouter') });

async function generateAIPlanWithProvider(context, provider) {
  const response = await generateAI({
    provider,
    model: provider === 'gemini' ? process.env.GEMINI_MODEL : process.env.OPENROUTER_MODEL,
    messages: [
      { role: 'system', content: context.system },
      { role: 'user', content: JSON.stringify({ employee: context.employee, goal: context.goal, memory: context.memory, availableTools: context.availableTools, instructions: 'Return JSON only with goal and 1-12 executable steps using only availableTools.' }) },
    ],
  });
  return { ...parsePlan(response.text), provider: response.provider, model: response.model };
}

export async function generatePlan({ provider = process.env.AI_PROVIDER || 'auto', context }) {
  const p = getModelProvider(provider);
  if (!p) throw new Error(`AI provider not configured: ${provider}`);
  return p.generate(context);
}
