import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('HTTP contract: security and operational controls remain wired at the server boundary', async () => {
  const source = await readFile(new URL('../src/index.js', import.meta.url), 'utf8');
  for (const marker of [
    "req.method==='OPTIONS'",
    "Authorization,Content-Type,X-Request-Id",
    "X-Content-Type-Options",
    "X-Frame-Options",
    "Referrer-Policy",
    "server.requestTimeout=30_000",
    "server.headersTimeout=15_000",
    "server.keepAliveTimeout=5_000",
    "process.once('SIGTERM'",
    "process.once('SIGINT'"
  ]) assert.match(source, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

test('HTTP contract: tenant authorization happens before tenant-scoped routes', async () => {
  const source = await readFile(new URL('../src/index.js', import.meta.url), 'utf8');
  const auth = source.indexOf('const user=await requireWorkspace(req,workspaceId)');
  const routes = source.indexOf("url.pathname==='/api/v1/employees'");
  assert.ok(auth >= 0 && routes > auth);
});
