import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/index.js', import.meta.url), 'utf8');

test('initial workspace bootstrap is bound to an authenticated identity before a workspace role exists', () => {
  const start = source.indexOf("if(req.method==='POST'&&url.pathname==='/api/v1/onboarding/bootstrap')");
  const end = source.indexOf("if(req.method==='POST'&&url.pathname==='/api/v1/runtime/process')", start);
  assert.ok(start >= 0 && end > start, 'bootstrap route must remain distinct from workspace runtime routes');
  const route = source.slice(start, end);
  assert.ok(route.indexOf('authIdentity(req)') < route.indexOf('bootstrapWorkspace('));
  assert.match(route, /if\(!identity\)throw Object\.assign\(new Error\('Authentication required'\),\{status:401\}\)/);
  assert.match(route, /authUserId:identity\.authId/);
  assert.doesNotMatch(route, /requirePermission\(/);
});

test('queue-worker processing requires its service token, while user-triggered processing requires workspace.manage', () => {
  const start = source.indexOf("if(req.method==='POST'&&url.pathname==='/api/v1/runtime/process'){const internalBody=await body(req);");
  const end = source.indexOf('const workspaceId=url.searchParams.get', start);
  assert.ok(start >= 0 && end > start, 'internal worker branch must be bounded before workspace authentication');
  const workerBranch = source.slice(start, end);
  assert.match(workerBranch, /workerTokenValid\(req,internalBody\.workerToken\)/);
  assert.match(workerBranch, /processOneJob/);
  assert.match(source, /if\(req\.method==='POST'&&url\.pathname==='\/api\/v1\/runtime\/process'\)\{requirePermission\(user,PERMISSIONS\.WORKSPACE_MANAGE\)/);
});
