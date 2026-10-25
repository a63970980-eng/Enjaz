import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { hasPermission, permissionsForRole, PERMISSIONS, requirePermission } from '../src/permissions.js';

const apiSource = readFileSync(new URL('../src/index.js', import.meta.url), 'utf8');
function tenantResolutionForRepositoryCheck() {
  return apiSource.indexOf('const user=await requireWorkspace(req,workspaceId)');
}
const openapiSource = readFileSync(new URL('../openapi.yaml', import.meta.url), 'utf8');

test('workspace managers receive the current write permissions and member invitation capability', () => {
  for (const permission of [
    PERMISSIONS.WORKSPACE_MANAGE,
    PERMISSIONS.EMPLOYEES_MANAGE,
    PERMISSIONS.TEAMS_MANAGE,
    PERMISSIONS.TASKS_MANAGE,
    PERMISSIONS.APPROVALS_DECIDE,
    PERMISSIONS.AUTOMATIONS_MANAGE,
    PERMISSIONS.INTEGRATIONS_MANAGE,
    PERMISSIONS.MEMBERS_INVITE,
  ]) assert.equal(hasPermission('manager', permission), true, permission);
  assert.equal(hasPermission('manager', PERMISSIONS.SSO_CONFIGURE), false);
  assert.equal(hasPermission('manager', PERMISSIONS.BILLING_MANAGE), false);
});

test('member and viewer roles remain read-only until write policy is explicitly approved', () => {
  for (const role of ['member', 'viewer']) {
    assert.equal(hasPermission(role, PERMISSIONS.WORKSPACE_READ), true);
    assert.equal(hasPermission(role, PERMISSIONS.EMPLOYEES_READ), true);
    assert.equal(hasPermission(role, PERMISSIONS.TASKS_READ), true);
    assert.equal(hasPermission(role, PERMISSIONS.WORKSPACE_OPERATIONS_READ), false);
    assert.equal(hasPermission(role, PERMISSIONS.TASKS_MANAGE), false);
    assert.equal(hasPermission(role, PERMISSIONS.MEMBERS_INVITE), false);
    assert.equal(hasPermission(role, PERMISSIONS.EMPLOYEES_MANAGE), false);
  }
});

test('organization owners and admins inherit workspace permissions plus organization administration', () => {
  for (const role of ['owner', 'admin']) {
    assert.equal(hasPermission(role, PERMISSIONS.WORKFORCE_MANAGE), true);
    assert.equal(hasPermission(role, PERMISSIONS.MEMBERS_INVITE), true);
    assert.equal(hasPermission(role, PERMISSIONS.BILLING_MANAGE), true);
    assert.equal(hasPermission(role, PERMISSIONS.SSO_CONFIGURE), true);
  }
});

test('permission evaluation denies unknown roles, unknown permissions, and missing principals', () => {
  assert.equal(hasPermission('custom-admin', PERMISSIONS.WORKSPACE_READ), false);
  assert.equal(hasPermission('manager', 'anything.execute'), false);
  assert.equal(hasPermission(null, PERMISSIONS.WORKSPACE_READ), false);
  assert.deepEqual(permissionsForRole('unknown-role'), []);
});

test('requirePermission preserves the principal on success and returns a structured 403 on denial', () => {
  const manager = { id: 'user-1', role: 'manager' };
  assert.equal(requirePermission(manager, PERMISSIONS.TEAMS_MANAGE), manager);
  assert.throws(() => requirePermission({ id: 'user-2', role: 'viewer' }, PERMISSIONS.TEAMS_MANAGE), error => {
    assert.equal(error.status, 403);
    assert.equal(error.code, 'PERMISSION_REQUIRED');
    assert.equal(error.permission, PERMISSIONS.TEAMS_MANAGE);
    return true;
  });
});

test('mutating API routes use named permissions rather than bypassing the centralized resolver', () => {
  for (const permission of [
    'WORKSPACE_OPERATIONS_READ', 'WORKFORCE_MANAGE', 'TEAMS_MANAGE', 'EMPLOYEES_MANAGE',
    'AUTOMATIONS_MANAGE', 'TASKS_MANAGE', 'APPROVALS_DECIDE', 'INTEGRATIONS_MANAGE',
    'MEMBERS_READ', 'MEMBERS_INVITE', 'MEMBERS_MANAGE',
  ]) assert.match(apiSource, new RegExp(`requirePermission\\(user,PERMISSIONS\\.${permission}\\)`));
  assert.match(apiSource,/if\(taskComments&&req\.method==='POST'\)\{requirePermission\(user,PERMISSIONS\.TASKS_MANAGE\)/);
  assert.doesNotMatch(apiSource, /requireManager\(user\);/);
  // Repository intelligence is documented as authenticated and tenant-scoped, and must stay below tenant resolution.
  const repositorySearch = apiSource.indexOf("url.pathname==='/api/v1/repository-intelligence/search'");
  assert.ok(tenantResolutionForRepositoryCheck() < repositorySearch);
  assert.match(apiSource, /repository-intelligence\/search'\)\{requirePermission\(user,PERMISSIONS\.WORKFORCE_READ\)/);
  // Invitation acceptance is identity-scoped, so it must authenticate directly and run before tenant resolution.
  const accept = apiSource.indexOf('/api/v1/members/invitations/accept');
  const tenantResolution = apiSource.indexOf('const user=await requireWorkspace(req,workspaceId)');
  assert.ok(accept > 0 && tenantResolution > accept);
  assert.match(apiSource, /url\.pathname==='\/api\/v1\/members\/invitations\/accept'\)\{const identity=await authIdentity\(req\)/);
  assert.match(apiSource, /function requireManager\(user\)\{try\{return requirePermission\(user,PERMISSIONS\.WORKSPACE_MANAGE\)/);
});

test('OpenAPI documents the actual manager-only operations paths and task-comment permission response', () => {
  assert.match(openapiSource,/^  \/api\/v1\/ops\/health:/m);
  assert.doesNotMatch(openapiSource,/^  \/ops\/health:/m);
  assert.match(openapiSource,/^  \/api\/v1\/runtime\/ops:/m);
  assert.match(openapiSource,/\/api\/v1\/tasks\/\{taskId\}\/comments:[\s\S]*?post:[\s\S]*?'403': \{\$ref: '#\/components\/responses\/Forbidden'\}/);
  assert.match(openapiSource,/TaskCommentInput/);
});
