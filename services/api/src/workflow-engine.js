import { randomUUID } from 'node:crypto';
import { query } from './db.js';
import { runEmployeeTask } from './agent-runtime.js';

export async function createWorkflow({workspaceId,name,steps=[]}){
 if(!name||!Array.isArray(steps)||steps.length===0) throw new Error('Workflow requires a name and at least one step');
 const id=randomUUID();
 const normalized=steps.map((s,i)=>({id:s.id||randomUUID(),order:i+1,employeeId:s.employeeId,action:s.action||'data.analyze',input:s.input||{}}));
 await query(`insert into workflows (id,workspace_id,name,steps,status) values ($1,$2,$3,$4::jsonb,'draft')`,[id,workspaceId,name,JSON.stringify(normalized)]);
 return (await query('select * from workflows where id=$1',[id])).rows[0];
}

export async function runWorkflow({workspaceId,workflowId}){
 const workflow=(await query('select * from workflows where id=$1 and workspace_id=$2',[workflowId,workspaceId])).rows[0];
 if(!workflow) throw new Error('Workflow not found');
 await query("update workflows set status='running',updated_at=now() where id=$1",[workflowId]);
 const results=[];
 try{
  for(const step of workflow.steps){
   const task=(await query(`insert into tasks (id,workspace_id,employee_id,title,objective,input) values ($1,$2,$3,$4,$5,$6::jsonb) returning *`,[randomUUID(),workspaceId,step.employeeId,`${workflow.name} — step ${step.order}`,'Execute workflow step',JSON.stringify(step.input)])).rows[0];
   const result=await runEmployeeTask({workspaceId,taskId:task.id,employeeId:step.employeeId,action:step.action,input:step.input});
   results.push({step:step.order,taskId:task.id,result});
   if(result.status==='awaiting_approval'){await query('update workflows set status=\'awaiting_approval\',last_run=$2::jsonb,updated_at=now() where id=$1',[workflowId,JSON.stringify(results)]);return {status:'awaiting_approval',results};}
  }
  await query('update workflows set status=\'completed\',last_run=$2::jsonb,updated_at=now() where id=$1',[workflowId,JSON.stringify(results)]);
  return {status:'completed',results};
 }catch(error){await query('update workflows set status=\'failed\',last_run=$2::jsonb,updated_at=now() where id=$1',[workflowId,JSON.stringify({error:error.message,results})]);throw error;}
}
