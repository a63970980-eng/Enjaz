import { randomUUID } from 'node:crypto';
import { claimJob, completeJob, failJob, recoverStaleJobs } from './job-queue.js';
import { runEmployeeTask } from './agent-runtime.js';
import { query } from './db.js';

const workerId=process.env.ENJAZ_WORKER_ID||`worker-${randomUUID()}`;
const pollMs=Math.max(250,Number(process.env.ENJAZ_WORKER_POLL_MS||1000));
const leaseMs=Math.max(10_000,Number(process.env.ENJAZ_WORKER_LEASE_MS||120_000));
let stopped=false;

async function executeJob(job){
  if(job.job_type!=='employee.step')throw new Error(`Unsupported job type: ${job.job_type}`);
  const payload=job.payload||{};
  const step=payload.step||{};
  if(!payload.workspaceId||!payload.taskId||!payload.employeeId||!step.action)throw new Error('Malformed employee.step payload');
  return runEmployeeTask({workspaceId:payload.workspaceId,taskId:payload.taskId,employeeId:payload.employeeId,action:step.action,input:step.input||{},graphId:payload.graphId||null,stepKey:step.id||step.stepKey||null});
}

async function tick(){
  const stale=await recoverStaleJobs({leaseSeconds:Math.ceil(leaseMs/1000)});
  if(stale.length)console.log(`[ENJAZ worker] recovered ${stale.length} stale job(s)`);
  const job=await claimJob({workerId});
  if(!job)return false;
  try{
    const result=await executeJob(job);
    await completeJob({jobId:job.id,workerId,result});
    console.log(`[ENJAZ worker] completed ${job.id}`);
  }catch(error){
    await failJob({jobId:job.id,workerId,error});
    try{await query("insert into audit_events (id,workspace_id,task_id,event_type,actor_type,action,metadata) values($1,$2,$3,$4,$5,$6,$7::jsonb)",[randomUUID(),job.workspace_id,job.payload?.taskId||null,'worker.job_failed','system','employee.step',JSON.stringify({jobId:job.id,error:error.message,attempts:job.attempts})]);}catch(auditError){console.error('[ENJAZ worker] audit failure',auditError);}
    console.error(`[ENJAZ worker] failed ${job.id}: ${error.message}`);
  }
  return true;
}

async function loop(){while(!stopped){try{const didWork=await tick();if(!didWork)await new Promise(resolve=>setTimeout(resolve,pollMs));}catch(error){console.error('[ENJAZ worker] tick failure',error);await new Promise(resolve=>setTimeout(resolve,pollMs));}}}
function shutdown(signal){if(stopped)return;stopped=true;console.log(`[ENJAZ worker] shutting down (${signal})`);}
process.once('SIGTERM',()=>shutdown('SIGTERM'));process.once('SIGINT',()=>shutdown('SIGINT'));
console.log(`[ENJAZ worker] online: ${workerId}`);
void loop();
