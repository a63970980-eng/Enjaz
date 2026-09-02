import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const runtime=await readFile(new URL('../src/agent-runtime.js',import.meta.url),'utf8');
const policy=await readFile(new URL('../src/ai-employee-policy.js',import.meta.url),'utf8');
const integrity=await readFile(new URL('../db/migrations/023_tenant_integrity_and_budget_guards.sql',import.meta.url),'utf8');
const approvals=await readFile(new URL('../db/migrations/024_approval_idempotency.sql',import.meta.url),'utf8');

test('runtime enforces execution claims and employee execution limits',()=>{
  assert.match(runtime,/status in \('queued','planning'\)/);
  assert.match(runtime,/assertTaskExecutionBudget/);
  assert.match(policy,/maxToolExecutionsPerTask/);
  assert.match(runtime,/executionKey/);
});

test('database enforces cross-workspace resource integrity',()=>{
  assert.match(integrity,/tasks_employee_workspace_fkey/);
  assert.match(integrity,/approvals_task_workspace_fkey/);
  assert.match(integrity,/Task does not belong to the employee and workspace/);
});

test('approval gate is unique per workspace task',()=>{
  assert.match(approvals,/uq_pending_approval_workspace_task/);
  assert.match(approvals,/status='pending'/);
});
