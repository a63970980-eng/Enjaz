import { randomUUID } from 'node:crypto';
import { claimJob, completeJob, failJob, recoverStaleJobs } from './job-queue.js';
import { runWorkflow } from './workflow-engine.js';
import { heartbeat, markAttemptStarted, markAttemptFinished } from './worker-observability.js';

export async function processOneJob({workerId=randomUUID()}){await heartbeat({workerId});const job=await claimJob({workerId});if(!job)return null;const attempt=await markAttemptStarted({jobId:job.id,workerId,attempt:job.attempts});try{let result;if(job.job_type==='workflow.run')result=await runWorkflow(job.payload);else throw new Error(`Unknown job type: ${job.job_type}`);await markAttemptFinished({attemptId:attempt.id,status:'succeeded'});await completeJob({jobId:job.id,workerId,result});return {id:job.id,status:'succeeded',result};}catch(error){await markAttemptFinished({attemptId:attempt.id,status:'failed',error:error.message});await failJob({jobId:job.id,workerId,error});return {id:job.id,status:'failed',error:error.message};}}
export async function recoverQueue(){return recoverStaleJobs({leaseSeconds:120});}
export async function startWorker({workerId=randomUUID(),pollMs=1000,signal}={}){await heartbeat({workerId,metadata:{pollMs}});while(!signal?.aborted){await processOneJob({workerId});await heartbeat({workerId});await new Promise(resolve=>setTimeout(resolve,pollMs));}await heartbeat({workerId,status:'offline'});}
export function installGracefulShutdown({controller,workerId}){const stop=()=>{if(!controller.signal.aborted)controller.abort();};process.once('SIGTERM',stop);process.once('SIGINT',stop);return ()=>{process.removeListener('SIGTERM',stop);process.removeListener('SIGINT',stop);};}
