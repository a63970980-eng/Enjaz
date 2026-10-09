import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('deployment config applies browser security headers and same-origin script policy', async () => {
  const source = await readFile(new URL('../../vercel.json', import.meta.url), 'utf8');
  const config = JSON.parse(source);
  const headers = config.headers.find((entry) => entry.source === '/(.*)')?.headers || [];
  const policy = Object.fromEntries(headers.map(({ key, value }) => [key.toLowerCase(), value]));
  assert.equal(policy['x-content-type-options'], 'nosniff');
  assert.equal(policy['x-frame-options'], 'DENY');
  assert.match(policy['content-security-policy'], /script-src 'self'/);
  assert.match(policy['content-security-policy'], /frame-ancestors 'none'/);
  assert.equal(policy['referrer-policy'], 'no-referrer');
});
