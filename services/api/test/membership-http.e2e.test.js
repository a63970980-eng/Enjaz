import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { bootstrapWorkspace } from '../src/onboarding-repository.js';

const url = process.env.DATABASE_URL;

test('members API enforces authentication, permissions and workspace isolation over HTTP', { skip: !url }, async () => {
  // Supabase Auth is mocked at the documented /auth/v1/user endpoint; everything
  // else below runs the real API router, real permissions and real PostgreSQL.
  const identities = new Map();
  const authMock = http.createServer((req, res) => {
    const token = String(req.headers.authorization || '').replace(/^Bearer /, '');
    const identity = identities.get(token);
    res.writeHead(identity ? 200 : 401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(identity || { message: 'invalid token' }));
  });
  await new Promise((resolve) => authMock.listen(0, '127.0.0.1', resolve));
  const authPort = authMock.address().port;

  process.env.SUPABASE_URL = `http://127.0.0.1:${authPort}`;
  process.env.SUPABASE_ANON_KEY = 'test-anon-key';
  process.env.CORS_ORIGINS = 'http://localhost:3000';

  const { server } = await import('../src/index.js');
  const { closeDb } = await import('../src/db.js');
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const db = new pg.Client({ connectionString: url, ssl: false });
  await db.connect();
  const organizations = [];
  const tag = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  const managerAuth = randomUUID();
  const viewerAuth = randomUUID();
  const inviteeAuth = randomUUID();
  const outsiderAuth = randomUUID();
  const managerEmail = `manager-${tag}@http.test`;
  const viewerEmail = `viewer-${tag}@http.test`;
  const inviteeEmail = `invitee-${tag}@http.test`;
  const outsiderEmail = `outsider-${tag}@http.test`;
  identities.set('manager-token', { id: managerAuth, email: managerEmail, user_metadata: { full_name: 'Manager' } });
  identities.set('viewer-token', { id: viewerAuth, email: viewerEmail, user_metadata: { full_name: 'Viewer' } });
  identities.set('invitee-token', { id: inviteeAuth, email: inviteeEmail, user_metadata: { full_name: 'Invitee' } });
  identities.set('outsider-token', { id: outsiderAuth, email: outsiderEmail, user_metadata: { full_name: 'Outsider' } });

  async function call(token, path, method = 'GET', body) {
    const response = await fetch(`${base}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    return { status: response.status, data: await response.json().catch(() => ({})) };
  }

  try {
    const boot = await bootstrapWorkspace({
      authUserId: managerAuth,
      email: managerEmail,
      name: 'Manager',
      organizationName: `HTTP Org ${tag}`,
      workspaceName: 'Primary',
    });
    organizations.push(boot.user.organization_id);
    const workspaceId = boot.workspaces[0].id;

    // A viewer is a real member of the same workspace with read-only permissions.
    const viewerId = randomUUID();
    await db.query('insert into users(id,organization_id,email,name,auth_user_id,role) values($1,$2,$3,$4,$5,$6)', [
      viewerId, boot.user.organization_id, viewerEmail, 'Viewer', viewerAuth, 'member',
    ]);
    await db.query("insert into workspace_members(workspace_id,user_id,role) values($1,$2,'viewer')", [workspaceId, viewerId]);

    // Anonymous callers never reach tenant routes.
    assert.equal((await call('', `/api/v1/members?workspaceId=${workspaceId}`)).status, 401);
    assert.equal((await call('bogus-token', `/api/v1/members?workspaceId=${workspaceId}`)).status, 401);

    // Manager can list members; the response never exposes invitation tokens.
    const listed = await call('manager-token', `/api/v1/members?workspaceId=${workspaceId}`);
    assert.equal(listed.status, 200);
    assert.deepEqual(listed.data.data.map((member) => member.email).sort(), [managerEmail, viewerEmail].sort());

    // Read-only members can see the roster but cannot invite or change roles.
    assert.equal((await call('viewer-token', `/api/v1/members?workspaceId=${workspaceId}`)).status, 200);
    const deniedInvite = await call('viewer-token', `/api/v1/members/invitations?workspaceId=${workspaceId}`, 'POST', { email: inviteeEmail, role: 'member' });
    assert.equal(deniedInvite.status, 403);
    assert.equal(deniedInvite.data.code, 'PERMISSION_REQUIRED');
    assert.equal((await call('viewer-token', `/api/v1/members/${viewerId}?workspaceId=${workspaceId}`, 'PATCH', { role: 'manager' })).status, 403);

    const invited = await call('manager-token', `/api/v1/members/invitations?workspaceId=${workspaceId}`, 'POST', { email: inviteeEmail, role: 'member' });
    assert.equal(invited.status, 201);
    assert.ok(invited.data.data.token.length >= 32);
    assert.equal(invited.data.data.invitation.email, inviteeEmail);

    const invitationList = await call('manager-token', `/api/v1/members/invitations?workspaceId=${workspaceId}`);
    assert.equal(invitationList.status, 200);
    assert.equal(invitationList.data.data.length, 1);
    assert.equal(invitationList.data.data[0].token_hash, undefined);

    // Acceptance is identity-scoped and requires no workspace parameter.
    const accepted = await call('invitee-token', '/api/v1/members/invitations/accept', 'POST', { token: invited.data.data.token });
    assert.equal(accepted.status, 200);
    assert.equal(accepted.data.data.workspaceId, workspaceId);

    const me = await call('invitee-token', '/api/v1/auth/me');
    assert.equal(me.status, 200);
    assert.ok(me.data.data.workspaces.some((workspace) => workspace.id === workspaceId));

    // A second organization cannot read or mutate the first workspace.
    const outsider = await bootstrapWorkspace({
      authUserId: outsiderAuth,
      email: outsiderEmail,
      name: 'Outsider',
      organizationName: `Other Org ${tag}`,
      workspaceName: 'Other',
    });
    organizations.push(outsider.user.organization_id);
    assert.equal((await call('outsider-token', `/api/v1/members?workspaceId=${workspaceId}`)).status, 403);
    assert.equal((await call('outsider-token', `/api/v1/members/${viewerId}?workspaceId=${workspaceId}`, 'PATCH', { role: 'manager' })).status, 403);

    // The last manager cannot be demoted through the API.
    const demote = await call('manager-token', `/api/v1/members/${boot.user.id}?workspaceId=${workspaceId}`, 'PATCH', { role: 'viewer' });
    assert.equal(demote.status, 409);
    assert.equal(demote.data.code, 'LAST_MANAGER');

    // Invalid roles are rejected before touching the database.
    const invalidRole = await call('manager-token', `/api/v1/members/invitations?workspaceId=${workspaceId}`, 'POST', { email: `x-${tag}@http.test`, role: 'owner' });
    assert.equal(invalidRole.status, 400);
    assert.equal(invalidRole.data.code, 'INVALID_ROLE');

    const removed = await call('manager-token', `/api/v1/members/${viewerId}?workspaceId=${workspaceId}`, 'DELETE');
    assert.equal(removed.status, 200);
    const afterRemoval = await call('manager-token', `/api/v1/members?workspaceId=${workspaceId}`);
    assert.ok(!afterRemoval.data.data.some((member) => member.user_id === viewerId));

    const audit = await db.query("select event_type from audit_events where workspace_id=$1 and event_type like 'member.%'", [workspaceId]);
    assert.ok(audit.rows.some((row) => row.event_type === 'member.invited'));
    assert.ok(audit.rows.some((row) => row.event_type === 'member.joined'));
    assert.ok(audit.rows.some((row) => row.event_type === 'member.removed'));
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await closeDb();
    await new Promise((resolve) => authMock.close(resolve));
    for (const id of organizations) await db.query('delete from organizations where id=$1', [id]).catch(() => {});
    await db.end();
  }
});
