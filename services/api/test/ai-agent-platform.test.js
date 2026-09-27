import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveModelRoute } from '../src/ai-model-router.js';
import { evaluatePlan, runAgentEvalSuite } from '../src/agent-evals.js';

test('model routing keeps explicit provider selection deterministic',()=>{
  const route=resolveModelRoute({purpose:'planning',provider:'gemini',model:'test-model'});
  assert.deepEqual(route,[{provider:'gemini',model:'test-model'}]);
});

test('agent plan evaluation detects missing and forbidden actions',()=>{
  const result=evaluatePlan(
    {steps:[{action:'data.analyze'},{action:'report.create'},{action:'slack.message'}]},
    {expectedActions:['data.analyze','report.create'],forbiddenActions:['slack.message']}
  );
  assert.equal(result.passed,false);
  assert.deepEqual(result.forbiddenActions,['slack.message']);
  assert.deepEqual(result.missingExpectedActions,[]);
});

test('agent eval suite aggregates passing and failing cases',async()=>{
  const result=await runAgentEvalSuite({
    cases:[
      {id:'ok',name:'valid',expectedActions:['data.analyze'],forbiddenActions:['payment']},
      {id:'bad',name:'invalid',expectedActions:['report.create'],forbiddenActions:['payment']},
    ],
    planner:async testCase=>({goal:testCase.goal,steps:testCase.id==='ok'?[{action:'data.analyze'}]:[{action:'payment'}]})
  });
  assert.equal(result.total,2);
  assert.equal(result.passed,1);
  assert.equal(result.failed,1);
});
