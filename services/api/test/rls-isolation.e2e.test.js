import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import pg from 'pg';

const url=process.env.DATABASE_URL;
test('real workspace RLS isolates two authenticated users for reads and writes', {skip:!url}, async()=>{
 const admin=new pg.Client({connectionString:url,ssl:false}); await admin.connect();
 const suffix=Date.now().toString(36); const u1=randomUUID(),u2=randomUUID(),o=randomUUID(),w1=randomUUID(),w2=randomUUID(),e1=randomUUID(),e2=randomUUID(),t1=randomUUID(),t2=randomUUID();
 try{
  await admin.query('begin');
  await admin.query('insert into organizations(id,name,slug) values($1,$2,$3)',[o,'RLS E2E Org',`rls-${suffix}`]);
  await admin.query('insert into workspaces(id,organization_id,name,slug) values($1,$2,$3,$4),($5,$2,$6,$7)',[w1,o,'Workspace A',`a-${suffix}`,w2,'Workspace B',`b-${suffix}`]);
  await admin.query('insert into users(id,organization_id,email,name,auth_user_id) values($1,$2,$3,$4,$1),($5,$2,$6,$7,$5)',[u1,o,`a-${suffix}@e2e.test`,'User A',u2,`b-${suffix}@e2e.test`,'User B']);
  await admin.query('insert into workspace_members(workspace_id,user_id,role) values($1,$2,$3),($4,$5,$3)',[w1,u1,'manager',w2,u2,'manager']);
  await admin.query("insert into ai_employees(id,workspace_id,name,role,status) values($1,$2,$3,$4,'active'),($5,$6,$7,$4,'active')",[e1,w1,'Employee A','operator',e2,w2,'Employee B']);
  await admin.query('insert into tasks(id,workspace_id,employee_id,title,objective) values($1,$2,$3,$4,$5),($6,$7,$8,$9,$10)',[t1,w1,e1,'Task A','A objective',t2,w2,e2,'Task B','B objective']);
  await admin.query('commit');

  await admin.query('set role authenticated');
  await admin.query("select set_config('request.jwt.claim.sub',$1,false)",[u1]);
  assert.deepEqual((await admin.query('select id from ai_employees order by name')).rows.map(r=>r.id),[e1]);
  assert.deepEqual((await admin.query('select id from tasks order by title')).rows.map(r=>r.id),[t1]);
  await assert.rejects(admin.query("insert into ai_employees(id,workspace_id,name,role,status) values($1,$2,$3,$4,'active')",[randomUUID(),w2,'Cross tenant','operator']),/new row violates row-level security policy/i);
  await assert.rejects(admin.query("update tasks set title='Cross tenant update' where id=$1",[t2]),/UPDATE.*row-level security|new row violates row-level security/i);

  await admin.query("select set_config('request.jwt.claim.sub',$1,false)",[u2]);
  assert.deepEqual((await admin.query('select id from ai_employees order by name')).rows.map(r=>r.id),[e2]);
  assert.deepEqual((await admin.query('select id from tasks order by title')).rows.map(r=>r.id),[t2]);
  await assert.rejects(admin.query("insert into ai_employees(id,workspace_id,name,role,status) values($1,$2,$3,$4,'active')",[randomUUID(),w1,'Cross tenant','operator']),/new row violates row-level security policy/i);
 } finally { try{await admin.query('reset role');await admin.query('begin');await admin.query('delete from organizations where id=$1',[o]);await admin.query('commit');}catch{} await admin.end(); }
});
