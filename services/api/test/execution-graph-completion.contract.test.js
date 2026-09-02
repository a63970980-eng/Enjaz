import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source=await readFile(new URL('../src/execution-graph.js',import.meta.url),'utf8');

test('graph completion must validate the completed step belongs to the graph',()=>{
  assert.match(source,/steps\.find\(s=>s\.step_key===completedStepKey\)/);
  assert.match(source,/if\(!completedStep\)throw new Error/);
  assert.match(source,/\['running','succeeded','failed'\]\.includes\(completedStep\.status\)/);
  assert.match(source,/const completed=new Set\(refreshed\.filter\(s=>s\.status==='succeeded'\)/);
});

test('graph dispatch uses workspace-scoped idempotency keys',()=>{
  assert.match(source,/idempotencyKey:`\$\{graphId\}:\$\{step\.id\}`/);
  assert.match(source,/idempotencyKey:`\$\{graphId\}:\$\{step\.step_key\}`/);
});
