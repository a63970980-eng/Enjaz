import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('migration runner serializes schema changes with an advisory lock', async()=>{
  const source=await readFile(new URL('../db/migrate.js',import.meta.url),'utf8');
  assert.match(source,/pg_advisory_lock\(\$1\)/);
  assert.match(source,/pg_advisory_unlock\(\$1\)/);
  assert.match(source,/begin/);
  assert.match(source,/commit/);
  assert.match(source,/rollback/);
});

test('CI provisions Supabase-compatible roles and runs migrations before tests', async()=>{
  const source=await readFile(new URL('../../\.github/workflows/api-ci.yml',import.meta.url),'utf8');
  assert.match(source,/postgres:16/);
  assert.match(source,/CREATE ROLE authenticated/);
  assert.match(source,/CREATE OR REPLACE FUNCTION auth\.uid/);
  assert.match(source,/npm run migrate/);
  assert.match(source,/npm test/);
});
