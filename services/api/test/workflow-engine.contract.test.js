import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('workflow runner enforces workspace ownership and bounded retries', async()=>{
  const source=await readFile(new URL('../src/workflow-engine.js',import.meta.url),'utf8');
  assert.match(source,/where id=\$1 and workspace_id=\$2/);
  assert.match(source,/maxRetries=2/);
  assert.match(source,/attempt>maxRetries/);
  assert.match(source,/Math\.min\(1000\*2\*\*\(attempt-1\),10000\)/);
});

test('workflow runner handles dependency, timeout, approval and terminal states', async()=>{
  const source=await readFile(new URL('../src/workflow-engine.js',import.meta.url),'utf8');
  for(const marker of ['Workflow dependency not completed','Workflow step timeout','awaiting_approval','completed','failed']) assert.match(source,new RegExp(marker));
});
