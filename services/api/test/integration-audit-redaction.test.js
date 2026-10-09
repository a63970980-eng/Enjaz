import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('integration failure audit events do not persist raw external error messages', async () => {
  const gateway = await readFile(new URL('../src/secure-tool-gateway.js', import.meta.url), 'utf8');
  const integrations = await readFile(new URL('../src/integrations/external-tools.js', import.meta.url), 'utf8');
  assert.match(gateway, /errorType:error instanceof Error \? error\.name : 'UnknownError'/);
  assert.match(integrations, /errorType:error instanceof Error \? error\.name : 'UnknownError'/);
  assert.doesNotMatch(gateway, /error:error\.message/);
  assert.doesNotMatch(integrations, /error:String\(error\?\.message\|\|'\)/);
});
