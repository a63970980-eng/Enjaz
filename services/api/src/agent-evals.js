import { withSpan } from './telemetry.js';

const MAX_CASES = 100;

export function normalizeEvalCase(input = {}) {
  return {
    id: String(input.id || '').trim(),
    name: String(input.name || '').trim(),
    goal: String(input.goal || '').trim(),
    expectedActions: Array.isArray(input.expectedActions) ? input.expectedActions.map(String) : [],
    forbiddenActions: Array.isArray(input.forbiddenActions) ? input.forbiddenActions.map(String) : [],
  };
}

export function evaluatePlan(plan, testCase) {
  const c = normalizeEvalCase(testCase);
  const actions = Array.isArray(plan?.steps) ? plan.steps.map((s) => String(s?.action || '').trim()).filter(Boolean) : [];
  const forbidden = actions.filter((action) => c.forbiddenActions.includes(action));
  const missing = c.expectedActions.filter((action) => !actions.includes(action));
  return {
    passed: forbidden.length === 0 && missing.length === 0,
    actions,
    missingExpectedActions: missing,
    forbiddenActions: forbidden,
  };
}

export async function runAgentEvalSuite({ cases = [], planner }) {
  const suite = cases.slice(0, MAX_CASES).map(normalizeEvalCase);
  const results = [];
  for (const testCase of suite) {
    results.push(await withSpan('enjaz.agent.eval', {
      'eval.case_id': testCase.id,
      'eval.name': testCase.name,
    }, async () => {
      try {
        const plan = await planner(testCase);
        return { case: testCase, ...evaluatePlan(plan, testCase), plan };
      } catch (error) {
        return { case: testCase, passed: false, error: error?.message || String(error) };
      }
    }));
  }
  const passed = results.filter((r) => r.passed).length;
  return { total: results.length, passed, failed: results.length - passed, results };
}
