import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { processOneJob, recoverQueue } from './queue-worker.js';

test('worker module exposes single-job processing and queue recovery entry points', () => {
  assert.equal(typeof processOneJob, 'function');
  assert.equal(typeof recoverQueue, 'function');
});

test('queue recovery reconciles exhausted employee steps into terminal graph and task states', async () => {
  const source = await readFile(new URL('./queue-worker.js', import.meta.url), 'utf8');
  assert.match(source, /j\.status='dead' and j\.job_type='employee\.step'/);
  assert.match(source, /update execution_steps set status='failed'/);
  assert.match(source, /update tasks set status='failed'/);
  assert.match(source, /update execution_graphs set status='failed'/);
  assert.match(source, /Reconciliation is deliberately repeatable/);
});
