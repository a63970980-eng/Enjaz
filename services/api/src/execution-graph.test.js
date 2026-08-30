import test from 'node:test';
import assert from 'node:assert/strict';
import { getReadySteps } from './execution-graph.js';

test('execution graph only releases dependency-ready steps',()=>{
 const plan={goal:'demo',steps:[{id:'a',intent:'lookup',dependsOn:[]},{id:'b',intent:'create_report',dependsOn:['a']},{id:'c',intent:'notify',dependsOn:['b']}]};
 assert.deepEqual(getReadySteps(plan,[]).map(s=>s.id),['a']);
 assert.deepEqual(getReadySteps(plan,['a']).map(s=>s.id),['b']);
 assert.deepEqual(getReadySteps(plan,['a','b']).map(s=>s.id),['c']);
});
