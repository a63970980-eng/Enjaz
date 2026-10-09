import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const repository = await readFile(new URL('../src/workforce-repository.js', import.meta.url), 'utf8');
const roleMigration = await readFile(new URL('../db/migrations/030_ai_employee_role_code.sql', import.meta.url), 'utf8');
const workforceMigration = await readFile(new URL('../db/migrations/031_ai_employee_workforce_fields.sql', import.meta.url), 'utf8');

test('employee repository write contract is represented in additive database migrations', () => {
  const requiredColumns = [
    'role_code',
    'mission',
    'responsibilities',
    'authority_matrix',
    'kpis',
    'collaboration',
    'escalation_rules',
    'industry_context',
    'workforce_version',
  ];

  for (const column of requiredColumns) {
    assert.ok(repository.includes(column), `repository no longer uses expected column ${column}`);
    const migration = column === 'role_code' ? roleMigration : workforceMigration;
    assert.match(
      migration,
      new RegExp(`ADD COLUMN IF NOT EXISTS ${column}\\b`, 'i'),
      `missing additive migration for ai_employees.${column}`,
    );
  }
});

test('employee role index is scoped to workspace and active catalog roles', () => {
  assert.match(roleMigration, /ON public\.ai_employees\s*\(workspace_id, role_code\)/i);
  assert.match(roleMigration, /WHERE status = 'active' AND role_code IS NOT NULL/i);
});
