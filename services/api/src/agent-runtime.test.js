import test from 'node:test';
import assert from 'node:assert/strict';
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
