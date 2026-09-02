import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import pg from 'pg';

const url=process.env.DATABASE_URL;
test('tenant boundary rejects cross-workspace execution and approval access', {skip:!url}, async()=>{
  const db=new pg.Client({connectionString:url,ssl:false}); await db.connect();
  const ids={org:randomUUID(),w1:randomUUID(),w2:randomUUID(),u1:randomUUID(),u2:randomUUID(),e1:randomUUID(),t1:randomUUID(),a1:randomUUID()};
  try {
    await db.query('begin');
    await db.query('insert into organizations(id,name,slug) values($1,$2,$3)',[ids.org,'Boundary Org',`boundary-${Date.now()}`]);
    await db.query('insert into workspaces(id,organization_id,name,slug) values($1,$2,$3,$4),($5,$2,$6,$7)',[ids.w1,ids.org,'A',`a-${Date.now()}`,ids.w2,'B',`b-${Date.now()}`]);
    await db.query('insert into users(id,organization_id,email,name,auth_user_id) values($1,$2,$3,$4,$1),($5,$2,$6,$7,$5)',[ids.u1,ids.org,`a-${Date.now()}@test.local`,'A',ids.u2,`b-${Date.now()}@test.local`,'B']);
    await db.query('insert into workspace_members(workspace_id,user_id,role) values($1,$2,$3),($4,$5,$3)',[ids.w1,ids.u1,'manager',ids.w2,ids.u2,'manager']);
    await db.query('insert into ai_employees(id,workspace_id,name,role,status) values($1,$2,$3,$4,$5)',[ids.e1,ids.w1,'A','operator','active']);
    await db.query('insert into tasks(id,workspace_id,employee_id,title,objective) values($1,$2,$3,$4,$5)',[ids.t1,ids.w1,ids.e1,'Boundary','test']);
    await db.query('insert into approvals(id,workspace_id,task_id,action,reason,payload) values($1,$2,$3,$4,$5,$6::jsonb)',[ids.a1,ids.w1,ids.t1,'report.create','boundary',JSON.stringify({input:{}})]);
    await db.query('commit');
    await db.query('set role authenticated');
    await db.query("select set_config('request.jwt.claim.sub',$1,false)",[ids.u2]);
    assert.equal((await db.query('select count(*)::int count from tasks where id=$1',[ids.t1])).rows[0].count,0);
    assert.equal((await db.query('select count(*)::int count from approvals where id=$1',[ids.a1])).rows[0].count,0);
    await assert.rejects(db.query('update approvals set reason=$1 where id=$2',['cross-tenant',ids.a1]),/row-level security policy/i);
  } finally { try { await db.query('reset role'); await db.query('delete from organizations where id=$1',[ids.org]); } catch {} await db.end(); }
});
