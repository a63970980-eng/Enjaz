import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { createEmployee, createTask, getWorkspaceAccess } from '../src/workforce-repository.js';
import { runEmployeeTask } from '../src/agent-runtime.js';

const url=process.env.DATABASE_URL;
test('E2E workforce flow keeps tenants isolated', {skip:!url}, async()=>{
 const admin=new pg.Client({connectionString:url,ssl:false});await admin.connect();
 const ids={org:crypto.randomUUID(),w1:crypto.randomUUID(),w2:crypto.randomUUID(),u1:crypto.randomUUID(),u2:crypto.randomUUID()};
 try{
  await admin.query('begin');
  await admin.query('insert into organizations(id,name,slug) values($1,$2,$3)',[ids.org,'E2E Org',`e2e-${Date.now()}`]);
  await admin.query('insert into workspaces(id,organization_id,name,slug) values($1,$2,$3,$4),($5,$2,$6,$7)',[ids.w1,ids.org,'A','e2ea',ids.w2,'B','e2eb']);
  await admin.query('insert into users(id,organization_id,email,name,auth_user_id) values($1,$2,$3,$4,$1),($5,$2,$6,$7,$5)',[ids.u1,ids.org,`a-${Date.now()}@e2e.test`,'A',ids.u2,`b-${Date.now()}@e2e.test`,'B']);
  await admin.query('insert into workspace_members(workspace_id,user_id,role) values($1,$2,$3),($4,$5,$3)',[ids.w1,ids.u1,'manager',ids.w2,ids.u2]);await admin.query('commit');
  const employee=await createEmployee({workspaceId:ids.w1,name:'E2E Agent',role:'operator',goal:'create reports',tools:['report.create'],budgetCents:1000});
  const task=await createTask({workspaceId:ids.w1,employeeId:employee.id,title:'E2E report',objective:'Create a report',priority:5});
  assert.ok(await getWorkspaceAccess(ids.w1,ids.u1));assert.equal(await getWorkspaceAccess(ids.w2,ids.u1),null);
  const result=await runEmployeeTask({workspaceId:ids.w1,taskId:task.id,employeeId:employee.id,action:'report.create',input:{title:'Report',content:'ok'}});
  assert.equal(result.status,'completed');assert.equal(result.output?.type,'report');
  await assert.rejects(()=>runEmployeeTask({workspaceId:ids.w2,taskId:task.id,employeeId:employee.id,action:'report.create',input:{}}));
 } finally {try{await admin.query('delete from organizations where id=$1',[ids.org]);}catch{}await admin.end();}
});
