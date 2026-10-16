import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const api = await readFile(new URL('../src/index.js', import.meta.url), 'utf8');
const repository = await readFile(new URL('../src/workforce-repository.js', import.meta.url), 'utf8');

test('approval route calls the repository using its positional contract', () => {
  assert.match(api, /decideApproval\(approvalId,workspaceId,status,user\.id\)/);
  assert.match(repository, /export async function decideApproval\(id,workspaceId,status,userId=null\)/);
});
