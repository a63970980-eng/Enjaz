import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source=await readFile(new URL('../src/execution-graph.js',import.meta.url),'utf8');

test('graph materialization validates task, employee and workspace ownership',()=>{
  assert.match(source,/tasks t join ai_employees e on e\.id=t\.employee_id and e\.workspace_id=t\.workspace_id/);
  assert.match(source,/t\.workspace_id=\$2/);
  assert.match(source,/t\.employee_id=\$3/);
  assert.match(source,/e\.status='active'/);
  assert.match(source,/Task, employee, and workspace ownership mismatch/);
});

test('graph terminal writes remain workspace scoped',()=>{
  assert.match(source,/execution_graphs set status='running'.*workspace_id=\$2/);
  assert.match(source,/execution_graphs set status='failed'.*workspace_id=\$2/);
  assert.match(source,/execution_graphs set status='succeeded'.*workspace_id=\$2/);
});
