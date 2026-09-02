import test from 'node:test';
import assert from 'node:assert/strict';
import { needsApproval } from '../src/agent-runtime.js';
import { validateEmployeePolicy } from '../src/ai-employee-policy.js';

test('high-risk actions require human approval',()=>{
  for (const action of ['payment','delete_data','bulk_message','financial_change','purchase']) assert.equal(needsApproval(action),true,action);
});

test('unknown low-risk action does not become high-risk by name alone',()=>{
  assert.equal(needsApproval('data.analyze'),false);
});

test('always approval policy protects low-risk actions too',()=>{
  assert.equal(needsApproval('data.analyze',{policy:{approvalMode:'always'}}),true);
});

test('none approval policy only bypasses approval for low-risk actions',()=>{
  assert.equal(needsApproval('data.analyze',{policy:{approvalMode:'none'}}),false);
  assert.equal(needsApproval('payment',{policy:{approvalMode:'none'}}),true);
});

test('invalid approval mode safely defaults to required',()=>{
  const employee={status:'active',policy:{approvalMode:'invalid',maxToolExecutionsPerTask:0,maxInputBytes:-1,maxOutputBytes:'bad',maxSteps:NaN}};
  const {limits,approvalMode}=validateEmployeePolicy(employee,{action:'data.analyze',input:{}});
  assert.equal(approvalMode,'required');
  assert.deepEqual(limits,{maxToolExecutionsPerTask:10,maxInputBytes:65536,maxOutputBytes:262144,maxSteps:12});
});

test('valid custom policy limits are normalized to positive integers',()=>{
  const employee={status:'active',policy:{maxToolExecutionsPerTask:3.9,maxInputBytes:2048.8,maxOutputBytes:4096.2,maxSteps:7.9,approvalMode:'always'}};
  const {limits,approvalMode}=validateEmployeePolicy(employee,{action:'data.analyze',input:{ok:true}});
  assert.deepEqual(limits,{maxToolExecutionsPerTask:3,maxInputBytes:2048,maxOutputBytes:4096,maxSteps:7});
  assert.equal(approvalMode,'always');
});
