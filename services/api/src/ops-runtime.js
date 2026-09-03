import { heartbeat, getWorkerHealth, getQueueHealth } from './worker-observability.js';
import { recoverQueue } from './queue-worker.js';
import { query, closeDb } from './db.js';

export async function runOpsRecovery(){
  const recovered=await recoverQueue();
  return {recoveredCount:recovered.length,recovered};
}
export async function getOpsSnapshot({workspaceId=null}={}){
  const [workers,queue]=await Promise.all([getWorkerHealth({staleSeconds:90}),getQueueHealth(workspaceId)]);
  const recent=workspaceId?(await query(`select ja.id,ja.job_id,ja.worker_id,ja.attempt,ja.status,ja.error,ja.started_at,ja.finished_at,j.job_type from job_attempts ja join job_queue j on j.id=ja.job_id where j.workspace_id=$1 order by ja.started_at desc limit 20`,[workspaceId])).rows:[];
  const workerSummary={total:workers.length,healthy:workers.filter(w=>w.healthy).length,unhealthy:workers.filter(w=>!w.healthy).length};
  return {timestamp:new Date().toISOString(),workers,workerSummary,queue,recent,workspaceId};
}
export function installWorkerLifecycle({workerId,controller}){
  let stopped=false;
  const stop=async()=>{if(stopped)return;stopped=true;controller?.abort();try{await heartbeat({workerId,status:'offline'});}finally{await closeDb();}};
  process.once('SIGTERM',stop);process.once('SIGINT',stop);
  return stop;
}
