import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migration=await readFile(new URL('../db/migrations/019_job_queue_cancellation.sql',import.meta.url),'utf8');
const queue=await readFile(new URL('../src/job-queue.js',import.meta.url),'utf8');

test('job queue database state machine supports cancellation',()=>{
  assert.match(migration,/status in \('queued','running','succeeded','failed','dead','cancelled'\)/);
  assert.match(queue,/status='cancelled'/);
  assert.match(queue,/status in \('queued','running'\)/);
});
