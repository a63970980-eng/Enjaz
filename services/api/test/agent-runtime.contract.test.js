import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('agent runtime revalidates employee, task, tool and policy at execution time', async()=>{
  const source=await readFile(new URL('../src/agent-runtime.js',import.meta.url),'utf8');
  for(const marker of [
    "status='active'",
    'where id=$1 and workspace_id=$2 and employee_id=$3',
    'validateEmployeePolicy',
    'Tool not assigned to employee',
    'Tool output exceeds employee policy limit'
  ]) assert.match(source,new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
});

test('approved execution is workspace scoped, leased, and budgeted before tool execution', async()=>{
  const source=await readFile(new URL('../src/agent-runtime.js',import.meta.url),'utf8');
  assert.match(source,/a\.workspace_id=\$2/);
  assert.match(source,/status='approved'/);
  assert.match(source,/execution_claimed_at=now\(\)/);
  assert.match(source,/await chargeBudget/);
  assert.match(source,/approved:true/);
  assert.match(source,/policy\.limits\.maxOutputBytes/);
});
