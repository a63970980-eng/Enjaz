import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { readJsonBody } from '../src/request-body.js';

test('JSON request parser accepts valid UTF-8 JSON and empty bodies', async () => {
  assert.deepEqual(await readJsonBody(Readable.from([Buffer.from('{"ok":true}') ])), { ok: true });
  assert.deepEqual(await readJsonBody(Readable.from([])), {});
});

test('JSON request parser rejects malformed JSON with a client error', async () => {
  await assert.rejects(readJsonBody(Readable.from([Buffer.from('{broken')])), { status: 400, message: 'Invalid JSON body' });
});

test('JSON request parser enforces the byte limit and stops buffering after rejection', async () => {
  const stream = Readable.from([Buffer.alloc(6), Buffer.alloc(6), Buffer.alloc(1024)]);
  await assert.rejects(readJsonBody(stream, { limitBytes: 10 }), { status: 413, message: 'Request body too large' });
});
