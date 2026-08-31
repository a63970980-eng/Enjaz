import test from 'node:test';
import assert from 'node:assert/strict';
import { executeTool, registerTool } from './tool-registry.js';

test('tool receives execution context',async()=>{registerTool({name:'test.context',risk:'low',execute:async({context})=>context});const result=await executeTool({employee:{tools:['test.context']},name:'test.context',input:{},context:{memory:[{key:'x'}]}});assert.deepEqual(result,{memory:[{key:'x'}]});});
test('high-risk tool requires explicit approval',async()=>{registerTool({name:'test.danger',risk:'high',execute:async()=>({ok:true})});await assert.rejects(()=>executeTool({employee:{tools:['test.danger']},name:'test.danger',input:{}}),/approval required/);const result=await executeTool({employee:{tools:['test.danger']},name:'test.danger',input:{},approved:true});assert.deepEqual(result,{ok:true});});
