import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source=await readFile(new URL('../src/index.js',import.meta.url),'utf8');

test('integration creation is manager-only and workspace scoped',()=>{
  assert.match(source,/url\.pathname==='\/api\/v1\/integrations'/);
  assert.match(source,/if\(req\.method==='POST'&&url\.pathname==='\/api\/v1\/integrations'\)\{requireManager\(user\)/);
  assert.match(source,/saveConnection\(\{\.\.\.input,workspaceId\}\)/);
});

test('integration listing uses the credential-safe vault projection',()=>{
  assert.match(source,/listConnections\(workspaceId\)/);
  assert.doesNotMatch(source,/select[^;]*encrypted_credentials[^;]*integration_connections/);
});
