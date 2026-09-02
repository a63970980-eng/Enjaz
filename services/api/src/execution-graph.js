import { randomUUID } from 'node:crypto';
import { query, withTransaction } from './db.js';
import { enqueueJob } from './job-queue.js';
import { validatePlan, nextRunnableSteps } from './employee-planner.js';

export async function materializePlan({workspaceId,employeeId,taskId,plan}){
 validatePlan(plan);
 return withTransaction(async client=>{
  const owner=(await client.query("select t.id from tasks t join ai_employees e on e.id=t.employee_id and e.workspace_id=t.workspace_id where t.id=$1 and t.workspace_id=$2 and t.employee_id=$3 and e.status='active'",[taskId,workspaceId,employeeId])).rows[0];
  if(!owner)throw new Error('Task, employee, and workspace ownership mismatch');
  for(const step of plan.steps){
   if(step.employeeId&&step.employeeId!==employeeId)throw new Error('Workflow step employee must match the execution employee');
  }
  const graphId=randomUUID();
  await client.query("insert into execution_graphs(id,workspace_id,task_id,employee_id,goal,status) values($1,$2,$3,$4,$5,'pending')",[graphId,workspaceId,taskId,employeeId,plan.goal]);
  for(const step of plan.steps) await client.query('insert into execution_steps(id,graph_id,step_key,intent,action,input,depends_on,status) values($1,$2,$3,$4,$5,$6::jsonb,$7,$8)',[randomUUID(),graphId,step.id,step.intent,step.action,JSON.stringify(step.input||{}),step.dependsOn||[],step.dependsOn?.length?'pending':'ready']);
  const ready=plan.steps.filter(s=>!s.dependsOn?.length),jobs=[];
  for(const step of ready){const job=await enqueueJob({workspaceId,jobType:'employee.step',payload:{graphId,taskId,employeeId,step},maxAttempts:3,client,idempotencyKey:`${graphId}:${step.id}`});jobs.push(job);await client.query("update execution_steps set job_id=$1,status='running',updated_at=now() where graph_id=$2 and step_key=$3 and status='ready'",[job.id,graphId,step.id]);}
  await client.query("update execution_graphs set status='running',updated_at=now() where id=$1 and workspace_id=$2",[graphId,workspaceId]);return {graphId,taskId,employeeId,jobs,readyStepKeys:ready.map(s=>s.id)};
 });
}

export async function advanceGraph({graphId,completedStepKey}){
 return withTransaction(async client=>{
  const graph=(await client.query('select * from execution_graphs where id=$1 for update',[graphId])).rows[0];if(!graph)throw new Error('Execution graph not found');
  if(['succeeded','failed','cancelled'].includes(graph.status))return {graphId,ready:[],jobs:[],terminal:graph.status};
  const steps=(await client.query('select * from execution_steps where graph_id=$1 for update',[graphId])).rows;
  const completedStep=steps.find(s=>s.step_key===completedStepKey);
  if(!completedStep)throw new Error(`Execution step not found in graph: ${completedStepKey}`);
  if(!['running','succeeded'].includes(completedStep.status))throw new Error(`Execution step is not executable: ${completedStepKey}`);
  if(completedStep.status==='running')await client.query("update execution_steps set status='succeeded',updated_at=now() where id=$1 and graph_id=$2 and status='running'",[completedStep.id,graphId]);
  const refreshed=(await client.query('select * from execution_steps where graph_id=$1 for update',[graphId])).rows;
  const completed=new Set(refreshed.filter(s=>s.status==='succeeded').map(s=>s.step_key));
  const ready=refreshed.filter(s=>s.status==='pending'&&(s.depends_on||[]).every(id=>completed.has(id)));const jobs=[];
  for(const step of ready){const job=await enqueueJob({workspaceId:graph.workspace_id,jobType:'employee.step',payload:{graphId,taskId:graph.task_id,employeeId:graph.employee_id,step:{id:step.step_key,intent:step.intent,action:step.action,input:step.input,dependsOn:step.depends_on}},maxAttempts:3,client,idempotencyKey:`${graphId}:${step.step_key}`});jobs.push(job);await client.query("update execution_steps set job_id=$1,status='running',updated_at=now() where id=$2 and status='pending'",[job.id,step.id]);}
  const hasFailure=refreshed.some(s=>s.status==='failed');
  if(hasFailure)await client.query("update execution_graphs set status='failed',updated_at=now() where id=$1 and workspace_id=$2",[graphId,graph.workspace_id]);
  else {const remaining=refreshed.filter(s=>!['succeeded','cancelled'].includes(s.status)&&!ready.some(r=>r.id===s.id));if(remaining.length===0&&ready.length===0)await client.query("update execution_graphs set status='succeeded',updated_at=now() where id=$1 and workspace_id=$2",[graphId,graph.workspace_id]);}
  return {graphId,ready:ready.map(s=>s.step_key),jobs,completed:[...completed]};
 });
}
export function getReadySteps(plan,completedIds){return nextRunnableSteps(plan,new Set(completedIds));}
