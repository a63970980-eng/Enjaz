import { randomUUID } from 'node:crypto';
import { query } from './db.js';

export async function createEmployee(input) {
  const id=randomUUID();
  const r=await query(`insert into ai_employees (id,workspace_id,name,role,goal,skills,tools,permissions,memory_config,model,budget_cents,schedule,status) values ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8::jsonb,$9::jsonb,$10,$11,$12::jsonb,$13) returning *`,[id,input.workspaceId,input.name,input.role,input.goal||'',JSON.stringify(input.skills||[]),JSON.stringify(input.tools||[]),JSON.stringify(input.permissions||[]),JSON.stringify(input.memory||{}),input.model||'default',input.budgetCents||0,JSON.stringify(input.schedule||{}),input.status||'active']);
  return r.rows[0];
}
export async function listEmployees(workspaceId){return (await query('select * from ai_employees where workspace_id=$1 order by created_at desc',[workspaceId])).rows;}
export async function createTask(input){
  const employee=await query('select id from ai_employees where id=$1 and workspace_id=$2',[input.employeeId,input.workspaceId]);
  if(!employee.rowCount) throw new Error('Employee does not belong to this workspace');
  return (await query(`insert into tasks (id,workspace_id,employee_id,title,objective,priority) values ($1,$2,$3,$4,$5,$6) returning *`,[randomUUID(),input.workspaceId,input.employeeId,input.title,input.objective,input.priority||5])).rows[0];
}
export async function listTasks(workspaceId){return (await query('select * from tasks where workspace_id=$1 order by created_at desc',[workspaceId])).rows;}
export async function createApproval(input){return (await query(`insert into approvals (id,workspace_id,task_id,action,reason,payload) values ($1,$2,$3,$4,$5,$6::jsonb) returning *`,[randomUUID(),input.workspaceId,input.taskId,input.action,input.reason||'',JSON.stringify(input.payload||{})])).rows[0];}
export async function decideApproval(id,workspaceId,status,userId=null){const r=await query(`update approvals set status=$1,decided_by=$2,decided_at=now() where id=$3 and workspace_id=$4 and status='pending' returning *`,[status,userId,id,workspaceId]);if(!r.rowCount) throw new Error('Pending approval not found');return r.rows[0];}
export async function listApprovals(workspaceId){return (await query('select * from approvals where workspace_id=$1 order by created_at desc',[workspaceId])).rows;}
export async function listAudit(workspaceId){return (await query('select * from audit_events where workspace_id=$1 order by created_at desc limit 500',[workspaceId])).rows;}
