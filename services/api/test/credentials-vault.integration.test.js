import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { saveConnection, listConnections, revokeConnection, getConnectionCredentials } from '../src/credentials-vault.js';

/**
 * Real database coverage for the encrypted integration vault.
 *
 * The previous contract-only test asserted the broken `display_name` insert, so a
 * schema mismatch reached production. These assertions exercise the actual columns,
 * the revocation status constraint and tenant isolation.
 */

process.env.ENJAZ_CREDENTIALS_KEY = process.env.ENJAZ_CREDENTIALS_KEY || Buffer.alloc(32, 7).toString('base64');

const url = process.env.DATABASE_URL;
const ASYNC_TESTS = { skip: !url };

async function seedWorkspace(admin, workspaceId) {
  const orgId = crypto.randomUUID();
  await admin.query('insert into organizations(id,name,slug) values($1,$2,$3)', [orgId, 'Vault Org', `vault-${workspaceId}`]);
  await admin.query('insert into workspaces(id,organization_id,name,slug) values($1,$2,$3,$4)', [workspaceId, orgId, 'Vault WS', `vault-ws-${workspaceId}`]);
  return orgId;
}

test('integration credentials are encrypted, tenant-scoped and revocable', ASYNC_TESTS, async () => {
  const admin = new pg.Client({ connectionString: url, ssl: false });
  await admin.connect();
  const workspaceId = crypto.randomUUID();
  const otherWorkspaceId = crypto.randomUUID();
  let orgId;
  let otherOrgId;
  try {
    orgId = await seedWorkspace(admin, workspaceId);
    otherOrgId = await seedWorkspace(admin, otherWorkspaceId);

    const saved = await saveConnection({
      workspaceId, provider: 'slack', name: 'Team Slack',
      credentials: { bot_token: 'xoxb-test-token' }, metadata: { region: 'eu' },
    });
    assert.equal(saved.display_name, 'Team Slack');
    assert.equal(saved.status, 'active');
    assert.equal(saved.encrypted_credentials, undefined, 'credentials never leave the server');

    const raw = await admin.query('select name,encrypted_credentials from integration_connections where id=$1', [saved.id]);
    assert.equal(raw.rows[0].name, 'Team Slack');
    assert.ok(!raw.rows[0].encrypted_credentials.includes('xoxb-test-token'), 'the stored value is ciphertext');

    const listed = await listConnections(workspaceId);
    assert.equal(listed.length, 1);
    assert.equal(listed[0].display_name, 'Team Slack');

    assert.deepEqual(await listConnections(otherWorkspaceId), [], 'another workspace cannot see the connection');
    await assert.rejects(() => getConnectionCredentials({ workspaceId: otherWorkspaceId, connectionId: saved.id }), /not found/i);

    const decrypted = await getConnectionCredentials({ workspaceId, connectionId: saved.id, provider: 'slack' });
    assert.deepEqual(decrypted.credentials, { bot_token: 'xoxb-test-token' });

    await assert.rejects(
      () => saveConnection({ workspaceId, provider: 'slack', name: 'Team Slack', credentials: { bot_token: 'other' } }),
      (error) => error.status === 409 && error.code === 'CONNECTION_NAME_TAKEN',
    );

    const revoked = await revokeConnection({ workspaceId, connectionId: saved.id });
    assert.equal(revoked.status, 'revoked');
    await assert.rejects(() => getConnectionCredentials({ workspaceId, connectionId: saved.id }), /not active/i);

    const afterRevoke = await listConnections(workspaceId);
    assert.equal(afterRevoke[0].status, 'revoked');

    const audit = await admin.query("select event_type from audit_events where workspace_id=$1 order by created_at", [workspaceId]);
    assert.deepEqual(audit.rows.map((row) => row.event_type), ['integration.created', 'integration.revoked']);
  } finally {
    if (orgId) await admin.query('delete from organizations where id=$1', [orgId]).catch(() => {});
    if (otherOrgId) await admin.query('delete from organizations where id=$1', [otherOrgId]).catch(() => {});
    await admin.end();
  }
});
