import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const vault=await readFile(new URL('../src/credentials-vault.js',import.meta.url),'utf8');
const guard=await readFile(new URL('../src/credential-guard.js',import.meta.url),'utf8');
const migration=await readFile(new URL('../db/migrations/021_integration_credentials_metadata.sql',import.meta.url),'utf8');

test('credential vault writes only the actual integration connection schema',()=>{
  // The table column is `name`; `display_name` is only the public API alias. A former
  // version inserted into a non-existent display_name column, which broke every save.
  assert.match(vault,/insert into integration_connections \(id,workspace_id,provider,name,encrypted_credentials,config,auth_type,scopes,status,metadata,expires_at\)/);
  assert.doesNotMatch(vault,/insert into integration_connections[\s\S]{0,120}display_name,encrypted_credentials/);
  assert.match(vault,/name as display_name/);
  assert.match(vault,/AES-GCM/);
});

test('revoking a connection uses a status the database constraint accepts',async()=>{
  const revocationMigration=await readFile(new URL('../db/migrations/035_integration_connection_revoked_status.sql',import.meta.url),'utf8');
  assert.match(vault,/set status='revoked'/);
  assert.match(revocationMigration,/check \(status in \('active','disabled','expired','error','revoked'\)\)/i);
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
