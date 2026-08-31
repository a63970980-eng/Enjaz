import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('API contract exposes a stable version and required capability flags', async () => {
  const source = await readFile(new URL('../src/index.js', import.meta.url), 'utf8');
  assert.match(source, /version:'0\.7\.0'/);
  assert.match(source, /storage:'postgresql'/);
  assert.match(source, /auth:'supabase'/);
  assert.match(source, /runtime:'enabled'/);
  assert.match(source, /integrations:'enabled'/);
});
