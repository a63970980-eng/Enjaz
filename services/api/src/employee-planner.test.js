import test from 'node:test';
import assert from 'node:assert/strict';
import { createPlan, nextRunnableSteps, validatePlan } from './employee-planner.js';

test('planner validates bounded plans',()=>{const p=createPlan({goal:'Prepare report',steps:[{intent:'lookup'},{intent:'create_report',dependsOn:['step_1']} ]});assert.equal(p.steps.length,2);assert.deepEqual(nextRunnableSteps(p,new Set()),[p.steps[0]]);assert.deepEqual(nextRunnableSteps(p,new Set(['step_1'])),[p.steps[1]]);});
test('planner rejects unknown intent',()=>assert.throws(()=>validatePlan({steps:[{id:'a',intent:'shell'}]}),/Unsupported/));
test('planner rejects forward dependencies',()=>assert.throws(()=>validatePlan({steps:[{id:'a',intent:'lookup',dependsOn:['b']},{id:'b',intent:'lookup'}]}),/earlier/));
test('planner caps plan size',()=>assert.throws(()=>validatePlan({steps:Array.from({length:13},(_,i)=>({id:String(i),intent:'lookup'}))}),/maximum/));
