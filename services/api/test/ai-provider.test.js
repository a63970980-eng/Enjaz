import test from 'node:test';
import assert from 'node:assert/strict';
import { getAIProviderStatus } from '../src/ai-provider.js';

test('AI provider status reports configuration without exposing secrets', () => {
  const previous = {
    gemini: process.env.GEMINI_API_KEY,
    openrouter: process.env.OPENROUTER_API_KEY,
    provider: process.env.AI_PROVIDER,
  };
  try {
    process.env.GEMINI_API_KEY = 'secret-gemini';
    process.env.OPENROUTER_API_KEY = 'secret-router';
    delete process.env.AI_PROVIDER;
    const status = getAIProviderStatus();
    assert.deepEqual(status, { mode: 'auto', gemini: true, openrouter: true, openai: false });
    assert.equal(JSON.stringify(status).includes('secret-'), false);
  } finally {
    if (previous.gemini === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = previous.gemini;
    if (previous.openrouter === undefined) delete process.env.OPENROUTER_API_KEY; else process.env.OPENROUTER_API_KEY = previous.openrouter;
    if (previous.provider === undefined) delete process.env.AI_PROVIDER; else process.env.AI_PROVIDER = previous.provider;
  }
});
