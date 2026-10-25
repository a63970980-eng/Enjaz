import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';

/**
 * Tenant isolation for the identity core.
 *
 * `users`, `organizations`, `workspaces` and `workspace_members` used to carry
 * policies that were never enforced because RLS was disabled. These tests run as
 * the real `authenticated` role with JWT claims, exactly like PostgREST does.
 */

const url = process.env.DATABASE_URL;
const ASYNC_TESTS = { skip: !url };

async function asUser(client, authUserId) {
  await client.query('set role authenticated');
  await client.query("select set_config('request.jwt.claim.sub',$1,false)", [authUserId]);
}

test('two organizations cannot read each other through the identity tables', ASYNC_TESTS, async () => {
  const admin = new pg.Client({ connectionString: url, ssl: false });
  await admin.connect();
  const ids = {
    orgA: crypto.randomUUID(), orgB: crypto.randomUUID(),
    userA: crypto.randomUUID(), userB: crypto.randomUUID(),
    wsA: crypto.randomUUID(), wsB: crypto.randomUUID(),
  };
  const suffix = Date.now().toString(36);
  try {
    await admin.query('insert into organizations(id,name,slug) values($1,$2,$3),($4,$5,$6)', [
      ids.orgA, 'Tenant A', `tenant-a-${suffix}`, ids.orgB, 'Tenant B', `tenant-b-${suffix}`,
    ]);
    await admin.query('insert into workspaces(id,organization_id,name,slug) values($1,$2,$3,$4),($5,$6,$7,$8)', [
      ids.wsA, ids.orgA, 'Workspace A', `ws-a-${suffix}`, ids.wsB, ids.orgB, 'Workspace B', `ws-b-${suffix}`,
    ]);
    await admin.query('insert into users(id,organization_id,email,name,auth_user_id) values($1,$2,$3,$4,$5),($6,$7,$8,$9,$10)', [
      ids.userA, ids.orgA, `a-${suffix}@tenant.test`, 'User A', ids.userA,
      ids.userB, ids.orgB, `b-${suffix}@tenant.test`, 'User B', ids.userB,
    ]);
    await admin.query('insert into workspace_members(workspace_id,user_id,role) values($1,$2,$3),($4,$5,$3)', [
      ids.wsA, ids.userA, 'manager', ids.wsB, ids.userB,
    ]);

    await asUser(admin, ids.userA);
    assert.deepEqual((await admin.query('select id from organizations')).rows.map((row) => row.id), [ids.orgA]);
    assert.deepEqual((await admin.query('select id from workspaces')).rows.map((row) => row.id), [ids.wsA]);
    assert.deepEqual((await admin.query('select id from users')).rows.map((row) => row.id), [ids.userA]);
    assert.deepEqual((await admin.query('select workspace_id from workspace_members')).rows.map((row) => row.workspace_id), [ids.wsA]);
    assert.equal((await admin.query('select count(*)::int as n from users where id=$1', [ids.userB])).rows[0].n, 0);
    assert.equal((await admin.query('select count(*)::int as n from workspaces where id=$1', [ids.wsB])).rows[0].n, 0);

    // A manager of workspace A still cannot grant themselves access to tenant B.
    await assert.rejects(
      () => admin.query("insert into workspace_members(workspace_id,user_id,role) values($1,$2,'manager')", [ids.wsB, ids.userA]),
      /row-level security policy/i,
    );
    assert.equal((await admin.query("update organizations set name='hijacked' where id=$1", [ids.orgB])).rowCount, 0);
    assert.equal((await admin.query("update users set name='hijacked' where id=$1", [ids.userB])).rowCount, 0);

    await asUser(admin, ids.userB);
    assert.deepEqual((await admin.query('select id from organizations')).rows.map((row) => row.id), [ids.orgB]);
    assert.deepEqual((await admin.query('select id from workspaces')).rows.map((row) => row.id), [ids.wsB]);
    assert.deepEqual((await admin.query('select id from users')).rows.map((row) => row.id), [ids.userB]);
    assert.equal((await admin.query('select count(*)::int as n from users where id=$1', [ids.userA])).rows[0].n, 0);
  } finally {
    try {
      await admin.query('reset role');
      await admin.query('delete from organizations where id in ($1,$2)', [ids.orgA, ids.orgB]);
    } catch {}
    await admin.end();
  }
});

test('every workspace-scoped table enforces RLS with at least one policy', ASYNC_TESTS, async () => {
  const admin = new pg.Client({ connectionString: url, ssl: false });
  await admin.connect();
  try {
    const tables = (await admin.query(`
      select c.relname, c.relrowsecurity,
             (select count(*)::int from pg_policy p where p.polrelid = c.oid) as policies
        from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relkind = 'r'
         and exists (
           select 1 from information_schema.columns col
            where col.table_schema = 'public' and col.table_name = c.relname and col.column_name = 'workspace_id'
         )
       order by c.relname`)).rows;
    assert.ok(tables.length >= 20, `expected the tenant schema to be discovered, found ${tables.length} tables`);
    const unprotected = tables.filter((table) => !table.relrowsecurity || table.policies === 0).map((table) => table.relname);
    assert.deepEqual(unprotected, [], `tenant tables without enforced policies: ${unprotected.join(', ')}`);

    const identity = (await admin.query(`
      select relname, relrowsecurity from pg_class
       where relnamespace = 'public'::regnamespace and relname in ('users','organizations','workspaces','workspace_members')
       order by relname`)).rows;
    assert.deepEqual(identity.map((table) => [table.relname, table.relrowsecurity]), [
      ['organizations', true], ['users', true], ['workspace_members', true], ['workspaces', true],
    ]);
  } finally {
    await admin.end();
  }
});
