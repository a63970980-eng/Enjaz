import test from 'node:test';
import assert from 'node:assert/strict';
import { requestContext, requestDuration } from '../src/request-context.js';

test('request context accepts a safe correlation id', () => {
  const context = requestContext({ headers: { 'x-request-id': 'client-123' } });
  assert.equal(context.id, 'client-123');
  assert.equal(typeof context.startedAt, 'number');
});

test('request context replaces unsafe or oversized correlation ids', () => {
  const context = requestContext({ headers: { 'x-request-id': '<script>alert(1)</script>' } });
  assert.notEqual(context.id, '<script>alert(1)</script>');
});

test('request duration is non-negative', () => {
  const context = requestContext({ headers: {} });
  assert.ok(requestDuration(context) >= 0);
});
