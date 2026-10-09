import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('integration failure audit events do not persist raw external error messages', async () => {
  const source = await readFile(new URL('../src/secure-tool-gateway.js', import.meta.url), 'utf8');
  assert.match(source, /errorType:error instanceof Error \? error\.name : 'UnknownError'/);
  assert.doesNotMatch(source, /JSON\.stringify\(\{connectionId,durationMs:Date\.now\(\)-started,error:error\.message\}\)/);
});
