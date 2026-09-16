import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const source = new URL('../src/index.js', import.meta.url);

test('request authentication never falls back to the Supabase service-role key', async () => {
  const text = await fs.readFile(source, 'utf8');
  assert.doesNotMatch(text, /SUPABASE_SERVICE_ROLE_KEY/);
});

test('request authentication is configured around public Supabase keys', async () => {
  const text = await fs.readFile(source, 'utf8');
  assert.match(text, /SUPABASE_ANON_KEY/);
  assert.match(text, /SUPABASE_PUBLISHABLE_KEY/);
});
