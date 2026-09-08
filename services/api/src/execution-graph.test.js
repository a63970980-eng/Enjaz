import test from 'node:test';
import assert from 'node:assert/strict';
import { getReadySteps } from './execution-graph.js';

const step=(id,intent,dependsOn=[])=>({id,intent,action:intent==='create_report'?'report.create':'data.analyze',dependsOn});

test('execution graph only releases dependency-ready steps',()=>{const plan={goal:'demo',steps:[step('a','lookup'),step('b','create_report',['a']),step('c','notify',['b'])]};assert.deepEqual(getReadySteps(plan,[]).map(s=>s.id),['a']);assert.deepEqual(getReadySteps(plan,['a']).map(s=>s.id),['b']);assert.deepEqual(getReadySteps(plan,['a','b']).map(s=>s.id),['c']);});
test('execution graph plan remains bounded and rejects duplicate keys',()=>{const base=Array.from({length:12},(_,i)=>step(`s${i}`,'lookup',i?['s'+(i-1)]:[]));assert.equal(getReadySteps({goal:'bounded',steps:base},[])[0].id,'s0');assert.throws(()=>getReadySteps({goal:'bad',steps:[step('x','lookup'),step('x','lookup')]},[]),/duplicate/);});
test('execution graph rejects forward dependency',()=>{assert.throws(()=>getReadySteps({goal:'bad',steps:[step('a','lookup',['b']),step('b','lookup')]},[]),/earlier/);});
test('execution graph frontier never releases blocked steps',()=>{const plan={goal:'demo',steps:[step('a','lookup'),step('b','create_report',['a'])]};assert.deepEqual(getReadySteps(plan,[]).map(s=>s.id),['a']);});
