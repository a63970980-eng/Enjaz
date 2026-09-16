import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = async path => readFile(new URL(path, import.meta.url), 'utf8');

test('approved decisions enqueue a durable execution job', async () => {
  const repository = await source('./workforce-repository.js');
  assert.match(repository, /jobType:'approval\.execute'/);
  assert.match(repository, /idempotencyKey:`approval:\$\{id\}`/);
  assert.match(repository, /status=\$1,decided_by=\$2,decided_at=now\(\),updated_at=now\(\)/);
});

test('queue worker dispatches approval execution', async () => {
  const worker = await source('./queue-worker.js');
  assert.match(worker, /job\.job_type==='approval\.execute'/);
  assert.match(worker, /executeApprovedTask/);
});

test('employee disable is normalized to the persisted archived enum', async () => {
  const repository = await source('./workforce-repository.js');
  assert.match(repository, /status==='disabled'\?'archived'/);
  assert.match(repository, /status==='disabled'\?'archived':status/);
});

test('API migration bootstraps the base schema only on a fresh database', async () => {
  const migration = await source('../db/migrate.js');
  assert.match(migration, /to_regclass\('public\.organizations'\)/);
  assert.match(migration, /if\(!base\.rows\[0\]\?\.table_name\)/);
});
