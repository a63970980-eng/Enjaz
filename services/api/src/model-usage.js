/**
 * Model usage accounting for AI employee planning.
 *
 * Token counts are always measured and stored; money is only derived when the
 * operator configures per-1K token prices, so no invented pricing is reported.
 */

const DEFAULT_MAX_TASK_MODEL_TOKENS = 120_000;

const number = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
};

/** Normalizes OpenAI, Gemini and OpenAI-compatible usage payloads. */
export function readTokenUsage(usage) {
  if (!usage || typeof usage !== 'object') return { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
  const inputTokens = number(usage.prompt_tokens ?? usage.input_tokens ?? usage.promptTokenCount ?? usage.inputTokenCount);
  const outputTokens = number(usage.completion_tokens ?? usage.output_tokens ?? usage.candidatesTokenCount ?? usage.outputTokenCount);
  const totalTokens = number(usage.total_tokens ?? usage.totalTokenCount) || inputTokens + outputTokens;
  return { inputTokens, outputTokens, totalTokens };
}

function rate(name) {
  const parsed = Number(process.env[name]);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

/**
 * Converts tokens to integer cents using ENJAZ_MODEL_INPUT_CENTS_PER_1K and
 * ENJAZ_MODEL_OUTPUT_CENTS_PER_1K. Unpriced models report zero cost with
 * `priced: false` instead of guessing a price.
 */
export function estimateModelCostCents({ inputTokens = 0, outputTokens = 0 } = {}) {
  const inputRate = rate('ENJAZ_MODEL_INPUT_CENTS_PER_1K');
  const outputRate = rate('ENJAZ_MODEL_OUTPUT_CENTS_PER_1K');
  if (!inputRate && !outputRate) return { costCents: 0, priced: false };
  const exact = (number(inputTokens) / 1000) * inputRate + (number(outputTokens) / 1000) * outputRate;
  return { costCents: Math.ceil(exact), priced: true };
}

export function maxTaskModelTokens(employee = null) {
  const configured = number(employee?.policy?.maxModelTokensPerTask) || number(process.env.ENJAZ_MAX_TASK_MODEL_TOKENS) || DEFAULT_MAX_TASK_MODEL_TOKENS;
  return configured;
}

/** Refuses a plan whose model usage would exceed the per-task ceiling. */
export function assertModelTokenBudget({ usage, employee }) {
  const limit = maxTaskModelTokens(employee);
  const total = readTokenUsage(usage).totalTokens;
  if (total > limit) {
    throw Object.assign(new Error(`AI planning exceeded the per-task model token limit of ${limit}`), {
      status: 429,
      code: 'MODEL_TOKEN_BUDGET_EXCEEDED',
    });
  }
  return { limit, total };
}
