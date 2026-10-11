import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPoolOptions } from './db.js';

test('database pool verifies TLS certificates by default and uses bounded timeouts', () => {
  const options = buildPoolOptions({ DATABASE_URL: 'postgresql://db.example/enjaz' });
  assert.equal(options.connectionString, 'postgresql://db.example/enjaz');
  assert.deepEqual(options.ssl, { rejectUnauthorized: true });
  assert.equal(options.max, 5);
  assert.equal(options.connectionTimeoutMillis, 5000);
  assert.equal(options.statement_timeout, 15000);
  assert.equal(options.query_timeout, 20000);
  assert.equal(options.idle_in_transaction_session_timeout, 10000);
});

test('database pool accepts a configured private CA without disabling verification', () => {
  const options = buildPoolOptions({
    DATABASE_URL: 'postgresql://db.example/enjaz',
    DATABASE_CA: 'test-private-ca'
  });
  assert.deepEqual(options.ssl, { rejectUnauthorized: true, ca: 'test-private-ca' });
});

test('production forbids disabling TLS or certificate verification', () => {
  assert.throws(
    () => buildPoolOptions({ DATABASE_URL: 'postgresql://db.example/enjaz', NODE_ENV: 'production', DATABASE_SSL: 'false' }),
    /DATABASE_SSL=false is forbidden in production/
  );
  assert.throws(
    () => buildPoolOptions({ DATABASE_URL: 'postgresql://db.example/enjaz', NODE_ENV: 'production', DATABASE_SSL_REJECT_UNAUTHORIZED: 'false' }),
    /DATABASE_SSL_REJECT_UNAUTHORIZED=false is forbidden in production/
  );
});

test('database pool rejects invalid configuration rather than silently coercing it', () => {
  assert.throws(() => buildPoolOptions({}), /DATABASE_URL is required/);
  assert.throws(() => buildPoolOptions({ DATABASE_URL: 'postgresql://db.example/enjaz', DATABASE_SSL: 'sometimes' }), /DATABASE_SSL must be/);
  assert.throws(() => buildPoolOptions({ DATABASE_URL: 'postgresql://db.example/enjaz', DB_POOL_SIZE: '0' }), /DB_POOL_SIZE must be a positive integer/);
  assert.throws(() => buildPoolOptions({ DATABASE_URL: 'postgresql://db.example/enjaz', DB_QUERY_TIMEOUT_MS: 'NaN' }), /DB_QUERY_TIMEOUT_MS must be a positive integer/);
});
