import { randomUUID } from 'node:crypto';
import { claimJob, completeJob, failJob, recoverStaleJobs } from './job-queue.js';
import { runWorkflow } from './workflow-engine.js';
import { runEmployeeTask } from './agent-runtime.js';
import { heartbeat, markAttemptStarted, markAttemptFinished } from './worker-observability.js';

async function dispatch(job){
 if(job.job_type==='workflow.run') return runWorkflow(job.payload);
 if(job.job_type==='employee.step'){
  const p=job.payload||{},s=p.step||{};
  return runEmployeeTask({workspaceId:job.workspace_id,taskId:p.taskId,employeeId:p.employeeId,action:s.action||'data.analyze',input:s.input||{}});
 }
 throw new Error(`Unknown job type: ${job.job_type}`);
}

export async function processOneJob({workerId=randomUUID()}){
 await heartbeat({workerId});const job=await claimJob({workerId});if(!job)return null;
 const attempt=await markAttemptStarted({jobId:job.id,workerId,attempt:job.attempts});
 try{const result=await dispatch(job);await markAttemptFinished({attemptId:attempt.id,status:'succeeded'});await completeJob({jobId:job.id,workerId,result});return {id:job.id,status:'succeeded',result};}
 catch(error){await markAttemptFinished({attemptId:attempt.id,status:'failed',error:error.message});await failJob({jobId:job.id,workerId,error});return {id:job.id,status:'failed',error:error.message};}
}
export async function recoverQueue(){return recoverStaleJobs({leaseSeconds:120});}
export async function startWorker({workerId=randomUUID(),pollMs=1000,signal}={}){await heartbeat({workerId,metadata:{pollMs}});while(!signal?.aborted){await processOneJob({workerId});await heartbeat({workerId});await new Promise(resolve=>setTimeout(resolve,pollMs));}await heartbeat({workerId,status:'offline'});}
export function installGracefulShutdown({controller}){const stop=()=>{if(!controller.signal.aborted)controller.abort();};process.once('SIGTERM',stop);process.once('SIGINT',stop);return ()=>{process.removeListener('SIGTERM',stop);process.removeListener('SIGINT',stop);};}
