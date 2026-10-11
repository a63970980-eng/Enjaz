import { randomUUID } from 'node:crypto';
import { query } from './db.js';
import { runEmployeeTask } from './agent-runtime.js';

const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));

export function normalizeWorkflowSteps(steps){
 if(!Array.isArray(steps)||steps.length===0)throw new Error('Workflow requires at least one step');
 const normalized=steps.map((step,index)=>{
  if(!step||typeof step!=='object'||Array.isArray(step))throw new Error(`Workflow step ${index+1} must be an object`);
  const id=typeof step.id==='string'&&step.id.trim()?step.id.trim():randomUUID();
  const employeeId=typeof step.employeeId==='string'?step.employeeId.trim():'';
  const action=typeof step.action==='string'&&step.action.trim()?step.action.trim():'data.analyze';
  const input=step.input===undefined?{}:step.input;
  const dependencies=step.depends_on===undefined?[]:step.depends_on;
  if(!employeeId)throw new Error(`Workflow step ${index+1} requires employeeId`);
  if(action.length>128||!/^[a-z][a-z0-9_.-]*$/.test(action))throw new Error(`Workflow step ${index+1} has an invalid action`);
  if(!input||typeof input!=='object'||Array.isArray(input))throw new Error(`Workflow step ${index+1} input must be an object`);
  if(!Array.isArray(dependencies)||dependencies.some(dep=>typeof dep!=='string'||!dep.trim()))throw new Error(`Workflow step ${index+1} dependencies must be an array of step IDs`);
  if(new Set(dependencies).size!==dependencies.length)throw new Error(`Workflow step ${index+1} contains duplicate dependencies`);
  if(dependencies.includes(id))throw new Error(`Workflow step ${index+1} cannot depend on itself`);
  return {id,order:index+1,employeeId,action,input,depends_on:dependencies.map(dep=>dep.trim())};
 });
 const positions=new Map();
 for(let i=0;i<normalized.length;i++){
  const step=normalized[i];
  if(positions.has(step.id))throw new Error(`Duplicate workflow step ID: ${step.id}`);
  positions.set(step.id,i);
 }
 for(let i=0;i<normalized.length;i++){
  for(const dependency of normalized[i].depends_on){
   const dependencyIndex=positions.get(dependency);
   if(dependencyIndex===undefined)throw new Error(`Workflow step ${normalized[i].id} references unknown dependency: ${dependency}`);
   if(dependencyIndex>=i)throw new Error(`Workflow dependency ${dependency} must appear before step ${normalized[i].id}`);
  }
 }
 return normalized;
}

export async function createWorkflow({workspaceId,name,steps=[]}){
 const workflowName=typeof name==='string'?name.trim():'';
 if(!workflowName)throw new Error('Workflow requires a name and at least one step');
 if(workflowName.length>200)throw new Error('Workflow name must be 200 characters or fewer');
 const normalized=normalizeWorkflowSteps(steps);
 const id=randomUUID();
 await query(`insert into workflows (id,workspace_id,name,steps,status) values ($1,$2,$3,$4::jsonb,'draft')`,[id,workspaceId,workflowName,JSON.stringify(normalized)]);
 return (await query('select * from workflows where id=$1 and workspace_id=$2',[id,workspaceId])).rows[0];
}

export async function runWorkflow({workspaceId,workflowId,maxRetries=2,timeoutMs=120000}){
 const workflow=(await query('select * from workflows where id=$1 and workspace_id=$2',[workflowId,workspaceId])).rows[0];
 if(!workflow)throw new Error('Workflow not found');
 await query("update workflows set status='running',updated_at=now() where id=$1 and workspace_id=$2",[workflowId,workspaceId]);
 const results=[],completed=new Set();
 try{
  for(const step of workflow.steps){
   for(const dep of step.depends_on||[])if(!completed.has(dep))throw new Error(`Workflow dependency not completed: ${dep}`);
   const employee=(await query("select id from ai_employees where id=$1 and workspace_id=$2 and status='active'",[step.employeeId,workspaceId])).rows[0];
   if(!employee)throw new Error(`Workflow employee not found or inactive: ${step.employeeId}`);
   const task=(await query('insert into tasks (id,workspace_id,employee_id,title,objective,input) values ($1,$2,$3,$4,$5,$6::jsonb) returning *',[randomUUID(),workspaceId,step.employeeId,`${workflow.name} — step ${step.order}`,'Execute workflow step',JSON.stringify(step.input)])).rows[0];
   let attempt=0,result;
   while(true){
    attempt++;
    try{
     result=await Promise.race([runEmployeeTask({workspaceId,taskId:task.id,employeeId:step.employeeId,action:step.action,input:step.input}),new Promise((_,reject)=>setTimeout(()=>reject(new Error('Workflow step timeout')),timeoutMs))]);
     break;
    }catch(error){if(attempt>maxRetries)throw error;await delay(Math.min(1000*2**(attempt-1),10000));}
   }
   results.push({step:step.order,taskId:task.id,attempts:attempt,result});
   if(result.status==='awaiting_approval'){
    await query("update workflows set status='awaiting_approval',last_run=$2::jsonb,updated_at=now() where id=$1 and workspace_id=$3",[workflowId,JSON.stringify(results),workspaceId]);
    return {status:'awaiting_approval',results};
   }
   completed.add(step.id);
  }
  await query("update workflows set status='completed',last_run=$2::jsonb,updated_at=now() where id=$1 and workspace_id=$3",[workflowId,JSON.stringify(results),workspaceId]);
  return {status:'completed',results};
 }catch(error){
  await query("update workflows set status='failed',last_run=$2::jsonb,updated_at=now() where id=$1 and workspace_id=$3",[workflowId,JSON.stringify({error:error.message,results}),workspaceId]);
  throw error;
 }
}
