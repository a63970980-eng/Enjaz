import test from 'node:test';
import assert from 'node:assert/strict';
import { rateLimit, clearRateLimitStore } from '../src/rate-limit.js';

test.afterEach(clearRateLimitStore);

test('rate limiter allows the configured burst and blocks the next request', () => {
  const limit = rateLimit({ windowMs: 60_000, max: 2 });
  assert.equal(limit('client').allowed, true);
  assert.equal(limit('client').allowed, true);
  const blocked = limit('client');
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.remaining, 0);
});

test('rate limiter isolates clients', () => {
  const limit = rateLimit({ windowMs: 60_000, max: 1 });
  assert.equal(limit('a').allowed, true);
  assert.equal(limit('a').allowed, false);
  assert.equal(limit('b').allowed, true);
});
