import test from 'node:test';
import assert from 'node:assert/strict';
import { enqueueJob } from './job-queue.js';

test('enqueueJob accepts an existing transaction client',async()=>{const calls=[];const client={query:async(sql,args)=>{calls.push({sql,args});return {rows:[{id:args[0],status:'queued'}]}}};const job=await enqueueJob({workspaceId:'w',jobType:'employee.step',payload:{x:1},client});assert.equal(job.status,'queued');assert.equal(calls.length,1);assert.match(calls[0].sql,/insert into job_queue/i);});
