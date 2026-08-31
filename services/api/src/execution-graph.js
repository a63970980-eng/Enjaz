import { randomUUID } from 'node:crypto';
import { query, withTransaction } from './db.js';
import { enqueueJob } from './job-queue.js';
import { validatePlan, nextRunnableSteps } from './employee-planner.js';

export async function materializePlan({workspaceId,employeeId,taskId,plan}){
 validatePlan(plan);
 return withTransaction(async client=>{
  const graphId=randomUUID();
  await client.query("insert into execution_graphs(id,workspace_id,task_id,employee_id,goal,status) values($1,$2,$3,$4,$5,'pending')",[graphId,workspaceId,taskId,employeeId,plan.goal]);
  for(const step of plan.steps) await client.query('insert into execution_steps(id,graph_id,step_key,intent,action,input,depends_on,status) values($1,$2,$3,$4,$5,$6::jsonb,$7,$8)',[randomUUID(),graphId,step.id,step.intent,step.action,JSON.stringify(step.input||{}),step.dependsOn||[],step.dependsOn?.length?'pending':'ready']);
  const ready=plan.steps.filter(s=>!s.dependsOn?.length),jobs=[];
  for(const step of ready){const job=await enqueueJob({workspaceId,jobType:'employee.step',payload:{graphId,taskId,employeeId,step},maxAttempts:3,client});jobs.push(job);await client.query("update execution_steps set job_id=$1,status='running',updated_at=now() where graph_id=$2 and step_key=$3 and status='ready'",[job.id,graphId,step.id]);}
  await client.query("update execution_graphs set status='running',updated_at=now() where id=$1",[graphId]);return {graphId,taskId,employeeId,jobs,readyStepKeys:ready.map(s=>s.id)};
 });
}

export async function advanceGraph({graphId,completedStepKey}){
 return withTransaction(async client=>{
  const graph=(await client.query('select * from execution_graphs where id=$1 for update',[graphId])).rows[0];if(!graph)throw new Error('Execution graph not found');
  if(['succeeded','failed','cancelled'].includes(graph.status))return {graphId,ready:[],jobs:[],terminal:graph.status};
  const steps=(await client.query('select * from execution_steps where graph_id=$1 for update',[graphId])).rows;
  const completed=new Set(steps.filter(s=>s.status==='succeeded').map(s=>s.step_key));completed.add(completedStepKey);
  const ready=steps.filter(s=>s.status==='pending'&&(s.depends_on||[]).every(id=>completed.has(id)));const jobs=[];
  for(const step of ready){const job=await enqueueJob({workspaceId:graph.workspace_id,jobType:'employee.step',payload:{graphId,taskId:graph.task_id,employeeId:graph.employee_id,step:{id:step.step_key,intent:step.intent,action:step.action,input:step.input,dependsOn:step.depends_on}},maxAttempts:3,client});jobs.push(job);await client.query("update execution_steps set job_id=$1,status='running',updated_at=now() where id=$2 and status='pending'",[job.id,step.id]);}
  const hasFailure=steps.some(s=>s.status==='failed');
  if(hasFailure)await client.query("update execution_graphs set status='failed',updated_at=now() where id=$1",[graphId]);
  else {const remaining=steps.filter(s=>!['succeeded','cancelled'].includes(s.status)&&!ready.some(r=>r.id===s.id));if(remaining.length===0&&ready.length===0)await client.query("update execution_graphs set status='succeeded',updated_at=now() where id=$1",[graphId]);}
  return {graphId,ready:ready.map(s=>s.step_key),jobs,completed:[...completed]};
 });
}
export function getReadySteps(plan,completedIds){return nextRunnableSteps(plan,new Set(completedIds));}
