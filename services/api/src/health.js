import { getWorkerHealth, getQueueHealth } from './worker-observability.js';
import { query } from './db.js';

export async function getHealth(){
 const started=Date.now();
 try{
  await query('select 1');
  const [workers,queue]=await Promise.all([getWorkerHealth({staleSeconds:90}),getQueueHealth()]);
  const healthy=workers.filter(w=>w.healthy).length;
  return {status:workers.length===0||healthy>0?'ok':'degraded',db:'ok',workers:{total:workers.length,healthy},queue,latencyMs:Date.now()-started,timestamp:new Date().toISOString()};
 }catch(error){return {status:'unhealthy',db:'error',error:error.message,latencyMs:Date.now()-started,timestamp:new Date().toISOString()};}
}
