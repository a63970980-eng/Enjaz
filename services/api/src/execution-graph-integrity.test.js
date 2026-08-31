import test from 'node:test';
import assert from 'node:assert/strict';
import { getReadySteps } from './execution-graph.js';

test('graph releases only dependency-ready steps',()=>{const p={goal:'demo',steps:[{id:'a',intent:'lookup',dependsOn:[]},{id:'b',intent:'create_report',dependsOn:['a']},{id:'c',intent:'notify',dependsOn:['b']}]};assert.deepEqual(getReadySteps(p,[]).map(s=>s.id),['a']);assert.deepEqual(getReadySteps(p,['a']).map(s=>s.id),['b']);assert.deepEqual(getReadySteps(p,['a','b']).map(s=>s.id),['c']);});
test('graph never releases a blocked step',()=>{const p={goal:'demo',steps:[{id:'a',intent:'lookup',dependsOn:[]},{id:'b',intent:'create_report',dependsOn:['a']} ]};assert.deepEqual(getReadySteps(p,[]),[p.steps[0]]);});
