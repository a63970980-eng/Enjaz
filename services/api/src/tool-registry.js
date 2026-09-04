import { randomUUID } from 'node:crypto';
import { query, withTransaction } from './db.js';

const tools=new Map();
const HIGH_RISK_ACTIONS=new Set(['payment','delete_data','bulk_message','financial_change','purchase']);
export function registerTool(tool){if(!tool?.name||typeof tool.execute!=='function')throw new Error('Invalid tool');tools.set(tool.name,tool);}
export function getTool(name){return tools.get(name);}
export function listTools(){return [...tools.values()].map(({name,description,risk})=>({name,description,risk}));}
export function isToolAllowed(employee,name){return Array.isArray(employee.tools)&&employee.tools.some(t=>typeof t==='string'?t===name:t?.name===name);}
export function needsApproval(name){return HIGH_RISK_ACTIONS.has(name)||getTool(name)?.risk==='high';}
export async function executeTool({employee,name,input,context={},approved=false}){const tool=getTool(name);if(!tool)throw new Error(`Unknown tool: ${name}`);if(!isToolAllowed(employee,name))throw new Error(`Tool not allowed for employee: ${name}`);if(needsApproval(name)&&!approved)throw new Error(`Human approval required for high-risk tool: ${name}`);return tool.execute({employee,input,context,approved});}

registerTool({name:'data.analyze',description:'Analyze structured business data without external side effects.',risk:'low',execute:async({input,context})=>({type:'analysis',input,context,summary:'Structured analysis completed by the ENJAZ tool runtime.'})});
registerTool({name:'report.create',description:'Create an in-memory report result.',risk:'low',execute:async({input,context})=>({type:'report',title:input?.title||'ENJAZ Report',content:input?.content||'',context})});
registerTool({name:'task.comment',description:'Add a persistent work note to the current task for the company record.',risk:'low',execute:async({input,context})=>{
 const workspaceId=context.workspaceId,taskId=context.taskId,employeeId=context.employeeId;
 if(!workspaceId||!taskId||!employeeId)throw new Error('Task comment requires execution context');
 const body=String(input?.body||input?.comment||'').trim();if(!body)throw new Error('Task comment body is required');
 const row=(await query('insert into task_comments(id,workspace_id,task_id,employee_id,body) values($1,$2,$3,$4,$5) returning id,body,created_at',[randomUUID(),workspaceId,taskId,employeeId,body])).rows[0];
 return {type:'task_comment',comment:row};
}});
registerTool({name:'task.handoff',description:'Hand off the current task to another digital employee in the same workspace.',risk:'low',execute:async({input,context})=>{
 const workspaceId=context.workspaceId,taskId=context.taskId,fromEmployeeId=context.employeeId,toEmployeeId=String(input?.toEmployeeId||input?.employeeId||'').trim();
 if(!workspaceId||!taskId||!fromEmployeeId||!toEmployeeId)throw new Error('Task handoff requires source, target, workspace and task');
 if(fromEmployeeId===toEmployeeId)throw new Error('Handoff requires two different employees');
 const reason=String(input?.reason||'Follow-up work is better handled by the receiving employee.').trim();
 const payload=input?.context&&typeof input.context==='object'?input.context:{};
 const childTaskId=randomUUID();const childTitle=String(input?.title||`متابعة: ${reason}`).trim();const childObjective=String(input?.objective||input?.goal||reason).trim();
 return withTransaction(async client=>{
  const target=(await client.query("select id,name,role from ai_employees where id=$1 and workspace_id=$2 and status='active'",[toEmployeeId,workspaceId])).rows[0];if(!target)throw new Error('Target employee is not active in this workspace');
  await client.query('insert into tasks(id,workspace_id,employee_id,title,objective,priority,parent_task_id,assigned_by_employee_id) values($1,$2,$3,$4,$5,$6,$7,$8)',[childTaskId,workspaceId,toEmployeeId,childTitle,childObjective,Number(input?.priority)||5,taskId,fromEmployeeId]);
  const handoff=(await client.query(`insert into task_delegations(id,workspace_id,parent_task_id,child_task_id,from_employee_id,to_employee_id,reason,status,context) values($1,$2,$3,$4,$5,$6,$7,'accepted',$8::jsonb) returning id,parent_task_id,child_task_id,to_employee_id,status,created_at`,[randomUUID(),workspaceId,taskId,childTaskId,fromEmployeeId,toEmployeeId,reason,JSON.stringify(payload)])).rows[0];
  await client.query(`insert into employee_handoffs(id,workspace_id,from_employee_id,to_employee_id,task_id,reason,payload,status) values($1,$2,$3,$4,$5,$6,$7::jsonb,'pending')`,[randomUUID(),workspaceId,fromEmployeeId,toEmployeeId,taskId,reason,JSON.stringify({childTaskId,...payload})]);
  return {type:'task_handoff',handoff,childTask:{id:childTaskId,employeeId:toEmployeeId,title:childTitle,objective:childObjective}};
 });
}});
