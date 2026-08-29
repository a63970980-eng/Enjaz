import { randomUUID } from 'node:crypto';
import { query } from './db.js';

const HIGH_RISK = new Set(['payment','delete_data','bulk_message','financial_change','purchase']);

export function needsApproval(action){ return HIGH_RISK.has(action); }

export async function runEmployeeTask({ workspaceId, taskId, employeeId, action='analyze', input={} }) {
  const employee=(await query('select * from ai_employees where id=$1 and workspace_id=$2 and status=\'active\'',[employeeId,workspaceId])).rows[0];
  if(!employee) throw new Error('Active AI employee not found in this workspace');
  const task=(await query('select * from tasks where id=$1 and workspace_id=$2 and employee_id=$3',[taskId,workspaceId,employeeId])).rows[0];
  if(!task) throw new Error('Task not found for this employee and workspace');

  await query('update tasks set status=$1,started_at=coalesce(started_at,now()) where id=$2',[needsApproval(action)?'awaiting_approval':'executing',taskId]);
  await query(`insert into audit_events (id,workspace_id,task_id,employee_id,event_type,actor_type,action,metadata) values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)`,[randomUUID(),workspaceId,taskId,employeeId,'task.execution_started','ai_employee',action,JSON.stringify({input})]);

  if(needsApproval(action)) {
    const approval=(await query(`insert into approvals (id,workspace_id,task_id,action,reason,payload) values ($1,$2,$3,$4,$5,$6::jsonb) returning *`,[randomUUID(),workspaceId,taskId,action,'This action requires human approval before execution.',JSON.stringify({input})])).rows[0];
    await query(`insert into audit_events (id,workspace_id,task_id,employee_id,event_type,actor_type,action,metadata) values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)`,[randomUUID(),workspaceId,taskId,employeeId,'approval.requested','ai_employee',action,JSON.stringify({approvalId:approval.id})]);
    return { status:'awaiting_approval', approval };
  }

  const output={type:'runtime_result', action, input, message:'Task entered the execution runtime. Tool execution will be attached to this step.'};
  await query('update tasks set status=$1,output=$2::jsonb,completed_at=now() where id=$3',['completed',JSON.stringify(output),taskId]);
  await query(`insert into audit_events (id,workspace_id,task_id,employee_id,event_type,actor_type,action,metadata) values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)`,[randomUUID(),workspaceId,taskId,employeeId,'task.completed','ai_employee',action,JSON.stringify({output})]);
  return {status:'completed',output};
}
