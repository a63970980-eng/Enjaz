import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const repo=await readFile(new URL('../src/workforce-repository.js',import.meta.url),'utf8');

test('approval creation must verify task employee belongs to the same workspace',()=>{
  assert.match(repo,/join ai_employees e on e\.id=t\.employee_id and e\.workspace_id=t\.workspace_id/);
  assert.match(repo,/where t\.id=\$1 and t\.workspace_id=\$2/);
});
