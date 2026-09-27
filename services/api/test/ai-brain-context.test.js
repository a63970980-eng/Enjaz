import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBrainContext } from '../src/ai-brain.js';

test('planner context exposes only assigned tools and active integrations',()=>{
 const ctx=buildBrainContext({
  employee:{name:'Accountant',role:'accountant',goal:'reconcile',tools:['finance.read']},
  goal:'reconcile sales',
  memory:[],
  integrations:[{provider:'stripe',status:'active',display_name:'Finance'}]
 });
 assert.deepEqual(ctx.availableTools.map(t=>t.name),['finance.read']);
 assert.deepEqual(ctx.employee.integrations,[{provider:'stripe',status:'active',display_name:'Finance'}]);
});
