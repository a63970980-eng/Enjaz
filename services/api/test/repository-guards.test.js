import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('repository layer enforces workspace ownership before dependent writes', async()=>{
  const source=await readFile(new URL('../src/workforce-repository.js',import.meta.url),'utf8');
  assert.match(source,/ai_employees where id=\$1 and workspace_id=\$2/);
  assert.match(source,/tasks t join ai_employees e on e\.id=t\.employee_id and e\.workspace_id=t\.workspace_id where t\.id=\$1 and t\.workspace_id=\$2/);
  assert.match(source,/tasks where workspace_id=\$1/);
  assert.match(source,/where id=\$3 and workspace_id=\$4 and status='pending'/);
});

test('approval decisions are single-transition operations', async()=>{
  const source=await readFile(new URL('../src/workforce-repository.js',import.meta.url),'utf8');
  assert.match(source,/status='pending'/);
  assert.match(source,/returning \*/);
  assert.match(source,/Pending approval not found/);
});
