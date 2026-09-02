import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('API exposes the tool catalog only through an authenticated workspace route', async()=>{
  const source=await readFile(new URL('../src/index.js',import.meta.url),'utf8');
  assert.match(source,/import \{ listTools \} from '\.\/tool-registry\.js'/);
  assert.match(source,/url\.pathname==='\/api\/v1\/tools'/);
  assert.match(source,/const workspaceId=url\.searchParams\.get\('workspaceId'\);const user=await requireWorkspace/);
  assert.match(source,/data:listTools\(\)/);
});

test('tool registry does not expose executable functions in its catalog', async()=>{
  const source=await readFile(new URL('../src/tool-registry.js',import.meta.url),'utf8');
  assert.match(source,/map\(\(\{name,description,risk\}\)=>\(\{name,description,risk\}\)\)/);
});
