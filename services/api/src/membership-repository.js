import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { query, withTransaction } from './db.js';

export const WORKSPACE_MEMBER_ROLES = Object.freeze(['viewer', 'member', 'manager']);
export const INVITATION_TTL_DAYS = 7;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function failure(message, status, code) {
  return Object.assign(new Error(message), { status, ...(code ? { code } : {}) });
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function assertEmail(value) {
  const email = normalizeEmail(value);
  if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    throw failure('A valid email address is required', 400, 'INVALID_EMAIL');
  }
  return email;
}

function assertMemberRole(value, fallback = null) {
  const role = String(value || fallback || '').trim().toLowerCase();
  if (!WORKSPACE_MEMBER_ROLES.includes(role)) {
    throw failure(`Role must be one of: ${WORKSPACE_MEMBER_ROLES.join(', ')}`, 400, 'INVALID_ROLE');
  }
  return role;
}

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function audit(client, workspaceId, actorUserId, eventType, action, metadata) {
  return client.query(
    `insert into audit_events (id, workspace_id, event_type, actor_type, action, metadata)
     values ($1, $2, $3, 'user', $4, $5::jsonb)`,
    [randomUUID(), workspaceId, eventType, action, JSON.stringify(metadata)],
  );
}

export async function listMembers(workspaceId) {
  const result = await query(
    `select wm.workspace_id, wm.user_id, wm.role, wm.created_at as joined_at,
            u.email, u.name, u.organization_id
       from workspace_members wm
       join users u on u.id = wm.user_id
      where wm.workspace_id = $1
      order by wm.created_at asc`,
    [workspaceId],
  );
  return result.rows;
}

export async function listInvitations(workspaceId) {
  // Never select token_hash: invitation tokens must not leave the API surface.
  const result = await query(
    `select id, workspace_id, email, role, status, expires_at, created_at,
            accepted_at, revoked_at, invited_by
       from workspace_invitations
      where workspace_id = $1
      order by created_at desc
      limit 200`,
    [workspaceId],
  );
  return result.rows;
}

export async function createInvitation({ workspaceId, email, role = 'member', actorUserId = null }) {
  const inviteEmail = assertEmail(email);
  const inviteRole = assertMemberRole(role, 'member');
  return withTransaction(async (client) => {
    const workspace = (await client.query(
      'select id, organization_id, name from workspaces where id = $1 for share',
      [workspaceId],
    )).rows[0];
    if (!workspace) throw failure('Workspace not found', 404, 'WORKSPACE_NOT_FOUND');

    const existingMember = await client.query(
      `select 1 from workspace_members wm
         join users u on u.id = wm.user_id
        where wm.workspace_id = $1 and lower(u.email) = $2
        limit 1`,
      [workspaceId, inviteEmail],
    );
    if (existingMember.rowCount) throw failure('This person is already a member of the workspace', 409, 'ALREADY_MEMBER');

    await client.query(
      `update workspace_invitations set status = 'expired', updated_at = now()
        where workspace_id = $1 and status = 'pending' and expires_at <= now()`,
      [workspaceId],
    );
    const pending = await client.query(
      `select 1 from workspace_invitations
        where workspace_id = $1 and lower(email) = $2 and status = 'pending'
        limit 1`,
      [workspaceId, inviteEmail],
    );
    if (pending.rowCount) throw failure('A pending invitation already exists for this email', 409, 'INVITATION_EXISTS');

    const token = randomBytes(32).toString('base64url');
    const invitation = (await client.query(
      `insert into workspace_invitations
         (id, workspace_id, organization_id, email, role, token_hash, invited_by, expires_at)
       values ($1, $2, $3, $4, $5, $6, $7, now() + ($8 || ' days')::interval)
       returning id, workspace_id, email, role, status, expires_at, invited_by, created_at`,
      [randomUUID(), workspaceId, workspace.organization_id, inviteEmail, inviteRole, hashToken(token), actorUserId, INVITATION_TTL_DAYS],
    )).rows[0];

    await audit(client, workspaceId, actorUserId, 'member.invited', 'invite', {
      invitationId: invitation.id,
      email: inviteEmail,
      role: inviteRole,
    });

    // The raw token is returned exactly once, to the inviter, for copy-only delivery.
    return { invitation, token, workspace: { id: workspace.id, name: workspace.name } };
  });
}

export async function revokeInvitation({ workspaceId, invitationId, actorUserId = null }) {
  return withTransaction(async (client) => {
    const invitation = (await client.query(
      `update workspace_invitations
          set status = 'revoked', revoked_at = now(), updated_at = now()
        where id = $1 and workspace_id = $2 and status = 'pending'
        returning id, email, role, status, revoked_at`,
      [invitationId, workspaceId],
    )).rows[0];
    if (!invitation) throw failure('Pending invitation not found', 404, 'INVITATION_NOT_FOUND');
    await audit(client, workspaceId, actorUserId, 'member.invitation_revoked', 'revoke', {
      invitationId: invitation.id,
      email: invitation.email,
    });
    return invitation;
  });
}

export async function acceptInvitation({ token, authUserId, email, name }) {
  const raw = String(token || '').trim();
  if (raw.length < 32) throw failure('Invitation token is invalid', 400, 'INVALID_INVITATION');
  const identityEmail = assertEmail(email);

  return withTransaction(async (client) => {
    const invitation = (await client.query(
      `select * from workspace_invitations where token_hash = $1 for update`,
      [hashToken(raw)],
    )).rows[0];
    if (!invitation || invitation.status !== 'pending') {
      throw failure('Invitation is invalid or no longer pending', 400, 'INVALID_INVITATION');
    }
    if (new Date(invitation.expires_at).getTime() <= Date.now()) {
      await client.query(
        `update workspace_invitations set status = 'expired', updated_at = now() where id = $1`,
        [invitation.id],
      );
      throw failure('Invitation has expired; ask a workspace manager for a new one', 400, 'INVITATION_EXPIRED');
    }
    if (normalizeEmail(invitation.email) !== identityEmail) {
      throw failure('This invitation was issued to a different email address', 403, 'INVITATION_EMAIL_MISMATCH');
    }

    let user = (await client.query(
      'select id, organization_id, email, name from users where auth_user_id = $1 limit 1',
      [authUserId],
    )).rows[0];

    if (user && user.organization_id !== invitation.organization_id) {
      // The platform currently models one organization per identity. Joining a
      // second organization would silently move the user's existing workspace
      // access, so it is refused until multi-organization identities exist.
      throw failure(
        'This account already belongs to a different organization; multi-organization membership is not enabled',
        409,
        'INVITATION_ORGANIZATION_CONFLICT',
      );
    }

    if (!user) {
      // A profile may already exist for this email in the organization without an
      // auth link (for example, a member added before they signed in). Link it to
      // the invited identity instead of violating the organization+email uniqueness.
      const existingProfile = (await client.query(
        `select id, organization_id, email, name, auth_user_id from users
          where organization_id = $1 and lower(email) = $2
          limit 1 for update`,
        [invitation.organization_id, identityEmail],
      )).rows[0];
      if (existingProfile) {
        if (existingProfile.auth_user_id && existingProfile.auth_user_id !== authUserId) {
          throw failure('This email is already linked to a different account in the organization', 409, 'INVITATION_ACCOUNT_CONFLICT');
        }
        user = (await client.query(
          `update users set auth_user_id = $2 where id = $1 returning id, organization_id, email, name`,
          [existingProfile.id, authUserId],
        )).rows[0];
      } else {
        user = (await client.query(
          `insert into users (id, auth_user_id, organization_id, email, name, role)
           values ($1, $2, $3, $4, $5, 'member')
           returning id, organization_id, email, name`,
          [randomUUID(), authUserId, invitation.organization_id, identityEmail, String(name || '').trim() || identityEmail.split('@')[0]],
        )).rows[0];
      }
    }

    await client.query(
      `insert into workspace_members (workspace_id, user_id, role)
       values ($1, $2, $3)
       on conflict (workspace_id, user_id) do nothing`,
      [invitation.workspace_id, user.id, invitation.role],
    );
    const membership = (await client.query(
      'select workspace_id, user_id, role from workspace_members where workspace_id = $1 and user_id = $2',
      [invitation.workspace_id, user.id],
    )).rows[0];

    await client.query(
      `update workspace_invitations
          set status = 'accepted', accepted_at = now(), accepted_by = $2, updated_at = now()
        where id = $1`,
      [invitation.id, user.id],
    );
    await audit(client, invitation.workspace_id, user.id, 'member.joined', 'invitation.accept', {
      invitationId: invitation.id,
      role: membership.role,
    });

    return {
      workspaceId: invitation.workspace_id,
      userId: user.id,
      role: membership.role,
      email: user.email,
      name: user.name,
    };
  });
}

export async function updateMemberRole({ workspaceId, userId, role, actorUserId = null }) {
  const nextRole = assertMemberRole(role);
  return withTransaction(async (client) => {
    const membership = (await client.query(
      'select workspace_id, user_id, role from workspace_members where workspace_id = $1 and user_id = $2 for update',
      [workspaceId, userId],
    )).rows[0];
    if (!membership) throw failure('Member not found in this workspace', 404, 'MEMBER_NOT_FOUND');
    if (membership.role === nextRole) return membership;

    if (membership.role === 'manager' && nextRole !== 'manager') {
      const managers = await client.query(
        `select count(*)::int as count from workspace_members
          where workspace_id = $1 and role = 'manager' and user_id <> $2`,
        [workspaceId, userId],
      );
      if (Number(managers.rows[0]?.count || 0) === 0) {
        throw failure('The workspace must keep at least one manager', 409, 'LAST_MANAGER');
      }
    }

    const updated = (await client.query(
      'update workspace_members set role = $3 where workspace_id = $1 and user_id = $2 returning workspace_id, user_id, role, created_at',
      [workspaceId, userId, nextRole],
    )).rows[0];
    await audit(client, workspaceId, actorUserId, 'member.role_updated', 'role.update', {
      targetUserId: userId,
      from: membership.role,
      to: nextRole,
    });
    return updated;
  });
}

export async function removeMember({ workspaceId, userId, actorUserId = null }) {
  return withTransaction(async (client) => {
    const membership = (await client.query(
      'select workspace_id, user_id, role from workspace_members where workspace_id = $1 and user_id = $2 for update',
      [workspaceId, userId],
    )).rows[0];
    if (!membership) throw failure('Member not found in this workspace', 404, 'MEMBER_NOT_FOUND');

    if (membership.role === 'manager') {
      const managers = await client.query(
        `select count(*)::int as count from workspace_members
          where workspace_id = $1 and role = 'manager' and user_id <> $2`,
        [workspaceId, userId],
      );
      if (Number(managers.rows[0]?.count || 0) === 0) {
        throw failure('The workspace must keep at least one manager', 409, 'LAST_MANAGER');
      }
    }

    await client.query(
      'delete from workspace_members where workspace_id = $1 and user_id = $2',
      [workspaceId, userId],
    );
    await audit(client, workspaceId, actorUserId, 'member.removed', 'remove', {
      targetUserId: userId,
      role: membership.role,
    });
    return { workspaceId, userId };
  });
}
