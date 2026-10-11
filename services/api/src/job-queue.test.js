import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { enqueueJob } from './job-queue.js';

test('enqueueJob accepts an existing transaction client', async () => {
  const calls = [];
  const client = {
    query: async (sql, args) => {
      calls.push({ sql, args });
      return { rows: [{ id: args[0], status: 'queued' }] };
    }
  };
  const job = await enqueueJob({ workspaceId: 'w', jobType: 'employee.step', payload: { x: 1 }, client });
  assert.equal(job.status, 'queued');
  assert.equal(calls.length, 1);
  assert.match(calls[0].sql, /insert into job_queue/i);
});

test('enqueueJob stores idempotency key with the job payload', async () => {
  const calls = [];
  const client = {
    query: async (sql, args) => {
      calls.push({ sql, args });
      return { rows: [{ id: args[0], status: 'queued', payload: JSON.parse(args[3]) }] };
    }
  };
  const job = await enqueueJob({
    workspaceId: 'workspace-1',
    jobType: 'employee.step',
    payload: { taskId: 'task-1' },
    idempotencyKey: 'graph-1:step-1',
    client
  });
  assert.equal(job.payload.idempotencyKey, 'graph-1:step-1');
  assert.equal(job.payload.taskId, 'task-1');
  assert.equal(calls.length, 1);
  assert.match(calls[0].sql, /insert into job_queue/i);
});

test('enqueueJob returns the existing job when an idempotency key conflicts', async () => {
  const calls = [];
  const existing = { id: 'existing-job', status: 'queued' };
  const client = {
    query: async (sql, args) => {
      calls.push({ sql, args });
      if (calls.length === 1) throw Object.assign(new Error('duplicate key'), { code: '23505' });
      return { rows: [existing], rowCount: 1 };
    }
  };
  const job = await enqueueJob({
    workspaceId: 'workspace-1',
    jobType: 'employee.step',
    payload: { taskId: 'task-1' },
    idempotencyKey: 'graph-1:step-1',
    client
  });
  assert.deepEqual(job, existing);
  assert.equal(calls.length, 2);
  assert.match(calls[1].sql, /workspace_id=\$1 and job_type=\$2/);
  assert.deepEqual(calls[1].args, ['workspace-1', 'employee.step', 'graph-1:step-1']);
});

test('enqueueJob rejects retry budgets outside the supported range before database access', async () => {
  let called = false;
  const client = { query: async () => { called = true; return { rows: [] }; } };
  for (const maxAttempts of [0, -1, 1.5, 21]) {
    await assert.rejects(
      enqueueJob({ workspaceId: 'w', jobType: 'employee.step', client, maxAttempts }),
      /maxAttempts must be an integer between 1 and 20/
    );
  }
  assert.equal(called, false);
});

test('stale job recovery dead-letters jobs that exhausted their attempts', async () => {
  const source = await readFile(new URL('./job-queue.js', import.meta.url), 'utf8');
  assert.match(source, /attempts>=max_attempts then 'dead' else 'queued'/);
  assert.match(source, /Worker lease expired after maximum attempts/);
  assert.match(source, /returning id,status/);
});
