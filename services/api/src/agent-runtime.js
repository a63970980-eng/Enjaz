import { randomUUID } from 'node:crypto';
import { query } from './db.js';
import { getTool, executeTool, needsApproval as toolNeedsApproval } from './tool-registry.js';

const HIGH_RISK=new Set(['payment','delete_data','bulk_message','financial_change','purchase']);
export function needsApproval(action){return HIGH_RISK.has(action)||Boolean(getTool(action)?.risk==='high')||toolNeedsApproval(action);}
async function audit(workspaceId,taskId,employeeId,eventType,action,metadata={}){await query('insert into audit_events (id,workspace_id,task_id,employee_id,event_type,actor_type,action,metadata) values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)',[randomUUID(),workspaceId,taskId,employeeId,eventType,'ai_employee',action,JSON.stringify(metadata)]);}
async function loadEmployee(workspaceId,employeeId){const r=await query("select * from ai_employees where id=$1 and workspace_id=$2 and status='active'",[employeeId,workspaceId]);return r.rows[0]||null;}
export async function runEmployeeTask({workspaceId,taskId,employeeId,action='data.analyze',input={}}){
 const employee=await loadEmployee(workspaceId,employeeId);if(!employee)throw new Error('Active AI employee not found in this workspace');
 const task=(await query('select * from tasks where id=$1 and workspace_id=$2 and employee_id=$3',[taskId,workspaceId,employeeId])).rows[0];if(!task)throw new Error('Task not found for this employee and workspace');
 if(['completed','cancelled','failed'].includes(task.status))throw new Error(`Task cannot be executed from status: ${task.status}`);
 const tool=getTool(action);if(!tool)throw new Error(`Unknown tool: ${action}`);
 if(!Array.isArray(employee.tools)||!employee.tools.some(t=>typeof t==='string'?t===action:t?.name===action))throw new Error(`Tool not assigned to employee: ${action}`);
 const approvalRequired=needsApproval(action);await query('update tasks set status=$1,started_at=coalesce(started_at,now()) where id=$2',[approvalRequired?'awaiting_approval':'executing',taskId]);
 await audit(workspaceId,taskId,employeeId,'task.execution_started',action,{input,approvalRequired});
 if(approvalRequired){const existing=(await query("select * from approvals where task_id=$1 and workspace_id=$2 and status='pending' order by created_at desc limit 1",[taskId,workspaceId])).rows[0];if(existing)return {status:'awaiting_approval',approval:existing};const approval=(await query('insert into approvals (id,workspace_id,task_id,action,reason,payload) values ($1,$2,$3,$4,$5,$6::jsonb) returning *',[randomUUID(),workspaceId,taskId,action,'Human approval is required before this action can execute.',JSON.stringify({input})])).rows[0];await audit(workspaceId,taskId,employeeId,'approval.requested',action,{approvalId:approval.id});return {status:'awaiting_approval',approval};}
 const output=await executeTool({employee,name:action,input});await query('update tasks set status=$1,output=$2::jsonb,completed_at=now() where id=$3',['completed',JSON.stringify(output),taskId]);await audit(workspaceId,taskId,employeeId,'task.completed',action,{output});return {status:'completed',output};
}
export async function executeApprovedTask({workspaceId,approvalId,actorUserId}){
 const approval=(await query("select a.*,t.employee_id,t.status as task_status from approvals a join tasks t on t.id=a.task_id where a.id=$1 and a.workspace_id=$2 and a.status='approved'",[approvalId,workspaceId])).rows[0];if(!approval)throw new Error('Approved approval not found');if(['completed','cancelled','failed'].includes(approval.task_status))throw new Error('Task is no longer executable');
 const employee=await loadEmployee(workspaceId,approval.employee_id);if(!employee)throw new Error('Active AI employee not found');if(!Array.isArray(employee.tools)||!employee.tools.some(t=>typeof t==='string'?t===approval.action:t?.name===approval.action))throw new Error(`Tool not assigned to employee: ${approval.action}`);
 const result=await executeTool({employee,name:approval.action,input:approval.payload?.input||{}});await query('update tasks set status=$1,output=$2::jsonb,completed_at=now() where id=$3',['completed',JSON.stringify(result),approval.task_id]);await audit(workspaceId,approval.task_id,approval.employee_id,'approval.executed',approval.action,{approvalId,actorUserId,result});return {status:'completed',result};
}
