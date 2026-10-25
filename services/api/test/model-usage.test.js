import test from 'node:test';
import assert from 'node:assert/strict';
import { readTokenUsage, estimateModelCostCents, maxTaskModelTokens, assertModelTokenBudget } from '../src/model-usage.js';

function withEnv(values, run) {
  const previous = {};
  for (const [key, value] of Object.entries(values)) {
    previous[key] = process.env[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    return run();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test('token usage is normalized across provider payload shapes', () => {
  assert.deepEqual(readTokenUsage({ prompt_tokens: 120, completion_tokens: 30, total_tokens: 150 }), { inputTokens: 120, outputTokens: 30, totalTokens: 150 });
  assert.deepEqual(readTokenUsage({ promptTokenCount: 80, candidatesTokenCount: 20 }), { inputTokens: 80, outputTokens: 20, totalTokens: 100 });
  assert.deepEqual(readTokenUsage(null), { inputTokens: 0, outputTokens: 0, totalTokens: 0 });
  assert.deepEqual(readTokenUsage({ prompt_tokens: -5, completion_tokens: 'oops' }), { inputTokens: 0, outputTokens: 0, totalTokens: 0 });
});

test('cost is reported as unpriced rather than invented when no rates are configured', () => {
  withEnv({ ENJAZ_MODEL_INPUT_CENTS_PER_1K: undefined, ENJAZ_MODEL_OUTPUT_CENTS_PER_1K: undefined }, () => {
    assert.deepEqual(estimateModelCostCents({ inputTokens: 5000, outputTokens: 1000 }), { costCents: 0, priced: false });
  });
});

test('configured per-1K rates produce integer cents', () => {
  withEnv({ ENJAZ_MODEL_INPUT_CENTS_PER_1K: '2', ENJAZ_MODEL_OUTPUT_CENTS_PER_1K: '8' }, () => {
    assert.deepEqual(estimateModelCostCents({ inputTokens: 1000, outputTokens: 500 }), { costCents: 6, priced: true });
    assert.deepEqual(estimateModelCostCents({ inputTokens: 1, outputTokens: 0 }), { costCents: 1, priced: true });
  });
});

test('the per-task model token ceiling prefers employee policy over the environment default', () => {
  withEnv({ ENJAZ_MAX_TASK_MODEL_TOKENS: '5000' }, () => {
    assert.equal(maxTaskModelTokens({ policy: { maxModelTokensPerTask: 1200 } }), 1200);
    assert.equal(maxTaskModelTokens({ policy: {} }), 5000);
    assert.equal(maxTaskModelTokens(null), 5000);
  });
});

test('exceeding the per-task token ceiling fails with a budget error', () => {
  withEnv({ ENJAZ_MAX_TASK_MODEL_TOKENS: '100' }, () => {
    assert.deepEqual(assertModelTokenBudget({ usage: { total_tokens: 100 }, employee: null }), { limit: 100, total: 100 });
    assert.throws(
      () => assertModelTokenBudget({ usage: { prompt_tokens: 90, completion_tokens: 40 }, employee: null }),
      (error) => error.code === 'MODEL_TOKEN_BUDGET_EXCEEDED' && error.status === 429,
    );
  });
});
