import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveModelRoute, generateWithRoute } from '../src/ai-model-router.js';

const KEY_NAMES = ['GEMINI_API_KEY', 'OPENROUTER_API_KEY', 'OPENAI_API_KEY'];

async function withProviderKeys(values, callback) {
  const previous = Object.fromEntries(KEY_NAMES.map((key) => [key, process.env[key]]));
  try {
    for (const key of KEY_NAMES) {
      if (values[key]) process.env[key] = values[key];
      else delete process.env[key];
    }
    return await callback();
  } finally {
    for (const key of KEY_NAMES) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
}

test('automatic routing excludes providers without configured credentials', async () => {
  await withProviderKeys({ GEMINI_API_KEY: 'test-gemini', OPENAI_API_KEY: 'test-openai' }, () => {
    assert.deepEqual(
      resolveModelRoute({ purpose: 'reasoning', provider: 'auto' }).map(({ provider }) => provider),
      ['gemini', 'openai'],
    );
  });
});

test('explicit provider and model override automatic provider selection', async () => {
  await withProviderKeys({}, () => {
    assert.deepEqual(
      resolveModelRoute({ provider: 'openai', model: 'custom-model' }),
      [{ provider: 'openai', model: 'custom-model' }],
    );
  });
});

test('automatic routing fails clearly when no provider is configured', async () => {
  await withProviderKeys({}, async () => {
    await assert.rejects(
      generateWithRoute({ provider: 'auto', messages: [{ role: 'user', content: 'test' }], generate: async () => ({}) }),
      /No configured AI provider is available/,
    );
  });
});

test('automatic routing falls back after a provider error', async () => {
  await withProviderKeys({ GEMINI_API_KEY: 'test-gemini', OPENAI_API_KEY: 'test-openai' }, async () => {
    const attempted = [];
    const result = await generateWithRoute({
      purpose: 'reasoning',
      provider: 'auto',
      messages: [{ role: 'user', content: 'test' }],
      generate: async ({ provider }) => {
        attempted.push(provider);
        if (provider === 'gemini') throw new Error('temporary provider failure');
        return { provider, text: 'ok' };
      },
    });
    assert.deepEqual(attempted, ['gemini', 'openai']);
    assert.deepEqual(result, { provider: 'openai', text: 'ok' });
  });
});
