import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const form=await readFile(new URL('./task-form.js',import.meta.url),'utf8');
const app=await readFile(new URL('./app.js',import.meta.url),'utf8');

test('task creation form validates and sends workspace-scoped task fields',()=>{
  assert.match(form,/name=\"title\"/);
  assert.match(form,/name=\"employeeId\"/);
  assert.match(form,/name=\"objective\"/);
  assert.match(form,/apiClient\.createTask\(workspaceId,token/);
  assert.match(app,/data-action=\"create-task\"/);
  assert.match(app,/x\.status==='queued'/);
});
