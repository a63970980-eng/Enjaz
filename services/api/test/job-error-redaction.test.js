import test from 'node:test';
import assert from 'node:assert/strict';
import { safeJobErrorCode } from '../src/queue-worker.js';

test('queue failures persist safe error identifiers, never raw messages', () => {
  const error = new Error('Authorization: Bearer secret-token https://internal.local/private');
  assert.equal(safeJobErrorCode(error), 'Error');
  assert.equal(safeJobErrorCode(Object.assign(new Error('db details'), { code: '23505' })), 'code:23505');
  assert.equal(safeJobErrorCode({ name: 'Bad\nError', code: 'Bearer secret' }), 'JobExecutionError');
});
