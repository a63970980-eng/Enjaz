import test from 'node:test';
import assert from 'node:assert/strict';
import { getReadySteps } from './execution-graph.js';

const step=(id,intent,dependsOn=[])=>({id,intent,action:intent==='create_report'?'report.create':'data.analyze',dependsOn});

test('graph releases only dependency-ready steps',()=>{const p={goal:'demo',steps:[step('a','lookup'),step('b','create_report',['a']),step('c','notify',['b'])]};assert.deepEqual(getReadySteps(p,[]).map(s=>s.id),['a']);assert.deepEqual(getReadySteps(p,['a']).map(s=>s.id),['b']);assert.deepEqual(getReadySteps(p,['a','b']).map(s=>s.id),['c']);});
test('graph never releases a blocked step',()=>{const p={goal:'demo',steps:[step('a','lookup'),step('b','create_report',['a'])]};assert.deepEqual(getReadySteps(p,[]),[p.steps[0]]);});
