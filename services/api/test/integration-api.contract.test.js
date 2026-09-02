import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source=await readFile(new URL('../src/index.js',import.meta.url),'utf8');
const vault=await readFile(new URL('../src/credentials-vault.js',import.meta.url),'utf8');

test('integration creation is manager-only and workspace scoped',()=>{
  assert.match(source,/url\.pathname==='\/api\/v1\/integrations'/);
  assert.match(source,/if\(req\.method==='POST'&&url\.pathname==='\/api\/v1\/integrations'\)\{requireManager\(user\)/);
  assert.match(source,/saveConnection\(\{\.\.\.input,workspaceId,actorUserId:user\.id\}\)/);
});

test('integration listing uses the credential-safe vault projection',()=>{
  assert.match(source,/listConnections\(workspaceId\)/);
  assert.doesNotMatch(source,/select[^;]*encrypted_credentials[^;]*integration_connections/);
});

test('integration revocation is manager-only, workspace scoped, and audited',()=>{
  assert.match(source,/const integrationMatch=url\.pathname\.match\(\/\^\\\\\/api\\\\\/v1\\\\\/integrations\\\\\/\(\[\^\\\\\/\]\+\)\\\\\/revoke\$\/\)/);
  assert.match(source,/req\.method==='DELETE'&&integrationMatch\)\{requireManager\(user\)/);
  assert.match(source,/revokeConnection\(\{workspaceId,connectionId:integrationMatch\[1\],actorUserId:user\.id\}\)/);
  assert.match(vault,/update integration_connections set enabled=false,status='revoked'/);
  assert.match(vault,/where id=\$1 and workspace_id=\$2/);
  assert.match(vault,/integration\.revoked/);
  assert.doesNotMatch(vault,/returning[^;]*encrypted_credentials/);
});
