import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source=await readFile(new URL('../src/workflow-engine.js',import.meta.url),'utf8');

test('workflow terminal writes remain tenant scoped',()=>{
  assert.match(source,/where id=\$1 and workspace_id=\$3/);
  assert.match(source,/status='awaiting_approval'/);
  assert.match(source,/status='completed'/);
  assert.match(source,/status='failed'/);
});

test('workflow steps cannot create tasks for inactive or cross-tenant employees',()=>{
  assert.match(source,/ai_employees where id=\$1 and workspace_id=\$2 and status='active'/);
  assert.match(source,/insert into tasks \(id,workspace_id,employee_id/);
});
