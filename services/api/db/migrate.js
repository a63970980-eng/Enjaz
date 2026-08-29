import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPool } from '../src/db.js';

const here=path.dirname(fileURLToPath(import.meta.url));
const migrationsDir=path.join(here,'migrations');
const pool=getPool();
try {
  await pool.query('create table if not exists schema_migrations (version text primary key, applied_at timestamptz not null default now())');
  const files=(await fs.readdir(migrationsDir)).filter(f=>f.endsWith('.sql')).sort();
  for(const file of files){
    const version=file.replace(/\.sql$/,'');
    const exists=await pool.query('select 1 from schema_migrations where version=$1',[version]);
    if(exists.rowCount) continue;
    const sql=await fs.readFile(path.join(migrationsDir,file),'utf8');
    const client=await pool.connect();
    try { await client.query('begin'); await client.query(sql); await client.query('insert into schema_migrations(version) values($1) on conflict do nothing',[version]); await client.query('commit'); console.log(`applied ${version}`); }
    catch(error){await client.query('rollback');throw error;} finally {client.release();}
  }
} finally { await pool.end(); }
