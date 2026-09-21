import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const entry=await readFile(new URL('./app-entry-v2.js',import.meta.url),'utf8');
const workspace=await readFile(new URL('./workspace-app-v4.js',import.meta.url),'utf8');
const library=await readFile(new URL('./ready-workforce-catalog.js',import.meta.url),'utf8');

test('current workspace entrypoint boots the canonical V4 application',()=>{
  assert.match(entry,/workspace-app-v4\.js/);
  assert.doesNotMatch(entry,/workspace-app-v3\.js/);
  assert.match(workspace,/ENJAZ_WORKSPACE_V4/);
});

test('workforce entry stays on the ready workforce library path',()=>{
  assert.match(workspace,/data-open-library/);
  assert.match(library,/catalog|workforce|sector/i);
});