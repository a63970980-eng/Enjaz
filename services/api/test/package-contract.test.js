import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('API package exposes deterministic migrate and test entrypoints', async () => {
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(pkg.type, 'module');
  assert.equal(pkg.scripts.migrate, 'node db/migrate.js');
  assert.equal(pkg.scripts.test, 'node --test');
  assert.ok(pkg.dependencies.pg);
  assert.ok(pkg.dependencies['@supabase/supabase-js']);
});
