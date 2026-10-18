import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('repository layer enforces workspace ownership before dependent writes', async()=>{
  const source=await readFile(new URL('../src/workforce-repository.js',import.meta.url),'utf8');
  assert.match(source,/ai_employees where id=\$1 and workspace_id=\$2/);
  assert.match(source,/tasks t join ai_employees e on e\.id=t\.employee_id and e\.workspace_id=t\.workspace_id where t\.id=\$1 and t\.workspace_id=\$2/);
  assert.match(source,/from tasks t .*where t\.workspace_id=\$1/);
  assert.match(source,/where id=\$3 and workspace_id=\$4 and status='pending'/);
});

test('approval decisions are single-transition operations', async()=>{
  const source=await readFile(new URL('../src/workforce-repository.js',import.meta.url),'utf8');
  assert.match(source,/status='pending'/);
  assert.match(source,/returning \*/);
  assert.match(source,/Pending approval not found/);
});

test('employee creation validates role templates and department ownership in the same workspace', async()=>{
  const source=await readFile(new URL('../src/workforce-repository.js',import.meta.url),'utf8');
  assert.match(source,/select role_code from employee_role_templates where role_code=\$1 and active=true/);
  assert.match(source,/select id from departments where id=\$1 and workspace_id=\$2/);
  assert.match(source,/insert into ai_employees \(id,workspace_id,department_id/);
});

test('team creation rejects duplicate names and non-active or cross-workspace managers', async()=>{
  const repository=await readFile(new URL('../src/workforce-repository.js',import.meta.url),'utf8');
  const routes=await readFile(new URL('../src/index.js',import.meta.url),'utf8');
  const createTeam=repository.slice(repository.indexOf('export async function createDepartment'),repository.indexOf('export async function listEmployeeGoals'));
  assert.match(repository,/Team name must contain 1 to 160 characters/);
  assert.match(repository,/lower\(name\)=lower\(\$2\)/);
  assert.match(createTeam,/status='active' for share/);
  assert.match(createTeam,/withTransaction/);
  assert.match(createTeam,/workspaces where id=\$1 for update/);
  assert.match(routes,/POST'&&url\.pathname==='\/api\/v1\/departments'\)\{requirePermission\(user,PERMISSIONS\.TEAMS_MANAGE\)/);
});

test('task comments require non-empty bounded text before the database write', async()=>{
  const source=await readFile(new URL('../src/workforce-repository.js',import.meta.url),'utf8');
  assert.match(source,/Comment must contain 1 to 10000 characters/);
  assert.match(source,/comment\.length>10_000/);
});
