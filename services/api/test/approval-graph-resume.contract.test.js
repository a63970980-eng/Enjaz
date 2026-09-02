import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source=await readFile(new URL('../src/agent-runtime.js',import.meta.url),'utf8');

test('approved execution resumes the tenant-scoped execution graph',()=>{
  assert.match(source,/payload\?\.graphId/);
  assert.match(source,/payload\?\.stepKey/);
  assert.match(source,/join execution_graphs g on g\.id=s\.graph_id/);
  assert.match(source,/g\.workspace_id=\$3/);
  assert.match(source,/status='succeeded'/);
  assert.match(source,/advanceGraph\(\{graphId,completedStepKey:stepKey\}\)/);
});

test('approval task lookup cannot cross workspace boundaries',()=>{
  assert.match(source,/join tasks t on t\.id=a\.task_id and t\.workspace_id=a\.workspace_id/);
  assert.match(source,/a\.workspace_id=\$2/);
});
