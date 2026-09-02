import { randomUUID } from 'node:crypto';
import { query } from './db.js';
import { claimJob, completeJob, failJob, recoverStaleJobs, renewJobLease } from './job-queue.js';
import { runWorkflow } from './workflow-engine.js';
import { runEmployeeTask } from './agent-runtime.js';
import { heartbeat, markAttemptStarted, markAttemptFinished } from './worker-observability.js';

async function dispatch(job){
 if(job.job_type==='workflow.run'){
  const p=job.payload||{};
  if(!p.workflowId)throw new Error('Workflow job requires workflowId');
  return runWorkflow({...p,workspaceId:job.workspace_id});
 }
 if(job.job_type==='employee.step'){
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
export async function processOneJob({workerId=randomUUID()}){await heartbeat({workerId});const job=await claimJob({workerId});if(!job)return null;const attempt=await markAttemptStarted({jobId:job.id,workerId,attempt:job.attempts});const leaseTimer=setInterval(()=>{renewJobLease({jobId:job.id,workerId}).catch(()=>{});},30_000);try{const result=await dispatch(job);await markAttemptFinished({attemptId:attempt.id,status:'succeeded'});await completeJob({jobId:job.id,workerId,result});return {id:job.id,status:'succeeded',result};}catch(error){await markAttemptFinished({attemptId:attempt.id,status:'failed',error:error.message});const failed=await failJob({jobId:job.id,workerId,error});if(failed?.status==='queued'&&job.job_type==='employee.step'){const p=job.payload||{};if(p.taskId)await query("update tasks set status='executing' where id=$1 and workspace_id=$2 and status='failed'",[p.taskId,job.workspace_id]);if(p.graphId&&p.step?.id)await query("update execution_steps set status='running',error=null,updated_at=now() where graph_id=$1 and step_key=$2 and status='failed'",[p.graphId,p.step.id]);}return {id:job.id,status:'failed',error:error.message,retryScheduled:failed?.status==='queued'};}finally{clearInterval(leaseTimer);}}
export async function recoverQueue(){return recoverStaleJobs({leaseSeconds:120});}
export function installGracefulShutdown({controller}){const stop=()=>{if(!controller.signal.aborted)controller.abort();};process.once('SIGTERM',stop);process.once('SIGINT',stop);return ()=>{process.removeListener('SIGTERM',stop);process.removeListener('SIGINT',stop);};}
export async function startWorker({workerId=randomUUID(),pollMs=1000,signal}={}){await heartbeat({workerId,metadata:{pollMs}});while(!signal?.aborted){await recoverQueue();await processOneJob({workerId});await heartbeat({workerId});await new Promise(resolve=>setTimeout(resolve,pollMs));}await heartbeat({workerId,status:'offline'});}
