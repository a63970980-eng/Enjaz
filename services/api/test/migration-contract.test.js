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

test('workforce role templates are versioned for both API and Supabase databases', async () => {
  const apiMigration = await readFile(new URL('../db/migrations/032_employee_role_template_catalog.sql', import.meta.url), 'utf8');
  const supabaseMigration = await readFile(new URL('../../../supabase/migrations/20261018100000_employee_role_template_catalog.sql', import.meta.url), 'utf8');
  for (const source of [apiMigration, supabaseMigration]) {
    for (const column of ['role_code','sector','sector_label','department_name','default_goal','responsibilities','tools','provision_by_default']) {
      assert.match(source, new RegExp(column));
    }
    assert.match(source, /create table if not exists public\.employee_role_templates/i);
    assert.match(source, /create unique index|unique\s*\(/i);
  }
  assert.match(apiMigration, /restaurant_operations_lead/);
  assert.match(supabaseMigration, /government_performance_analyst/);
});

test('workforce API reads the canonical role template catalog and not phantom tables', async () => {
  const repository = await readFile(new URL('../src/workforce-repository.js', import.meta.url), 'utf8');
  assert.match(repository, /employee_role_templates/);
  assert.doesNotMatch(repository, /from workforce_roles|from workforce_role_industry_contexts/);
});

test('industry starter provisioning uses catalog-backed roles with normalized team assignments', async () => {
  const source = await readFile(new URL('../../../supabase/migrations/20261018110000_atomic_industry_pack_provisioning.sql', import.meta.url), 'utf8');
  assert.match(source, /provision_by_default=true/);
  assert.match(source, /role_code/);
  assert.match(source, /department_id/);
  assert.match(source, /manager_employee_id/);
  assert.match(source, /v_safe_tools/);
  assert.match(source, /v_max_employees/);
  assert.match(source, /EMPLOYEE_LIMIT_EXCEEDED/);
});

test('API starter provisioning is transactional, quota-gated, and validates registered low-risk tools', async () => {
  const source = await readFile(new URL('../src/industry-provisioning.js', import.meta.url), 'utf8');
  assert.match(source, /for update of s/i);
  assert.match(source, /select id from public\.workspaces where id=\$1 for update/i);
  assert.match(source, /provision_by_default=true/);
  assert.match(source, /EMPLOYEE_LIMIT_EXCEEDED/);
  assert.match(source, /getTool\(name\)/);
  assert.match(source, /needsApproval\(name\)/);
  assert.match(source, /department_id,role_code/);
});

test('Supabase starter provisioning delegates all writes to one locked database transaction', async () => {
  const migration = await readFile(new URL('../../../supabase/migrations/20261018110000_atomic_industry_pack_provisioning.sql', import.meta.url), 'utf8');
  const apiMigration = await readFile(new URL('../db/migrations/20261018110000_atomic_industry_pack_provisioning.sql', import.meta.url), 'utf8');
  const edge = await readFile(new URL('../../../supabase/functions/enjaz-industry/index.ts', import.meta.url), 'utf8');
  for (const source of [migration, apiMigration]) {
    assert.match(source, /create or replace function public\.provision_industry_pack/i);
    assert.match(source, /for update/i);
    assert.match(source, /EMPLOYEE_LIMIT_EXCEEDED/);
    assert.match(source, /employee_role_templates/);
  }
  assert.match(edge, /\.rpc\("provision_industry_pack"/);
  assert.doesNotMatch(edge, /\.from\("ai_employees"\)\.insert/);
});

test('industry pack API distinguishes first provision from an idempotent replay', async () => {
  const source = await readFile(new URL('../src/index.js', import.meta.url), 'utf8');
  assert.match(source, /result\.created\?201:200/);
});

test('API schema adds employee department ownership before atomic starter provisioning', async () => {
  const migration = await readFile(new URL('../db/migrations/033_employee_department_assignment.sql', import.meta.url), 'utf8');
  assert.match(migration, /add column if not exists department_id uuid references public\.departments\(id\) on delete set null/i);
  assert.match(migration, /create index if not exists ai_employees_department_id_idx/i);
});

test('starter provisioning does not report an incomplete legacy pack as a successful replay', async () => {
  const api = await readFile(new URL('../src/industry-provisioning.js', import.meta.url), 'utf8');
  const rpc = await readFile(new URL('../db/migrations/20261018110000_atomic_industry_pack_provisioning.sql', import.meta.url), 'utf8');
  const supabase = await readFile(new URL('../../../supabase/migrations/20261018110000_atomic_industry_pack_provisioning.sql', import.meta.url), 'utf8');
  const edge = await readFile(new URL('../../../supabase/functions/enjaz-industry/index.ts', import.meta.url), 'utf8');
  for (const source of [api, rpc, supabase, edge]) assert.match(source, /INDUSTRY_PACK_INCOMPLETE/);
  assert.match(api, /select count\(\*\)::int as count from ai_employees where workspace_id=\$1/);
  assert.doesNotMatch(api, /status\s*<>\s*'deleted'/);
  assert.match(rpc, /COALESCE\(department_id::text,policy->>'departmentId'\)/i);
});

test('both migration tracks define the onboarding identity contract used by the API runtime', async () => {
  const apiMigration = await readFile(new URL('../db/migrations/034_workspace_identity_and_invitations.sql', import.meta.url), 'utf8');
  const supabaseMigration = await readFile(new URL('../../../supabase/migrations/20261025120000_workspace_identity_and_invitations.sql', import.meta.url), 'utf8');
  for (const source of [apiMigration, supabaseMigration]) {
    assert.match(source, /alter table public\.users add column if not exists platform_role text/i);
    assert.match(source, /create or replace function public\.assign_first_platform_admin\(p_user_id uuid\)/i);
    assert.match(source, /create table if not exists public\.workspace_invitations/i);
    assert.match(source, /token_hash text not null unique/i);
    assert.match(source, /enable row level security/i);
    assert.match(source, /private\.has_workspace_role\(workspace_id, array\['manager'\]\)/i);
  }
});

test('the Supabase track guards an early revoke that precedes the platform-admin function', async () => {
  const source = await readFile(new URL('../../../supabase/migrations/20260926135518_optimize_commerce_rls_and_lock_admin_bootstrap.sql', import.meta.url), 'utf8');
  assert.match(source, /do \$\$[\s\S]*?if exists[\s\S]*?revoke execute on function public\.assign_first_platform_admin\(uuid\) from anon;/i);
});

test('invitation storage never keeps a usable plaintext token', async () => {
  const repository = await readFile(new URL('../src/membership-repository.js', import.meta.url), 'utf8');
  assert.match(repository, /createHash\('sha256'\)/);
  assert.match(repository, /token_hash/);
  assert.doesNotMatch(repository, /insert into workspace_invitations[\s\S]{0,400}\bemail, role, token,/i);
  assert.match(repository, /Never select token_hash/);
});

test('OpenAPI documents actual industry and duplicate-team conflict responses', async () => {
  const contract = await readFile(new URL('../openapi.yaml', import.meta.url), 'utf8');
  assert.match(contract, /'400': \{\$ref: '#\/components\/responses\/BadRequest'\}[\s\S]*?'402':/);
  assert.match(contract, /'409': \{description: Subscription is not configured or a partial earlier starter team needs reconciliation\}/);
  assert.match(contract, /'409': \{description: A team with this name already exists in the workspace\}/);
  assert.match(contract, /'404': \{description: Workspace was not found\}/);
  assert.match(contract, /managerEmployeeId: \{type: \[string, 'null'\], format: uuid, description: Employee must be active and belong to the same workspace\}/);
});
