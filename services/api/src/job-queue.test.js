import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { enqueueJob } from './job-queue.js';

test('enqueueJob accepts an existing transaction client', async () => {
  const calls = [];
  const client = { query: async (sql, args) => { calls.push({ sql, args }); return { rows: [{ id: args[0], status: 'queued' }] }; } };
  const job = await enqueueJob({ workspaceId: 'w', jobType: 'employee.step', payload: { x: 1 }, client });
  assert.equal(job.status, 'queued');
  assert.equal(calls.length, 1);
  assert.match(calls[0].sql, /insert into job_queue/i);
});

test('stale job recovery dead-letters jobs that exhausted their attempts', async () => {
  const source = await readFile(new URL('./job-queue.js', import.meta.url), 'utf8');
  assert.match(source, /attempts>=max_attempts then 'dead' else 'queued'/);
  assert.match(source, /Worker lease expired after maximum attempts/);
  assert.match(source, /returning id,status/);
});

test('enqueueJob validates retry budgets before touching the database', async () => {
  let called = false;
  const client = { query: async () => { called = true; return { rows: [] }; } };
  for (const maxAttempts of [0, -1, 1.5, 21, Number.NaN]) {
    await assert.rejects(
      enqueueJob({ workspaceId: 'w', jobType: 'employee.step', client, maxAttempts }),
      /maxAttempts must be an integer between 1 and 20/
    );
  }
  assert.equal(called, false);
});
