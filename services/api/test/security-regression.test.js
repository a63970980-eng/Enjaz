import test from 'node:test';
import assert from 'node:assert/strict';
import { rateLimit, clearRateLimitStore } from '../src/rate-limit.js';

test.afterEach(clearRateLimitStore);

test('security regression: rate limits are independent per client key', () => {
  const limiter = rateLimit({ windowMs: 60_000, max: 2 });
  assert.equal(limiter('workspace-a-user-a').allowed, true);
  assert.equal(limiter('workspace-a-user-a').allowed, true);
  assert.equal(limiter('workspace-a-user-a').allowed, false);
  assert.equal(limiter('workspace-b-user-b').allowed, true);
});

test('security regression: limiter exposes a bounded reset time', () => {
  const limiter = rateLimit({ windowMs: 5_000, max: 1 });
  const result = limiter('client');
  assert.equal(result.allowed, true);
  assert.ok(result.resetAt >= Date.now());
  assert.equal(result.remaining, 0);
});
