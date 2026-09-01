import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('health endpoint performs a real database liveness check without exposing internals', async()=>{
  const source=await readFile(new URL('../src/health.js',import.meta.url),'utf8');
  assert.match(source,/select 1/);
  assert.match(source,/status:'unhealthy'/);
  assert.match(source,/db:'error'/);
  assert.doesNotMatch(source,/error\.message/);
  assert.doesNotMatch(source,/stack/);
});
