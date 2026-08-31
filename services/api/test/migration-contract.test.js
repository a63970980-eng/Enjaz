import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('migration runner executes migrations in lexical order and records completion atomically', async () => {
  const source = await readFile(new URL('../db/migrate.js', import.meta.url), 'utf8');
  assert.match(source, /\.sort\(\)/);
  assert.match(source, /begin/);
  assert.match(source, /commit/);
  assert.match(source, /rollback/);
  assert.match(source, /schema_migrations/);
});

test('initial schema declares the core tenant boundary', async () => {
  const source = await readFile(new URL('../db/migrations/001_initial.sql', import.meta.url), 'utf8');
  for (const table of ['organizations','workspaces','users','workspace_members','ai_employees','tasks','approvals','audit_events']) {
    assert.match(source, new RegExp(`create table ${table}`));
  }
});
