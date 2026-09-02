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
  assert.match(source, /X-Frame-Options/);
  assert.match(source, /Referrer-Policy/);
  assert.match(source, /Permissions-Policy/);
  assert.match(source, /Rate limit exceeded/);
  assert.match(source, /Internal server error/);
  assert.match(source, /required in production/);
});

test('web entry point keeps executable code same-origin and framed content disabled', async () => {
  const source = await readFile(new URL('../../../apps/web/index.html', import.meta.url), 'utf8');
  assert.match(source, /Content-Security-Policy/);
  assert.match(source, /script-src 'self'/);
  assert.match(source, /frame-ancestors 'none'/);
  assert.match(source, /meta name="referrer" content="no-referrer"/);
});
