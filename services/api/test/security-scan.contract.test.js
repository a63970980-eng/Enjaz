import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.dirname(fileURLToPath(import.meta.url));
const migrations=path.join(root,'../db/migrations');

async function migration(name){
  return readFile(path.join(migrations,name),'utf8');
}

test('security scan: no runtime migration may reintroduce unrestricted authenticated heartbeat reads', async()=>{
  const files=(await readdir(migrations)).filter(f=>f.endsWith('.sql')).sort();
  for(const file of files){
    const source=await migration(file);
    assert.doesNotMatch(source,/create policy[^\n]*worker_heartbeats[^\n]*for select[\s\S]{0,300}?using\s*\(\s*true\s*\)/i,`unsafe heartbeat SELECT policy in ${file}`);
  }
});

test('security scan: tenant runtime data has RLS and heartbeat browser access is removed', async()=>{
  const runtime=await migration('003_runtime_rls.sql');
  const core=await migration('006_core_security.sql');
  for(const table of ['job_queue','workflow_triggers','webhook_deliveries','workflow_schedules','worker_heartbeats','job_attempts']){
    assert.match(runtime,new RegExp(`alter table public\\.${table} enable row level security`,'i'));
  }
  for(const table of ['ai_employees','tasks','approvals','audit_events','ai_employee_memory']){
    assert.match(core,new RegExp(`alter table public\\.${table} enable row level security`,'i'));
  }
  assert.match(core,/drop policy if exists worker_heartbeats_authenticated_read on public\.worker_heartbeats/i);
});
