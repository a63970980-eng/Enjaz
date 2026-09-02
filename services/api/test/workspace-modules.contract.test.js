import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const index=fs.readFileSync(new URL('../src/index.js',import.meta.url),'utf8');

test('workflow endpoint is workspace scoped and aggregates execution steps',()=>{
  assert.match(index,/\/api\/v1\/workflows/);
  assert.match(index,/from execution_graphs g left join execution_steps s on s\.graph_id=g\.id where g\.workspace_id=\$1/);
});

test('integration endpoint excludes encrypted credentials',()=>{
  assert.match(index,/\/api\/v1\/integrations/);
  assert.match(index,/select id,provider,name,config,enabled,last_used_at,created_at,updated_at from integration_connections where workspace_id=\$1/);
  assert.doesNotMatch(index,/select[^;]*encrypted_credentials[^;]*from integration_connections/);
});

test('workspace modules require the shared authenticated workspace gate',()=>{
  const gate=index.indexOf("const workspaceId=url.searchParams.get('workspaceId');const user=await requireWorkspace(req,workspaceId);");
  const workflows=index.indexOf("url.pathname==='/api/v1/workflows'");
  const integrations=index.indexOf("url.pathname==='/api/v1/integrations'");
  assert.ok(gate>=0 && workflows>gate && integrations>gate);
});
