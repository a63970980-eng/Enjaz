import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import {
  listMembers,
  listInvitations,
  createInvitation,
  revokeInvitation,
  acceptInvitation,
  updateMemberRole,
  removeMember,
} from '../src/membership-repository.js';

const url = process.env.DATABASE_URL;
const suffix = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

test('workspace membership and invitations are tenant scoped and role guarded', { skip: !url }, async () => {
  const db = new pg.Client({ connectionString: url, ssl: false });
  await db.connect();
  const ids = {
    org: randomUUID(), org2: randomUUID(),
    workspace: randomUUID(), workspace2: randomUUID(),
    manager: randomUUID(), outsider: randomUUID(), invitee: randomUUID(), crossOrg: randomUUID(),
  };
  const tag = suffix();
  const managerEmail = `manager-${tag}@membership.test`;
  const inviteeEmail = `invitee-${tag}@membership.test`;
  const crossEmail = `cross-${tag}@membership.test`;

  try {
    await db.query('begin');
    await db.query('insert into organizations(id,name,slug) values($1,$2,$3),($4,$5,$6)', [
      ids.org, 'Membership Org', `membership-${tag}`, ids.org2, 'Other Org', `other-${tag}`,
    ]);
    await db.query('insert into workspaces(id,organization_id,name,slug) values($1,$2,$3,$4),($5,$6,$7,$8)', [
      ids.workspace, ids.org, 'Primary', `primary-${tag}`, ids.workspace2, ids.org2, 'Secondary', `secondary-${tag}`,
    ]);
    await db.query(
      'insert into users(id,organization_id,email,name,auth_user_id) values($1,$2,$3,$4,$5),($6,$7,$8,$9,$10)',
      [ids.manager, ids.org, managerEmail, 'Manager', ids.manager, ids.crossOrg, ids.org2, crossEmail, 'Cross Org User', ids.crossOrg],
    );
    await db.query("insert into workspace_members(workspace_id,user_id,role) values($1,$2,'manager')", [ids.workspace, ids.manager]);
    await db.query('commit');

    // Listing is scoped to the workspace.
    const members = await listMembers(ids.workspace);
    assert.equal(members.length, 1);
    assert.equal(members[0].email, managerEmail);
    assert.equal((await listMembers(ids.workspace2)).length, 0);

    // Manager-issued invitation for a new workspace member.
    const created = await createInvitation({ workspaceId: ids.workspace, email: inviteeEmail.toUpperCase(), role: 'manager', actorUserId: ids.manager });
    assert.equal(created.invitation.role, 'manager');
    assert.equal(created.invitation.email, inviteeEmail);
    assert.ok(created.token.length >= 32);
    const stored = (await db.query('select token_hash from workspace_invitations where id=$1', [created.invitation.id])).rows[0];
    assert.notEqual(stored.token_hash, created.token, 'raw invitation token must not be stored');
    assert.match(stored.token_hash, /^[a-f0-9]{64}$/);
    assert.equal((await db.query("select count(*)::int c from audit_events where workspace_id=$1 and event_type='member.invited'", [ids.workspace])).rows[0].c, 1);

    // Invalid input and duplicate pending invitations are rejected.
    await assert.rejects(createInvitation({ workspaceId: ids.workspace, email: 'not-an-email', role: 'member' }), /valid email/i);
    await assert.rejects(createInvitation({ workspaceId: ids.workspace, email: managerEmail, role: 'member' }), /already a member/i);
    await assert.rejects(
      createInvitation({ workspaceId: ids.workspace, email: inviteeEmail, role: 'owner' }),
      (error) => error.status === 400 && error.code === 'INVALID_ROLE',
    );
    await assert.rejects(
      createInvitation({ workspaceId: ids.workspace, email: inviteeEmail, role: 'member' }),
      (error) => error.status === 409 && error.code === 'INVITATION_EXISTS',
    );

    // Invitations stay inside their workspace.
    assert.equal((await listInvitations(ids.workspace)).length, 1);
    assert.equal((await listInvitations(ids.workspace2)).length, 0);

    // Direct database access is RLS-restricted: only managers of the workspace may read invitations.
    await db.query('set role authenticated');
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [ids.manager]);
    assert.equal((await db.query('select id from workspace_invitations where workspace_id=$1', [ids.workspace])).rowCount, 1);
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [ids.crossOrg]);
    assert.equal((await db.query('select id from workspace_invitations where workspace_id=$1', [ids.workspace])).rowCount, 0);
    await db.query('reset role');
    await db.query('set role anon');
    await assert.rejects(db.query('select id from workspace_invitations limit 1'), /permission denied/i);
    await db.query('reset role');

    // The token only works for the invited email address.
    await assert.rejects(
      acceptInvitation({ token: created.token, authUserId: randomUUID(), email: `other-${tag}@membership.test`, name: 'Imposter' }),
      (error) => error.status === 403 && error.code === 'INVITATION_EMAIL_MISMATCH',
    );

    // A valid acceptance creates the invitee profile in the inviting organization only.
    const accepted = await acceptInvitation({ token: created.token, authUserId: ids.invitee, email: inviteeEmail, name: 'Invitee' });
    assert.equal(accepted.workspaceId, ids.workspace);
    assert.equal(accepted.role, 'manager');
    const inviteeProfile = (await db.query('select organization_id, auth_user_id from users where id=$1', [accepted.userId])).rows[0];
    assert.equal(inviteeProfile.organization_id, ids.org);
    assert.equal(inviteeProfile.auth_user_id, ids.invitee);
    assert.equal((await db.query('select status from workspace_invitations where id=$1', [created.invitation.id])).rows[0].status, 'accepted');

    // A consumed token cannot be replayed.
    await assert.rejects(
      acceptInvitation({ token: created.token, authUserId: ids.invitee, email: inviteeEmail, name: 'Invitee' }),
      (error) => error.status === 400 && error.code === 'INVALID_INVITATION',
    );

    // An identity that already belongs to another organization cannot silently join.
    const second = await createInvitation({ workspaceId: ids.workspace, email: crossEmail, role: 'viewer', actorUserId: ids.manager });
    await assert.rejects(
      acceptInvitation({ token: second.token, authUserId: ids.crossOrg, email: crossEmail, name: 'Cross' }),
      (error) => error.status === 409 && error.code === 'INVITATION_ORGANIZATION_CONFLICT',
    );

    // An invitation addressed to an existing profile without an auth link claims it instead of duplicating the email.
    const pendingEmail = `pending-${tag}@membership.test`;
    const pendingProfile = randomUUID();
    await db.query("insert into users(id,organization_id,email,name,auth_user_id) values($1,$2,$3,'Pending Profile',null)", [pendingProfile, ids.org, pendingEmail]);
    const claim = await createInvitation({ workspaceId: ids.workspace, email: pendingEmail, role: 'member', actorUserId: ids.manager });
    const claimed = await acceptInvitation({ token: claim.token, authUserId: randomUUID(), email: pendingEmail, name: 'Pending Profile' });
    assert.equal(claimed.userId, pendingProfile);
    assert.ok((await db.query('select auth_user_id from users where id=$1', [pendingProfile])).rows[0].auth_user_id);

    // An email already linked to a different auth account cannot be claimed by another identity.
    const linkedEmail = `linked-${tag}@membership.test`;
    await db.query('insert into users(id,organization_id,email,name,auth_user_id) values($1,$2,$3,$4,$5)', [randomUUID(), ids.org, linkedEmail, 'Linked Profile', randomUUID()]);
    const linkedInvite = await createInvitation({ workspaceId: ids.workspace, email: linkedEmail, role: 'member', actorUserId: ids.manager });
    await assert.rejects(
      acceptInvitation({ token: linkedInvite.token, authUserId: randomUUID(), email: linkedEmail, name: 'Linked Profile' }),
      (error) => error.status === 409 && error.code === 'INVITATION_ACCOUNT_CONFLICT',
    );

    // The last manager of a workspace can never be demoted or removed.
    await updateMemberRole({ workspaceId: ids.workspace, userId: ids.manager, role: 'member', actorUserId: ids.invitee });
    await assert.rejects(
      updateMemberRole({ workspaceId: ids.workspace, userId: accepted.userId, role: 'viewer', actorUserId: ids.manager }),
      (error) => error.status === 409 && error.code === 'LAST_MANAGER',
    );
    await assert.rejects(
      removeMember({ workspaceId: ids.workspace, userId: accepted.userId, actorUserId: ids.manager }),
      (error) => error.status === 409 && error.code === 'LAST_MANAGER',
    );

    // Cross-tenant member identifiers do not resolve inside another workspace.
    await assert.rejects(
      removeMember({ workspaceId: ids.workspace, userId: ids.outsider, actorUserId: ids.manager }),
      (error) => error.status === 404 && error.code === 'MEMBER_NOT_FOUND',
    );

    // Removing a regular member revokes access and is audited.
    await removeMember({ workspaceId: ids.workspace, userId: ids.manager, actorUserId: ids.invitee });
    assert.deepEqual((await listMembers(ids.workspace)).map((row) => row.user_id).sort(), [accepted.userId, pendingProfile].sort());
    assert.equal((await db.query("select count(*)::int c from audit_events where workspace_id=$1 and event_type='member.removed'", [ids.workspace])).rows[0].c, 1);

    // Revoking a pending invitation makes its token unusable.
    const third = await createInvitation({ workspaceId: ids.workspace, email: `third-${tag}@membership.test`, role: 'member', actorUserId: accepted.userId });
    await revokeInvitation({ workspaceId: ids.workspace, invitationId: third.invitation.id, actorUserId: accepted.userId });
    await assert.rejects(
      acceptInvitation({ token: third.token, authUserId: randomUUID(), email: `third-${tag}@membership.test`, name: 'Third' }),
      (error) => error.status === 400 && error.code === 'INVALID_INVITATION',
    );
  } finally {
    try {
      await db.query('delete from organizations where id = any($1::uuid[])', [[ids.org, ids.org2]]);
    } catch {}
    await db.end();
  }
});
