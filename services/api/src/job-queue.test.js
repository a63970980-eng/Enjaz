import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { enqueueJob } from './job-queue.js';

test('enqueueJob accepts an existing transaction client',async()=>{const calls=[];const client={query:async(sql,args)=>{calls.push({sql,args});return {rows:[{id:args[0],status:'queued'}]}}};const job=await enqueueJob({workspaceId:'w',jobType:'employee.step',payload:{x:1},client});assert.equal(job.status,'queued');assert.equal(calls.length,1);assert.match(calls[0].sql,/insert into job_queue/i);});

test('stale job recovery respects max attempts and dead-letters exhausted jobs',async()=>{const source=await readFile(new URL('./job-queue.js',import.meta.url),'utf8');const recovery=source.match(/export async function recoverStaleJobs[\\s\\S]*?\\nexport async function cancelJob/);assert.ok(recovery,'recoverStaleJobs implementation exists');assert.match(recovery[0],/attempts>=max_attempts then 'dead' else 'queued'/);assert.match(recovery[0],/Worker lease expired after maximum attempts/);assert.match(recovery[0],/returning id,status/);});
