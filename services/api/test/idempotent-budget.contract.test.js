import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migration=await readFile(new URL('../db/migrations/022_idempotent_usage_charge.sql',import.meta.url),'utf8');
const runtime=await readFile(new URL('../src/agent-runtime.js',import.meta.url),'utf8');

test('budget usage has a unique execution key and replay-safe charge function',()=>{
  assert.match(migration,/create unique index if not exists idx_ai_employee_usage_execution_key/);
  assert.match(migration,/metadata->>'executionKey'/);
  assert.match(migration,/returns bigint/);
  assert.match(migration,/unique_violation/);
  assert.match(migration,/return existing_cost/);
});

test('runtime supplies stable execution keys for normal and approved executions',()=>{
  assert.match(runtime,/const executionKey=`task:\$\{taskId\}/);
  assert.match(runtime,/const executionKey=`approval:\$\{approvalId\}`/);
  assert.match(runtime,/JSON\.stringify\(\{action,executionKey\}\)/);
});
