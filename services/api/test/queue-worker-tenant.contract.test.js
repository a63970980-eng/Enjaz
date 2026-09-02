import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source=await readFile(new URL('../src/queue-worker.js',import.meta.url),'utf8');

test('workflow queue dispatch always uses the queued workspace',()=>{
  assert.match(source,/workflowId/);
  assert.match(source,/runWorkflow\(\{\.\.\.p,workspaceId:job\.workspace_id\}\)/);
});

test('employee execution graph lookup is tenant scoped',()=>{
  assert.match(source,/join execution_graphs g on g\.id=s\.graph_id/);
  assert.match(source,/g\.workspace_id=\$3/);
  assert.match(source,/if\(!current\)throw new Error/);
});
