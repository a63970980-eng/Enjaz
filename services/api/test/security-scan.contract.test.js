import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.dirname(fileURLToPath(import.meta.url));
const migrations=path.join(root,'../db/migrations');

test('security scan: no runtime migration may reintroduce unrestricted authenticated heartbeat reads', async()=>{
  const files=(await readdir(migrations)).filter(f=>f.endsWith('.sql')).sort();
  for(const file of files){
    const source=await readFile(path.join(migrations,file),'utf8');
    assert.doesNotMatch(source,/create policy[^\n]*worker_heartbeats[^\n]*for select[\s\S]{0,300}?using\s*\(\s*true\s*\)/i,`unsafe heartbeat SELECT policy in ${file}`);
  }
});

test('security scan: migrations use row-level security for tenant runtime data', async()=>{
  const source=await readFile(path.join(migrations,'003_runtime_rls.sql'),'utf8');
  for(const table of ['ai_employees','tasks','approvals','employee_memory','job_queue']){
    assert.match(source,new RegExp(`alter table ${table} enable row-level security`,'i'));
  }
});
