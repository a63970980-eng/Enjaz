import { randomUUID } from 'node:crypto';
import { startWorker, installGracefulShutdown } from './queue-worker.js';

const controller=new AbortController();
const workerId=process.env.ENJAZ_WORKER_ID||`worker-${randomUUID()}`;
const pollMs=Math.max(250,Number(process.env.ENJAZ_WORKER_POLL_MS||1000));
const removeShutdown=installGracefulShutdown({controller});

console.log(`[ENJAZ worker] online: ${workerId}`);

startWorker({workerId,pollMs,signal:controller.signal})
 .catch(error=>{console.error('[ENJAZ worker] fatal error',error);process.exitCode=1;})
 .finally(()=>{removeShutdown();});
