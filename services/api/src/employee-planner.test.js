import test from 'node:test';
import assert from 'node:assert/strict';
import { createPlan, nextRunnableSteps, validatePlan } from './employee-planner.js';

const step=(id,intent,dependsOn=[])=>({id,intent,action:intent==='create_report'?'report.create':'data.analyze',dependsOn});

test('planner validates bounded plans',()=>{const p=createPlan({goal:'Prepare report',steps:[{intent:'lookup',action:'data.analyze'},{intent:'create_report',action:'report.create',dependsOn:['step_1']} ]});assert.equal(p.steps.length,2);assert.deepEqual(nextRunnableSteps(p,new Set()),[p.steps[0]]);assert.deepEqual(nextRunnableSteps(p,new Set(['step_1'])),[p.steps[1]]);});
test('planner rejects unknown intent',()=>assert.throws(()=>validatePlan({goal:'test plan',steps:[step('a','shell')]}),/Unsupported/));
test('planner rejects forward dependencies',()=>assert.throws(()=>validatePlan({goal:'test plan',steps:[step('a','lookup',['b']),step('b','lookup')]}),/earlier/));
test('planner caps plan size',()=>assert.throws(()=>validatePlan({goal:'test plan',steps:Array.from({length:13},(_,i)=>step(String(i),'lookup'))}),/maximum/));
