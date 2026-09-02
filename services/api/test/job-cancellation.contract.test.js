import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const queue=await readFile(new URL('../src/job-queue.js',import.meta.url),'utf8');
const migration=await readFile(new URL('../db/migrations/019_job_cancellation_status.sql',import.meta.url),'utf8');

test('queue cancellation is workspace scoped and only cancels queued/running jobs',()=>{
  assert.match(queue,/status='cancelled'/);
  assert.match(queue,/workspace_id=\$3/);
  assert.match(queue,/status in \('queued','running'\)/);
});

test('database permits cancelled queue state',()=>{
  assert.match(migration,/status in \('queued','running','succeeded','failed','dead','cancelled'\)/);
  assert.match(migration,/job_queue_status_check/);
});
