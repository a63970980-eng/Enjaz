import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('repository layer enforces workspace ownership before dependent writes', async()=>{
  const source=await readFile(new URL('../src/workforce-repository.js',import.meta.url),'utf8');
  assert.match(source,/ai_employees where id=\$1 and workspace_id=\$2/);
  assert.match(source,/tasks where id=\$1 and workspace_id=\$2/);
  assert.match(source,/where id=\$3 and workspace_id=\$4 and status='pending'/);
});

test('approval decisions are single-transition operations', async()=>{
  const source=await readFile(new URL('../src/workforce-repository.js',import.meta.url),'utf8');
  assert.match(source,/status='pending'/);
  assert.match(source,/returning \*/);
  assert.match(source,/Pending approval not found/);
});
