import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const repository = await readFile(new URL('../src/billing-repository.js', import.meta.url), 'utf8');
const migration = await readFile(new URL('../db/migrations/20261009100000_billing_schema_compatibility.sql', import.meta.url), 'utf8');

test('billing queries work with text and UUID plan identifiers', () => {
  assert.match(repository, /p\.id::text=s\.plan_id::text/);
  assert.match(repository, /p\.code as plan_code/);
  assert.match(repository, /plan: subscription\.plan_code \|\| subscription\.plan_id/);
});

test('billing compatibility migration preserves deployed plan IDs and limits', () => {
  assert.match(migration, /to_regclass\('public\.saas_plans'\)/);
  assert.match(migration, /CREATE VIEW public\.billing_plans WITH \(security_invoker = true\)/);
  assert.match(migration, /monthly_cents AS monthly_price_cents/);
  assert.match(migration, /GREATEST\(included_runs, 1\)/);
  assert.match(migration, /billing_plans_code_unique/);
});
