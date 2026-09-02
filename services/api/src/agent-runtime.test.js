import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateEmployeePolicy, assertExecutionBudget } from './ai-employee-policy.js';

test('employee policy blocks dangerous primitive tools',()=>{
 assert.throws(()=>validateEmployeePolicy({status:'active',tools:[]},{action:'shell.exec',input:{}}),/blocked/);
});
test('employee policy rejects oversized input',()=>{
 assert.throws(()=>validateEmployeePolicy({status:'active',tools:[],policy:{maxInputBytes:8}},{action:'data.analyze',input:{value:'123456789'}},),/exceeds/);
});
test('employee execution budget is bounded',()=>{
 assert.equal(assertExecutionBudget({toolExecutions:2},{maxToolExecutionsPerTask:3}),3);
 assert.throws(()=>assertExecutionBudget({toolExecutions:3},{maxToolExecutionsPerTask:3}),/limit exceeded/);
});
test('approved execution enforces the same per-task budget and claims the task atomically',async()=>{
 const source=await readFile(new URL('./agent-runtime.js',import.meta.url),'utf8');
 assert.match(source,/await assertTaskExecutionBudget\(\{workspaceId,employeeId:approval\.employee_id,taskId:approval\.task_id,executionKey,limits:policy\.limits\}\)/);
 assert.match(source,/where id=\$1 and workspace_id=\$2 and employee_id=\$3 and status='awaiting_approval' returning id/);
});
