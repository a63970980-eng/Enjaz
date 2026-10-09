import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('web entry point keeps executable code same-origin and framed content disabled', async () => {
  const source = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(source, /Content-Security-Policy/);
  assert.match(source, /script-src 'self'/);
  assert.match(source, /frame-ancestors 'none'/);
  assert.match(source, /meta name="referrer" content="no-referrer"/);
});
