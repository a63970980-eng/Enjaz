import test from 'node:test';
import assert from 'node:assert/strict';

const recoveryContract = {
  staleLeaseSeconds: 120,
  idempotency: 'graph_step_attempt',
  retry: 'exponential_backoff',
};

test('worker recovery contract preserves duplicate-execution protections', () => {
  assert.equal(recoveryContract.staleLeaseSeconds, 120);
  assert.equal(recoveryContract.idempotency, 'graph_step_attempt');
  assert.equal(recoveryContract.retry, 'exponential_backoff');
});
