import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';

const url=process.env.DATABASE_URL;
test('real workspace RLS isolates two authenticated users', {skip:!url}, async()=>{
 const admin=new pg.Client({connectionString:url,ssl:false}); await admin.connect();
 const suffix=Date.now().toString(36); const u1=crypto.randomUUID(),u2=crypto.randomUUID(),o=crypto.randomUUID(),w1=crypto.randomUUID(),w2=crypto.randomUUID(),e1=crypto.randomUUID(),e2=crypto.randomUUID();
 try{
  await admin.query('begin');
  await admin.query('insert into organizations(id,name,slug) values($1,$2,$3)',[o,'RLS E2E Org',`rls-${suffix}`]);
  await admin.query('insert into workspaces(id,organization_id,name,slug) values($1,$2,$3,$4),($5,$2,$6,$7)',[w1,o,'Workspace A',`a-${suffix}`,w2,'Workspace B',`b-${suffix}`]);
  await admin.query('insert into users(id,organization_id,email,name,auth_user_id) values($1,$2,$3,$4,$1),($5,$2,$6,$7,$5)',[u1,o,`a-${suffix}@e2e.test`,'User A',u2,`b-${suffix}@e2e.test`,'User B']);
  await admin.query('insert into workspace_members(workspace_id,user_id,role) values($1,$2,$3),($4,$5,$3)',[w1,u1,'manager',w2,u2]);
  await admin.query('insert into ai_employees(id,workspace_id,name,role,status) values($1,$2,$3,$4,\'active\'),($5,$6,$7,$4,\'active\')',[e1,w1,'Employee A','operator',e2,w2,'Employee B']);
  await admin.query('commit');
  await admin.query('set role authenticated');
  await admin.query("select set_config('request.jwt.claim.sub',$1,false)",[u1]);
  const own=(await admin.query('select id from ai_employees order by name')).rows.map(r=>r.id);
  assert.deepEqual(own,[e1]);
  const denied=(await admin.query('insert into ai_employees(id,workspace_id,name,role,status) values($1,$2,$3,$4,\'active\') returning id',[crypto.randomUUID(),w2,'Cross tenant','operator'])).rows;
  assert.equal(denied.length,0);
 } finally { try{await admin.query('reset role');await admin.query('begin');await admin.query('delete from organizations where id=$1',[o]);await admin.query('commit');}catch{} await admin.end(); }
});
