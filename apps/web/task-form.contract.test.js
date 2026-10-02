import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const entry=await readFile(new URL('./app-entry-v2.js',import.meta.url),'utf8');
const workspace=await readFile(new URL('./workspace-app-v4.js',import.meta.url),'utf8');
const library=await readFile(new URL('./ready-workforce-catalog.js',import.meta.url),'utf8');
const auth=await readFile(new URL('./auth-gate-v2.js',import.meta.url),'utf8');
const industry=await readFile(new URL('./enjaz-industry-library.js',import.meta.url),'utf8');
const landing=await readFile(new URL('./landing.js',import.meta.url),'utf8');

test('current workspace entrypoint boots the canonical V4 application',()=>{
  assert.match(entry,/workspace-app-v4\.js/);
  assert.doesNotMatch(entry,/workspace-app-v3\.js/);
  assert.match(workspace,/ENJAZ_WORKSPACE_V4/);
});

test('workforce entry stays on the ready workforce library path',()=>{
  assert.match(workspace,/data-open-library/);
  assert.match(library,/catalog|workforce|sector/i);
});

test('public onboarding uses the backend industry pack identifiers',()=>{
  for(const id of ['restaurant','hospital','hotel','enterprise','government'])assert.match(auth,new RegExp(`['"]${id}['"]`));
  for(const unsupported of ['restaurants','hospitals','hotels','companies'])assert.doesNotMatch(auth,new RegExp(`['"]${unsupported}['"]`));
});

test('public catalog exposes only the five supported industry packs',()=>{
  assert.match(industry,/supported=\['restaurant','hospital','hotel','enterprise','government'\]/);
  assert.match(industry,/للقطاعات الخمسة/);
});

test('canonical public landing is separated from authentication and marks its preview',()=>{
  assert.match(landing,/export function renderLanding/);
  assert.match(landing,/PREVIEW/);
  assert.match(landing,/data-public-login/);
});

test('workspace exposes governed employee builder and execution workflow entry',()=>{
  assert.match(workspace,/AI EMPLOYEE BUILDER/);
  assert.match(workspace,/apiClient\.createEmployee/);
  assert.match(workspace,/data-build-workflow/);
  assert.match(workspace,/apiClient\.createTask/);
  assert.match(workspace,/data-task-id/);
});