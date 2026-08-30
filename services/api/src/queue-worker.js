import { randomUUID } from 'node:crypto';
import { claimJob, completeJob, failJob, recoverStaleJobs } from './job-queue.js';
import { runWorkflow } from './workflow-engine.js';

export async function processOneJob({workerId=randomUUID()}){const job=await claimJob({workerId});if(!job)return null;try{let result;if(job.job_type==='workflow.run')result=await runWorkflow(job.payload);else throw new Error(`Unknown job type: ${job.job_type}`);await completeJob({jobId:job.id,workerId,result});return {id:job.id,status:'succeeded',result};}catch(error){await failJob({jobId:job.id,workerId,error});return {id:job.id,status:'failed',error:error.message};}}
export async function recoverQueue(){return recoverStaleJobs({leaseSeconds:120});}
export async function startWorker({workerId=randomUUID(),pollMs=1000,signal}={}){while(!signal?.aborted){await processOneJob({workerId});await new Promise(resolve=>setTimeout(resolve,pollMs));}}
