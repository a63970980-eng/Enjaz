import test from 'node:test';
import assert from 'node:assert/strict';
import { getReadySteps } from './execution-graph.js';

test('execution graph only releases dependency-ready steps',()=>{
 const plan={goal:'demo',steps:[{id:'a',intent:'lookup',dependsOn:[]},{id:'b',intent:'create_report',dependsOn:['a']},{id:'c',intent:'notify',dependsOn:['b']}]};
 assert.deepEqual(getReadySteps(plan,[]).map(s=>s.id),['a']);
 assert.deepEqual(getReadySteps(plan,['a']).map(s=>s.id),['b']);
 assert.deepEqual(getReadySteps(plan,['a','b']).map(s=>s.id),['c']);
});

test('execution graph plan remains bounded and rejects duplicate keys',()=>{
 const base=Array.from({length:12},(_,i)=>({id:`s${i}`,intent:'lookup',dependsOn:i?['s'+(i-1)]:[]}));
 assert.equal(getReadySteps({goal:'bounded',steps:base},[])[0].id,'s0');
 assert.throws(()=>getReadySteps({goal:'bad',steps:[{id:'x',intent:'lookup'},{id:'x',intent:'lookup'}]},[]),/duplicate/);
});

test('execution graph rejects forward dependency',()=>{
 assert.throws(()=>getReadySteps({goal:'bad',steps:[{id:'a',intent:'lookup',dependsOn:['b']},{id:'b',intent:'lookup'}]},[]),/earlier/);
});
