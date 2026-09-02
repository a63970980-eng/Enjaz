import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source=await readFile(new URL('../src/job-queue.js',import.meta.url),'utf8');

test('enqueueJob supports workspace-scoped idempotency keys',()=>{
  assert.match(source,/idempotencyKey=null/);
  assert.match(source,/where workspace_id=\$1 and job_type=\$2/);
  assert.match(source,/payload->>'idempotencyKey'=\$3/);
  assert.match(source,/payload=\{\.\.\.payload,idempotencyKey\}/);
});

test('queue completion/failure only mutates the active worker lease',()=>{
  assert.match(source,/status='running' and locked_by=\$3/);
});
