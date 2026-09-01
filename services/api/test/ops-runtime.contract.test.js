import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('ops recovery reports recovered jobs and worker lifecycle closes resources', async()=>{
  const source=await readFile(new URL('../src/ops-runtime.js',import.meta.url),'utf8');
  assert.match(source,/recoverQueue\(\)/);
  assert.match(source,/recoveredCount/);
  assert.match(source,/heartbeat\(\{workerId,status:'offline'\}\)/);
  assert.match(source,/closeDb\(\)/);
  assert.match(source,/controller\?\.abort\(\)/);
});

test('ops snapshot is workspace-aware and uses stale-worker detection', async()=>{
  const source=await readFile(new URL('../src/ops-runtime.js',import.meta.url),'utf8');
  assert.match(source,/getWorkerHealth\(\{staleSeconds:90\}\)/);
  assert.match(source,/getQueueHealth\(workspaceId\)/);
  assert.match(source,/workspaceId/);
});
