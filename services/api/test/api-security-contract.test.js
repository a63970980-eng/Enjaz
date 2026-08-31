import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('API source keeps security boundaries explicit', async () => {
  const source = await readFile(new URL('../src/index.js', import.meta.url), 'utf8');
  assert.match(source, /Authentication required/);
  assert.match(source, /Workspace access denied/);
  assert.match(source, /Manager permission required/);
  assert.match(source, /Access-Control-Allow-Origin/);
  assert.match(source, /X-Content-Type-Options/);
  assert.match(source, /Rate limit exceeded/);
});
