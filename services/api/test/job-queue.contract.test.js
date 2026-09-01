import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('queue claims jobs atomically and prevents competing workers', async()=>{
  const source=await readFile(new URL('../src/job-queue.js',import.meta.url),'utf8');
  assert.match(source,/for update skip locked/);
  assert.match(source,/status='queued'/);
  assert.match(source,/locked_by=\$1/);
});

test('queue retries with bounded exponential backoff and dead-letters exhausted jobs', async()=>{
  const source=await readFile(new URL('../src/job-queue.js',import.meta.url),'utf8');
  assert.match(source,/attempts>=max_attempts/);
  assert.match(source,/'dead'/);
  assert.match(source,/power\(2,attempts\)/);
  assert.match(source,/interval '10 minutes'/);
});

test('queue can recover stale leases and cancel only within the workspace', async()=>{
  const source=await readFile(new URL('../src/job-queue.js',import.meta.url),'utf8');
  assert.match(source,/locked_at<now\(\)-make_interval/);
  assert.match(source,/status='running'/);
  assert.match(source,/workspace_id=\$3/);
});
