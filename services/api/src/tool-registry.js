import { randomUUID } from 'node:crypto';
import { query, withTransaction } from './db.js';
import { ToolCallSchema, parseContract } from './contracts.js';

const tools=new Map();
const HIGH_RISK_ACTIONS=new Set(['payment','delete_data','bulk_message','financial_change','purchase']);
export function registerTool(tool){if(!tool?.name||typeof tool.execute!=='function')throw new Error('Invalid tool');tools.set(tool.name,tool);}
export function getTool(name){return tools.get(name);}
export function listTools(){return [...tools.values()].map(({name,description,risk})=>({name,description,risk}));}
export function isToolAllowed(employee,name){return Array.isArray(employee.tools)&&employee.tools.some(t=>typeof t==='string'?t===name:t?.name===name);}
export function needsApproval(name){return HIGH_RISK_ACTIONS.has(name)||getTool(name)?.risk==='high';}
export async function executeTool({employee,name,input={},context={},approved=false}){
 const call=parseContract(ToolCallSchema,{tool:name,input,approved},'tool call');
 const tool=getTool(call.tool);if(!tool)throw new Error(`Unknown tool: ${call.tool}`);
 if(!isToolAllowed(employee,call.tool))throw new Error(`Tool not allowed for employee: ${call.tool}`);
 if(needsApproval(call.tool)&&!call.approved)throw new Error(`Human approval required for high-risk tool: ${call.tool}`);
 return tool.execute({employee,input:call.input,context,approved:call.approved});
}

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

registerTool({name:'finance.read',description:'Read-only financial snapshot from the workspace commerce ledger.',risk:'low',execute:async({input,context})=>{
 const days=Math.min(365,Math.max(1,Number(input?.days)||30));
 const row=(await query("select count(*)::int as transactions,coalesce(sum(total),0)::numeric as revenue,coalesce(sum(discount),0)::numeric as discounts,coalesce(avg(total),0)::numeric as average_transaction,count(*) filter(where payment_status='paid')::int as paid_transactions,count(*) filter(where payment_status='pending')::int as pending_transactions from commerce_orders where workspace_id=$1 and ordered_at >= now()-($2::text||' days')::interval",[context.workspaceId,String(days)])).rows[0];
 return {type:'finance_snapshot',days,metrics:row,scope:'commerce_orders',note:'This is a read-only operational sales snapshot; a full general-ledger accounting module is not present in the current schema.'};
}});
registerTool({name:'knowledge',description:'Read the employee knowledge base.',risk:'low',execute:async({input,context})=>{
 const limit=Math.min(50,Math.max(1,Number(input?.limit)||20));
 const rows=(await query('select id,title,content,source,metadata,updated_at from employee_knowledge where workspace_id=$1 and employee_id=$2 order by updated_at desc limit $3',[context.workspaceId,context.employeeId,limit])).rows;
 return {type:'knowledge',items:rows};
}});
registerTool({name:'analytics',description:'Analyze workspace data without external side effects.',risk:'low',execute:async({input,context})=>({type:'analysis',input,context,summary:'Structured analysis completed by the ENJAZ analytics tool.'})});
registerTool({name:'reports',description:'Create an in-memory business report.',risk:'low',execute:async({input,context})=>({type:'report',title:input?.title||'ENJAZ Report',content:input?.content||'',context})});
registerTool({name:'approvals',description:'Read pending approvals in the current workspace.',risk:'low',execute:async({input,context})=>{
 const limit=Math.min(50,Math.max(1,Number(input?.limit)||20));
 const rows=(await query("select id,task_id,action,reason,status,created_at from approvals where workspace_id=$1 and status='pending' order by created_at desc limit $2",[context.workspaceId,limit])).rows;
 return {type:'approvals',items:rows};
}});
registerTool({name:'approval.request',description:'Create a human approval request for the current task.',risk:'high',execute:async({input,context})=>{
 if(!context.workspaceId||!context.taskId)throw new Error('Approval request requires task context');
 const action=String(input?.action||'review').trim();
 const reason=String(input?.reason||'Human approval requested by digital employee.').trim();
 const payload=input?.payload&&typeof input.payload==='object'?input.payload:{};
 const row=(await query('insert into approvals(id,workspace_id,task_id,action,reason,payload) values($1,$2,$3,$4,$5,$6::jsonb) returning *',[randomUUID(),context.workspaceId,context.taskId,action,reason,JSON.stringify(payload)])).rows[0];
 return {type:'approval_request',approval:row};
}});
registerTool({name:'crm',description:'Read customer records from the workspace commerce customer store.',risk:'low',execute:async({input,context})=>{
 const term=String(input?.query||'').trim();
 const rows=term
  ? (await query('select id,name,email,phone,orders_count,lifetime_value,last_order_at from commerce_customers where workspace_id=$1 and (name ilike $2 or email ilike $2 or phone ilike $2) order by updated_at desc limit 20',[context.workspaceId,'%'+term+'%'])).rows
  : (await query('select id,name,email,phone,orders_count,lifetime_value,last_order_at from commerce_customers where workspace_id=$1 order by updated_at desc limit 20',[context.workspaceId])).rows;
 return {type:'crm_customers',customers:rows};
}});
registerTool({name:'tasks',description:'Read current workspace tasks.',risk:'low',execute:async({input,context})=>{
 const limit=Math.min(50,Math.max(1,Number(input?.limit)||20));
 const rows=(await query('select id,title,objective,status,priority,employee_id,created_at,completed_at from tasks where workspace_id=$1 order by created_at desc limit $2',[context.workspaceId,limit])).rows;
 return {type:'tasks',items:rows};
}});
registerTool({name:'task.manage',description:'Read the current task or append a work note; it does not mutate task state.',risk:'low',execute:async({input,context})=>{
 if(String(input?.operation||'read')==='comment'){
  const body=String(input?.body||'').trim();if(!body)throw new Error('Task comment body is required');
  const row=(await query('insert into task_comments(id,workspace_id,task_id,employee_id,body) values($1,$2,$3,$4,$5) returning id,body,created_at',[randomUUID(),context.workspaceId,context.taskId,context.employeeId,body])).rows[0];
  return {type:'task_comment',comment:row};
 }
 const row=(await query('select id,title,objective,status,priority,employee_id,input,output from tasks where id=$1 and workspace_id=$2',[context.taskId,context.workspaceId])).rows[0];
 return {type:'task',task:row||null};
}});
registerTool({name:'workflow.run',description:'Queue an existing workflow for execution.',risk:'high',execute:async({input,context})=>{
 const workflowId=String(input?.workflowId||'').trim();if(!workflowId)throw new Error('workflowId is required');
 const job=await enqueueJob({workspaceId:context.workspaceId,jobType:'workflow.run',payload:{workflowId},maxAttempts:3,idempotencyKey:'workflow:'+workflowId+':'+context.taskId});
 return {type:'workflow_queued',workflowId,jobId:job.id};
}});
