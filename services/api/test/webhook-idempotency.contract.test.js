import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source=await readFile(new URL('../src/integrations/webhook-tool.js',import.meta.url),'utf8');
const runtime=await readFile(new URL('../src/agent-runtime.js',import.meta.url),'utf8');

test('webhook execution receives a bounded idempotency key',()=>{
  assert.match(source,/context\.executionKey/);
  assert.match(source,/headers\['Idempotency-Key'\]/);
  assert.match(source,/executionKey\.slice\(0,200\)/);
});

test('approved execution derives its idempotency key from the approval identity',()=>{
  assert.match(runtime,/executionKey:`approval:\$\{approvalId\}`/);
});
