import { heartbeat, getWorkerHealth, getQueueHealth } from './worker-observability.js';
import { recoverQueue } from './queue-worker.js';
import { closeDb } from './db.js';

export async function runOpsRecovery(){
  const recovered=await recoverQueue();
  return {recoveredCount:recovered.length,recovered};
}
export async function getOpsSnapshot({workspaceId=null}={}){
  const [workers,queue]=await Promise.all([getWorkerHealth({staleSeconds:90}),getQueueHealth(workspaceId)]);
  return {timestamp:new Date().toISOString(),workers,queue,workspaceId};
}
export function installWorkerLifecycle({workerId,controller}){
  let stopped=false;
  const stop=async()=>{if(stopped)return;stopped=true;controller?.abort();try{await heartbeat({workerId,status:'offline'});}finally{await closeDb();}};
  process.once('SIGTERM',stop);process.once('SIGINT',stop);
  return stop;
}
