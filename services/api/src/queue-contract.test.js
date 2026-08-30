import test from 'node:test';
import assert from 'node:assert/strict';
import { enqueueWorkflowRun } from './queue-enqueue.js';
import { processOneJob, recoverQueue } from './queue-worker.js';
import { getQueueHealth } from './worker-observability.js';

test('queue worker exports required production contract',()=>{
 assert.equal(typeof enqueueWorkflowRun,'function');
 assert.equal(typeof processOneJob,'function');
 assert.equal(typeof recoverQueue,'function');
 assert.equal(typeof getQueueHealth,'function');
});

test('queue health function is callable without importing HTTP runtime',()=>{
 assert.ok(getQueueHealth instanceof Function);
});
