import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const vault=await readFile(new URL('../src/credentials-vault.js',import.meta.url),'utf8');
const guard=await readFile(new URL('../src/credential-guard.js',import.meta.url),'utf8');
const migration=await readFile(new URL('../db/migrations/021_integration_credentials_metadata.sql',import.meta.url),'utf8');

test('credential vault writes only the actual integration connection schema',()=>{
  assert.match(vault,/insert into integration_connections \(id,workspace_id,provider,name,encrypted_credentials,config,enabled,auth_type,scopes,status,metadata,expires_at\)/);
  assert.doesNotMatch(vault,/insert into integration_connections \([^)]*display_name/);
  assert.match(vault,/AES-GCM/);
});

test('credential guard requires the employee and integration to share a workspace',()=>{
  assert.match(guard,/ic\.workspace_id=\$2/);
  assert.match(guard,/e\.id=\$3/);
  assert.match(guard,/e\.workspace_id=ic\.workspace_id/);
  assert.match(guard,/e\.status=\$4/);
});

test('integration metadata migration is additive and constrains credential status',()=>{
  for(const column of ['auth_type','scopes','status','metadata','expires_at'])assert.match(migration,new RegExp(`add column if not exists ${column}`));
  assert.match(migration,/check \(status in \('active','disabled','expired','error'\)\)/);
});

test('public integration metadata rejects secret-like fields instead of storing them',()=>{
  assert.match(vault,/validatePublicMetadata/);
  assert.match(vault,/password\|secret\|token\|api/);
  assert.match(vault,/secret-like field/);
});
