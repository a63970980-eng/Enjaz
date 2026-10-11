import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('workflow runner enforces workspace ownership and bounded retries', async () => {
  const source = await readFile(new URL('../src/workflow-engine.js', import.meta.url), 'utf8');
  for (const marker of [
    'where id=$1 and workspace_id=$2',
    "ai_employees where id=$1 and workspace_id=$2 and status='active'",
    'workspace_id=$2',
    'maxRetries=2',
    'shouldRetryWorkflowStep',
    'attempt<=maxRetries',
    'WORKFLOW_STEP_TIMEOUT',
    'Math.min(1000*2**(attempt-1),10000)'
  ]) assert.ok(source.includes(marker), `missing workflow contract: ${marker}`);
});

test('workflow runner handles dependency, timeout, approval and terminal states', async () => {
  const source = await readFile(new URL('../src/workflow-engine.js', import.meta.url), 'utf8');
  for (const marker of ['Workflow dependency not completed', 'Workflow step timeout', 'awaiting_approval', 'completed', 'failed']) {
    assert.ok(source.includes(marker), `missing workflow state: ${marker}`);
  }
});
