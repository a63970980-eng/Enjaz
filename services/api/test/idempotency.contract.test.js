import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('execution idempotency has database uniqueness at graph and step level', async()=>{
  const source=await readFile(new URL('../db/migrations/012_execution_idempotency.sql',import.meta.url),'utf8');
  assert.match(source,/unique index.*execution_steps.*graph_id,attempt_key/i);
  assert.match(source,/unique index.*job_queue.*graphId/i);
});
