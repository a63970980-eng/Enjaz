import { describe, expect, it, beforeEach } from 'vitest';
import { getAIProviderStatus } from '../src/ai-provider.js';

describe('AI provider router', () => {
  beforeEach(() => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.AI_PROVIDER;
  });

  it('reports provider configuration without exposing secrets', () => {
    process.env.GEMINI_API_KEY = 'secret-gemini';
    process.env.OPENROUTER_API_KEY = 'secret-router';
    const status = getAIProviderStatus();
    expect(status).toEqual({ mode: 'auto', gemini: true, openrouter: true, openai: false });
    expect(JSON.stringify(status)).not.toContain('secret-');
  });
});
