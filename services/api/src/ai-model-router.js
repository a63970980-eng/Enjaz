import { withSpan } from './telemetry.js';

const ROUTES = Object.freeze({
  planning: [
    { provider: 'gemini', model: process.env.GEMINI_MODEL || 'gemini-2.5-flash' },
    { provider: 'openrouter', model: process.env.OPENROUTER_MODEL || 'openrouter/free' },
    { provider: 'openai', model: process.env.OPENAI_MODEL || 'gpt-5-mini' },
  ],
  reasoning: [
    { provider: 'gemini', model: process.env.GEMINI_REASONING_MODEL || process.env.GEMINI_MODEL || 'gemini-2.5-flash' },
    { provider: 'openai', model: process.env.OPENAI_REASONING_MODEL || process.env.OPENAI_MODEL || 'gpt-5-mini' },
    { provider: 'openrouter', model: process.env.OPENROUTER_REASONING_MODEL || process.env.OPENROUTER_MODEL || 'openrouter/free' },
  ],
  fast: [
    { provider: 'gemini', model: process.env.GEMINI_FAST_MODEL || process.env.GEMINI_MODEL || 'gemini-2.5-flash' },
    { provider: 'openrouter', model: process.env.OPENROUTER_FAST_MODEL || process.env.OPENROUTER_MODEL || 'openrouter/free' },
    { provider: 'openai', model: process.env.OPENAI_FAST_MODEL || process.env.OPENAI_MODEL || 'gpt-5-mini' },
  ],
});

const clean = (v) => typeof v === 'string' ? v.trim() : '';
const configured = (provider) => provider === 'gemini' ? Boolean(clean(process.env.GEMINI_API_KEY))
  : provider === 'openrouter' ? Boolean(clean(process.env.OPENROUTER_API_KEY))
  : provider === 'openai' ? Boolean(clean(process.env.OPENAI_API_KEY))
  : false;

export function resolveModelRoute({ purpose = 'reasoning', provider = 'auto', model } = {}) {
  const requested = clean(provider).toLowerCase();
  if (requested && requested !== 'auto') return [{ provider: requested, model: model || undefined }];
  const route = ROUTES[purpose] || ROUTES.reasoning;
  return route.filter((candidate) => configured(candidate.provider)).map((candidate) => ({ ...candidate }));
}

export async function generateWithRoute({ purpose = 'reasoning', provider = 'auto', model, messages, generate }) {
  if (!Array.isArray(messages) || !messages.length) throw new Error('messages are required');
  const route = resolveModelRoute({ purpose, provider, model });
  if (!route.length) throw new Error('No configured AI provider is available');
  const failures = [];
  for (const candidate of route) {
    try {
      return await withSpan('enjaz.ai.route', {
        'ai.purpose': purpose,
        'ai.provider': candidate.provider,
        'ai.model': candidate.model || 'default',
      }, () => generate(candidate));
    } catch (error) {
      failures.push(candidate.provider + ': ' + (error?.message || String(error)));
    }
  }
  throw new Error('AI route exhausted. ' + failures.join(' | '));
}

export function getModelRoutingStatus() {
  return Object.fromEntries(Object.entries(ROUTES).map(([purpose, route]) => [
    purpose,
    route.map(({ provider, model }) => ({ provider, model, configured: configured(provider) })),
  ]));
}
