import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source=await readFile(new URL('../src/workforce-repository.js',import.meta.url),'utf8');

test('approval decisions are tenant scoped and auditable',()=>{
  assert.match(source,/where id=\$3 and workspace_id=\$4 and status='pending'/);
  assert.match(source,/select employee_id from tasks where id=\$1 and workspace_id=\$2/);
  assert.match(source,/approval\.\$\{status\}/);
  assert.match(source,/actor_type/);
  assert.match(source,/approvalId:id/);
});

test('rejected approvals cancel the waiting task and graph in the same workspace',()=>{
  assert.match(source,/status='cancelled'.*completed_at=coalesce\(completed_at,now\)/);
  assert.match(source,/execution_graphs set status='cancelled'/);
  assert.match(source,/status='waiting_approval'/);
  assert.match(source,/where id=\$1 and workspace_id=\$2/);
});
