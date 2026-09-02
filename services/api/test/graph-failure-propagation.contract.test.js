import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const graph=await readFile(new URL('../src/execution-graph.js',import.meta.url),'utf8');
const runtime=await readFile(new URL('../src/agent-runtime.js',import.meta.url),'utf8');

test('execution graph accepts a failed step so terminal failure can be recorded',()=>{
  assert.match(graph,/\['running','succeeded','failed'\]\.includes\(completedStep\.status\)/);
  assert.match(graph,/const hasFailure=refreshed\.some\(s=>s\.status==='failed'\)/);
  assert.match(graph,/execution_graphs set status='failed'/);
});

test('runtime propagates step failures to the graph',()=>{
  assert.match(runtime,/status='failed',error=\$1,updated_at=now\(\)/);
  assert.match(runtime,/if\(graphId&&stepKey\)await advanceGraph\(\{graphId,completedStepKey:stepKey\}\)/);
});
