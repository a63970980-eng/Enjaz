import { randomUUID } from 'node:crypto';
import { query } from './db.js';
import { claimJob, completeJob, blockJob, failJob, recoverStaleJobs, renewJobLease } from './job-queue.js';
import { heartbeat, markAttemptStarted, markAttemptFinished } from './worker-observability.js';

async function dispatch(job){
 if(job.job_type==='workflow.run'){
  const {runWorkflow}=await import('./workflow-engine.js');
  const p=job.payload||{};
  if(!p.workflowId)throw new Error('Workflow job requires workflowId');
  return runWorkflow({...p,workspaceId:job.workspace_id});
 }
 if(job.job_type==='approval.execute'){
  const {executeApprovedTask}=await import('./agent-runtime.js');
  const p=job.payload||{};
  if(!p.approvalId)throw new Error('Approval execution job requires approvalId');
  return executeApprovedTask({workspaceId:job.workspace_id,approvalId:p.approvalId,actorUserId:p.actorUserId||null});
 }
 if(job.job_type==='employee.step'){
  const {runEmployeeTask}=await import('./agent-runtime.js');
  const p=job.payload||{},s=p.step||{};
  if(p.graphId&&s.id){
   const r=await query("select s.status,s.output from execution_steps s join execution_graphs g on g.id=s.graph_id where s.graph_id=$1 and s.step_key=$2 and g.workspace_id=$3",[p.graphId,s.id,job.workspace_id]);
   const current=r.rows[0];
   if(current?.status==='succeeded')return {status:'already_completed',output:current.output};
   if(current?.status==='failed')throw new Error(`Execution step is already failed: ${s.id}`);
   if(!current)throw new Error(`Execution step not found: ${s.id}`);
  }
  return runEmployeeTask({workspaceId:job.workspace_id,taskId:p.taskId,employeeId:p.employeeId,action:s.action||'data.analyze',input:s.input||{},graphId:p.graphId||null,stepKey:s.id||null});
 }
 throw new Error(`Unknown job type: ${job.job_type}`);
}
export async function processOneJob({workerId=randomUUID(),workspaceId=null}){
 await heartbeat({workerId,metadata:{workspaceId}});
 const job=await claimJob({workerId,workspaceId});
 if(!job)return null;
 const attempt=await markAttemptStarted({jobId:job.id,workerId,attempt:job.attempts});
 const leaseTimer=setInterval(()=>{renewJobLease({jobId:job.id,workerId}).catch(()=>{});},30_000);
 try{
  const result=await dispatch(job);
  if(result?.status==='awaiting_approval'){
   await markAttemptFinished({attemptId:attempt.id,status:'blocked'});
   await blockJob({jobId:job.id,workerId,result});
   return {id:job.id,status:'blocked',result};
  }
  await markAttemptFinished({attemptId:attempt.id,status:'succeeded'});
  await completeJob({jobId:job.id,workerId,result});
  return {id:job.id,status:'succeeded',result};
 }catch(error){
  await markAttemptFinished({attemptId:attempt.id,status:'failed',error:error.message});
  const failed=await failJob({jobId:job.id,workerId,error});
  if(failed?.status==='queued'&&job.job_type==='employee.step'){
   const p=job.payload||{};
   if(p.taskId)await query("update tasks set status='executing' where id=$1 and workspace_id=$2 and status='failed'",[p.taskId,job.workspace_id]);
   if(p.graphId&&p.step?.id)await query("update execution_steps set status='running',error=null,updated_at=now() where graph_id=$1 and step_key=$2 and status='failed'",[p.graphId,p.step.id]);
  }
  return {id:job.id,status:'failed',error:error.message,retryScheduled:failed?.status==='queued'};
 }finally{clearInterval(leaseTimer);}
}

/**
 * Recover expired leases, then reconcile exhausted employee-step jobs into the
 * graph/task state. Reconciliation is deliberately repeatable: the graph is
 * marked failed last, so a crash between updates leaves it eligible for repair
 * on the next worker poll rather than permanently stranding an executing task.
 */
export async function recoverQueue(workspaceId=null){
 const recovered=await recoverStaleJobs({leaseSeconds:120,workspaceId});
 const args=[];
 const scope=workspaceId?(args.push(workspaceId),' and j.workspace_id=$1'):'';
 const orphaned=(await query(`select j.workspace_id,j.payload,j.last_error
  from job_queue j
  join execution_graphs g on g.id::text=j.payload->>'graphId' and g.workspace_id=j.workspace_id
  join execution_steps s on s.graph_id=g.id and s.step_key=j.payload #>> '{step,id}'
  where j.status='dead' and j.job_type='employee.step' and g.status='running'
    and s.status <> 'succeeded'${scope}
  order by j.updated_at asc limit 100`,args)).rows;
 for(const item of orphaned){
  const p=item.payload||{},step=p.step||{};
  if(!p.graphId||!step.id)continue;
  await query("update execution_steps set status='failed',error=coalesce(error,$3),updated_at=now() where graph_id=$1 and step_key=$2 and status<>'succeeded'",[p.graphId,step.id,item.last_error||'Worker lease expired after maximum attempts']);
  if(p.taskId)await query("update tasks set status='failed',error=coalesce(error,$3) where id=$1 and workspace_id=$2 and status<>'cancelled'",[p.taskId,item.workspace_id,item.last_error||'Employee step exhausted its retry budget']);
  await query("update execution_graphs set status='failed',updated_at=now() where id=$1 and workspace_id=$2 and status='running'",[p.graphId,item.workspace_id]);
 }
 return {recovered:recovered.length,reconciled:orphaned.length};
}
export function installGracefulShutdown({controller}){
 const stop=()=>{if(!controller.signal.aborted)controller.abort();};
 process.once('SIGTERM',stop);process.once('SIGINT',stop);
 return ()=>{process.removeListener('SIGTERM',stop);process.removeListener('SIGINT',stop);};
}
export async function startWorker({workerId=randomUUID(),pollMs=1000,signal}={}){
 await heartbeat({workerId,pollMs});
 while(!signal?.aborted){await recoverQueue();await processOneJob({workerId});await heartbeat({workerId});await new Promise(resolve=>setTimeout(resolve,pollMs));}
 await heartbeat({workerId,status:'offline'});
}
