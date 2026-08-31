import test from 'node:test';
import assert from 'node:assert/strict';
import { processOneJob } from './queue-worker.js';
import * as queue from './job-queue.js';
import * as obs from './worker-observability.js';

const original={claim:queue.claimJob,complete:queue.completeJob,fail:queue.failJob,start:obs.markAttemptStarted,finish:obs.markAttemptFinished,heartbeat:obs.heartbeat};
test.after(()=>Object.assign(queue,{claimJob:original.claim,completeJob:original.complete,failJob:original.fail}));

test('worker safely ignores empty queue',async()=>{obs.heartbeat=async()=>{};queue.claimJob=async()=>null;assert.equal(await processOneJob({workerId:'test-worker'}),null);});
