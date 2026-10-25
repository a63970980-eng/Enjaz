import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { bootstrapWorkspace, getUserByAuthId, listUserWorkspaces } from '../src/onboarding-repository.js';

const url = process.env.DATABASE_URL;

test('first customer bootstrap persists profile, workspace and manager membership', { skip: !url }, async () => {
  const db = new pg.Client({ connectionString: url, ssl: false });
  await db.connect();
  const authUserId = randomUUID();
  const tag = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  let organizationId = null;

  try {
    const result = await bootstrapWorkspace({
      authUserId,
      email: `owner-${tag}@bootstrap.test`,
      name: 'Owner',
      organizationName: `Bootstrap Org ${tag}`,
      workspaceName: 'Operations',
    });

    organizationId = result.user.organization_id;
    assert.equal(result.created, true);
    assert.equal(result.user.auth_user_id, authUserId);
    assert.equal(result.user.role, 'owner');
    assert.ok(result.user.platform_role === 'admin' || result.user.platform_role === null);
    assert.equal(result.workspaces.length, 1);
    assert.equal(result.workspaces[0].workspace_role, 'manager');

    const profile = await getUserByAuthId(authUserId);
    assert.equal(profile.id, result.user.id);
    assert.ok(profile.platform_role === 'admin' || profile.platform_role === null);
    assert.deepEqual((await listUserWorkspaces(profile.id)).map((workspace) => workspace.id), [result.workspaces[0].id]);

    const membership = await db.query('select role from workspace_members where workspace_id=$1 and user_id=$2', [
      result.workspaces[0].id,
      result.user.id,
    ]);
    assert.equal(membership.rows[0].role, 'manager');

    const audit = await db.query("select count(*)::int c from audit_events where workspace_id=$1 and event_type='workspace.created'", [
      result.workspaces[0].id,
    ]);
    assert.equal(audit.rows[0].c, 1);

    // Re-running bootstrap for the same identity is idempotent and does not create a second organization.
    const replay = await bootstrapWorkspace({
      authUserId,
      email: `owner-${tag}@bootstrap.test`,
      name: 'Owner',
      organizationName: `Bootstrap Org ${tag}`,
      workspaceName: 'Operations',
    });
    assert.equal(replay.created, false);
    assert.equal(replay.user.organization_id, organizationId);
    assert.equal(replay.workspaces.length, 1);
  } finally {
    if (organizationId) await db.query('delete from organizations where id=$1', [organizationId]).catch(() => {});
    await db.end();
  }
});
