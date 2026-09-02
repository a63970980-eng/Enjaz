import test from 'node:test';
import assert from 'node:assert/strict';
import { needsApproval } from '../src/agent-runtime.js';

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
